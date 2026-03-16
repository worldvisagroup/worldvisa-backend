'use strict';

/**
 * Email Controller — Production Ready
 *
 * Handles:
 *  - Resend inbound webhook (email.received) + outbound delivery events
 *  - Gmail OAuth flow (one-time refresh_token acquisition)
 *  - Gmail history sync (admin, Redis-locked)
 *  - Email CRUD: list (threaded), get by id, get with thread, send
 *
 * Attachment URL strategy:
 *  - Gmail attachments: storage_key stored in MongoDB → signed URL hydrated at read time
 *  - Resend inbound attachments: provider_attachment_id stored → R2 upload re-enable when needed
 */

const mongoose      = require('mongoose');
const { Webhook }   = require('svix');
const { google }    = require('googleapis');

const Email            = require('../models/email');
const logger           = require('../utils/logger');
const gmailSyncService = require('../services/gmail/gmailSyncService');
const emailService     = require('../services/notifications/emailService');
const { redis }        = require('../services/redis');
const { uploadToR2, getEmailAttachmentKey } = require('../services/r2Client');

// ─── Constants ────────────────────────────────────────────────────────────────

const GMAIL_SCOPE             = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_SYNC_REDIS_KEY    = 'gmail:sync:lock';
const GMAIL_SYNC_COOLDOWN_SEC = 5 * 60; // 5 minutes

const DEFAULT_EMAIL_LIMIT  = 20;
const MAX_EMAIL_LIMIT       = 50;
const MAX_THREAD_MESSAGES   = 100;
const MAX_ATTACHMENTS       = 10;
const MAX_ATTACHMENT_BYTES  = 25 * 1024 * 1024; // 25 MB

/**
 * Resend event type → Email.last_event value.
 * Add entries here as you enable more Resend webhook events.
 */
// Only inbound emails are stored via webhook; outbound emails are stored at send time.

// ─── Unread count Redis cache helpers ─────────────────────────────────────────

const UNREAD_CACHE_KEY = 'email:unread:total';
const UNREAD_CACHE_TTL = 60; // seconds

async function getCachedUnreadCount() {
  if (!redis) return null;
  try {
    const val = await redis.get(UNREAD_CACHE_KEY);
    return val !== null ? parseInt(val, 10) : null;
  } catch { return null; }
}

async function setCachedUnreadCount(count) {
  if (!redis) return;
  try { await redis.set(UNREAD_CACHE_KEY, String(count), 'EX', UNREAD_CACHE_TTL); } catch {}
}

async function invalidateUnreadCache() {
  if (!redis) return;
  try { await redis.del(UNREAD_CACHE_KEY); } catch {}
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

function buildOAuthClient(redirectUri) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
}

function resolveRedirectUri(req) {
  return (
    process.env.GMAIL_OAUTH_REDIRECT_URI ??
    `${req.protocol}://${req.get('host')}/api/email/oauth/callback`
  );
}

// ─── Resend inbound: fetch full content + upload attachments ─────────────────

async function processInboundEmail(emailId, eventData) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const headers = { Authorization: `Bearer ${apiKey}` };

  // 1. Full email content (html, text, headers)
  const emailRes = await fetch(
    `https://api.resend.com/emails/receiving/${emailId}`,
    { headers }
  );
  if (!emailRes.ok) {
    throw new Error(`Resend email fetch failed: ${emailRes.status} ${emailRes.statusText}`);
  }
  const emailData = await emailRes.json();

  // 2. Attachment list
  const attachRes = await fetch(
    `https://api.resend.com/emails/receiving/${emailId}/attachments`,
    { headers }
  );
  const attachBody  = attachRes.ok ? await attachRes.json() : { data: [] };
  const attachList  = Array.isArray(attachBody.data) ? attachBody.data : [];

  // 3. Download each attachment and upload to R2
  const msgId            = emailData.message_id ?? emailId;
  const storedAttachments = [];

  for (const att of attachList) {
    // Skip inline CID images and known signature assets (logos, Zoho icons)
    const attDisp = (att.content_disposition ?? '').toLowerCase();
    const attName = (att.filename ?? '').toLowerCase();
    if (
      attDisp === 'inline'       ||
      att.content_id             ||
      attName.includes('logo')   ||
      attName.includes('zoho')
    ) continue;

    const meta = {
      filename:               att.filename    ?? 'attachment',
      content_type:           att.content_type ?? 'application/octet-stream',
      size:                   att.size         ?? 0,
      storage_key:            '',
      provider_attachment_id: att.id           ?? null,
    };

    try {
      const fileRes = await fetch(att.download_url);
      if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.status}`);
      const buffer = Buffer.from(await fileRes.arrayBuffer());

      const key = getEmailAttachmentKey({
        direction:    'inbound',
        messageId:    msgId,
        attachmentId: att.id ?? att.filename,
        filename:     att.filename,
      });

      await uploadToR2(key, buffer, meta.content_type);
      storedAttachments.push({ ...meta, size: buffer.length, storage_key: key });
    } catch (err) {
      logger.warn('[Email Webhook] Attachment upload failed', {
        email_id: emailId,
        filename: att.filename,
        error:    err.message,
      });
      storedAttachments.push(meta); // soft-fail: keep metadata, leave storage_key empty
    }
  }

  // 4. Thread resolution via In-Reply-To header
  const inReplyTo = emailData.headers?.['in-reply-to'] ?? null;
  let threadId    = null;

  if (inReplyTo) {
    const parent = await Email.findOne({ message_id: inReplyTo }).lean();
    if (parent) {
      threadId = parent.thread_id ?? parent.message_id ?? null;

      // Backfill thread_id on the parent outbound so both emails are grouped in listEmails.
      // Mirrors the same pattern already used in sendEmailFromFrontend.
      if (!parent.thread_id && threadId) {
        Email.updateOne({ _id: parent._id }, { $set: { thread_id: threadId } }).catch((err) =>
          logger.warn('[Email Webhook] Failed to backfill thread_id on parent', {
            parent_id: parent._id, error: err.message,
          })
        );
      }
    }
  }

  // 5. References header (space-separated string → array)
  const rawRefs  = emailData.headers?.['references'] ?? null;
  const references = rawRefs
    ? rawRefs.split(/\s+/).filter(Boolean)
    : [];

  // 6. Build doc and upsert (idempotent — safe to replay)
  const inboundDoc = {
    provider:          'resend',
    provider_email_id: emailId,
    direction:         'inbound',
    email_type:        'client',
    message_id:        eventData.message_id ?? null,
    in_reply_to:       inReplyTo,
    references,
    thread_id:         threadId,
    from:              eventData.from    ?? '',
    to:                Array.isArray(eventData.to)  ? eventData.to  : [eventData.to].filter(Boolean),
    cc:                Array.isArray(eventData.cc)  ? eventData.cc  : [],
    bcc:               Array.isArray(eventData.bcc) ? eventData.bcc : [],
    subject:           eventData.subject ?? '',
    html:              emailData.html    ?? null,
    text:              emailData.text    ?? null,
    headers:           emailData.headers ?? {},
    attachments:       storedAttachments,
    last_event:        'received',
    is_read:           false,
    received_at:       eventData.created_at ? new Date(eventData.created_at) : new Date(),
    created_at:        new Date(),
  };

  // upsertResult is null when a new document is inserted (new:false + upsert).
  // A non-null result means a duplicate replay — no cache invalidation needed.
  const upsertResult = await Email.findOneAndUpdate(
    { provider: 'resend', provider_email_id: emailId },
    { $setOnInsert: inboundDoc },
    { upsert: true, new: false }
  );

  if (upsertResult === null) {
    invalidateUnreadCache().catch(() => {});
  }

  logger.info('[Email Webhook] Inbound email stored', {
    email_id:    emailId,
    attachments: storedAttachments.length,
    thread_id:   threadId,
  });
}

// ─── POST /api/email/webhook/resend ──────────────────────────────────────────

async function handleResendWebhook(req, res) {
  const secret  = process.env.RESEND_WEBHOOK_SECRET;
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : (req.body ?? '');

  // ── Svix signature verification ───────────────────────────────────────────
  if (secret) {
    const svixHeaders = {
      'svix-id':        req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    };

    if (!svixHeaders['svix-id'] || !svixHeaders['svix-timestamp'] || !svixHeaders['svix-signature']) {
      logger.warn('[Email Webhook] Missing Svix headers');
      return res.status(401).send('Missing webhook signature headers');
    }

    try {
      new Webhook(secret).verify(rawBody, svixHeaders);
    } catch (err) {
      logger.warn('[Email Webhook] Signature verification failed', { error: err.message });
      return res.status(401).send('Invalid webhook signature');
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('[Email Webhook] RESEND_WEBHOOK_SECRET not set in production — rejecting');
    return res.status(500).send('Webhook secret not configured');
  } else {
    logger.warn('[Email Webhook] RESEND_WEBHOOK_SECRET not set — skipping verification (dev only)');
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn('[Email Webhook] Malformed JSON body');
    return res.status(400).send('Invalid JSON');
  }

  const { type, data } = payload ?? {};
  const emailId = data?.email_id;

  logger.info('[Email Webhook] Event received', { type, email_id: emailId });

  // ── Inbound: fetch full content + store (background) ─────────────────────
  if (type === 'email.received' && emailId) {
    // Respond immediately — Resend retries on non-2xx, so never block here
    res.status(200).json({ received: true });

    // Fire-and-forget: fetch full email, upload attachments, resolve thread, upsert
    processInboundEmail(emailId, data).catch((err) =>
      logger.error('[Email Webhook] processInboundEmail failed', {
        email_id: emailId,
        error:    err.message,
      })
    );
    return;
  }

  return res.status(200).json({ received: true });
}

// ─── GET /api/email/oauth ─────────────────────────────────────────────────────

function oauthRedirect(req, res) {
  try {
    const redirectUri  = resolveRedirectUri(req);
    const oauth2Client = buildOAuthClient(redirectUri);
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope:       [GMAIL_SCOPE],
      prompt:      'consent', // ensures refresh_token is returned every time
    });
    return res.redirect(url);
  } catch (err) {
    logger.error('[Gmail OAuth] Redirect failed', { error: err.message });
    return res.status(500).json({ error: err.message });
  }
}

// ─── GET /api/email/oauth/callback ───────────────────────────────────────────

async function oauthCallback(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing ?code param. Visit GET /api/email/oauth first.');
  }

  try {
    const redirectUri  = resolveRedirectUri(req);
    const oauth2Client = buildOAuthClient(redirectUri);
    const { tokens }   = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.status(400).send(
        'No refresh_token returned. Revoke app access at myaccount.google.com/permissions and retry.'
      );
    }

    return res.type('text').send(
      `✅ Add this to your .env:\n\nGMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n\n⚠️  Keep this secret.`
    );
  } catch (err) {
    logger.error('[Gmail OAuth] Token exchange failed', { error: err.message });
    return res.status(500).send(`Token exchange failed: ${err.message}`);
  }
}

// ─── POST /api/email/sync/gmail ───────────────────────────────────────────────

async function syncGmailHistory(req, res) {
  // Redis lock: prevents overlapping syncs across multiple app instances
  if (redis) {
    const acquired = await redis.set(
      GMAIL_SYNC_REDIS_KEY, '1', 'EX', GMAIL_SYNC_COOLDOWN_SEC, 'NX'
    );
    if (!acquired) {
      return res.status(429).json({
        error:   'Sync already in progress or recently completed.',
        message: `Try again in ${GMAIL_SYNC_COOLDOWN_SEC}s.`,
      });
    }
  }

  const {
    afterDate,
    pageToken,
    maxPages    = 1000,
    maxMessages = 50000,
  } = req.body ?? {};

  try {
    const result = await gmailSyncService.fetchAndStoreHistory({
      afterDate:   afterDate ?? undefined,
      pageToken:   pageToken ?? undefined,
      maxPages:    Number(maxPages),
      maxMessages: Number(maxMessages),
    });

    const response = {
      processed:        result.processed,
      skipped:          result.skipped,
      failed:           result.failed,
      stoppedReason:    result.stoppedReason   ?? undefined,
      nextPageToken:    result.nextPageToken    ?? undefined,
      nextRunAfterDate: result.nextRunAfterDate ?? undefined,
    };

    if (result.stoppedReason === 'dailyLimitExceeded') {
      response.message =
        `Daily Gmail quota reached. Stored ${result.processed} emails. ` +
        `Resume tomorrow with nextPageToken or nextRunAfterDate.`;
    } else if (result.nextPageToken) {
      response.message = `More emails available — pass nextPageToken to continue.`;
    }

    return res.status(200).json(response);
  } catch (err) {
    logger.error('[Gmail Sync] Controller error', { error: err.message });
    return res.status(500).json({ error: 'Gmail sync failed', message: err.message });
  }
}

// ─── GET /api/email ───────────────────────────────────────────────────────────

async function listEmails(req, res) {
  try {
    const {
      page: pageParam,
      limit: limitParam,
      direction,
      filter: filterParam,
      client_id: clientIdParam,
      email: emailParam,
      provider,
      q,
      unread,
      today,
    } = req.query;

    const page  = Math.max(parseInt(pageParam,  10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(limitParam, 10) || DEFAULT_EMAIL_LIMIT, 1),
      MAX_EMAIL_LIMIT
    );

    const match = {};

    if (direction) {
      if (direction !== 'inbound' && direction !== 'outbound') {
        return res.status(400).json({ error: 'direction must be "inbound" or "outbound"' });
      }
      match.direction = direction;
    }

    if (filterParam) {
      if (filterParam !== 'system') {
        return res.status(400).json({ error: 'filter must be "system"' });
      }
      match.email_type = 'system';
    } else if (direction === 'outbound') {
      match.email_type = { $ne: 'system' };
    }

    if (clientIdParam) {
      if (!isValidObjectId(clientIdParam)) {
        return res.status(400).json({ error: 'client_id must be a 24-character hex ObjectId' });
      }
      match.client_id = new mongoose.Types.ObjectId(clientIdParam);
    }

    if (provider) {
      if (provider !== 'resend' && provider !== 'gmail') {
        return res.status(400).json({ error: 'provider must be "resend" or "gmail"' });
      }
      match.provider = provider;
    }

    if (emailParam?.trim()) {
      const re = { $regex: escapeRegex(emailParam.trim()), $options: 'i' };
      match.$or = [{ from: re }, { to: re }, { cc: re }, { bcc: re }];
    }

    if (q?.trim()) {
      const re   = { $regex: escapeRegex(q.trim()), $options: 'i' };
      match.$and = [
        ...(match.$and ?? []),
        { $or: [{ subject: re }, { from: re }, { to: re }] },
      ];
    }

    if (unread === 'true' || unread === '1') {
      match.is_read = false;
    }

    if (today === 'true' || today === '1') {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);
      match.$and = [
        ...(match.$and ?? []),
        {
          $or: [
            { received_at: { $gte: startOfToday } },
            { received_at: null, created_at: { $gte: startOfToday } },
          ],
        },
      ];
    }

    // Always exclude messages with no readable body (delivery receipts / drafts)
    match.$and = [
      ...(match.$and ?? []),
      { $or: [{ html: { $ne: null } }] },
    ];

    const sortTime = { $cond: [{ $ne: ['$received_at', null] }, '$received_at', '$created_at'] };
    const skip     = (page - 1) * limit;

    // Critical memory optimisation: exclude large fields BEFORE $group so that
    // $$ROOT never carries html/text (10-50 KB each) through the grouping stage.
    const projectLean = { $project: { html: 0, text: 0, headers: 0 } };

    const preGroupStages = [
      { $match: match },
      projectLean,
      { $addFields: { _sortTime: sortTime } },
      { $sort: { _sortTime: -1 } },
      {
        $group: {
          _id:          { $ifNull: ['$thread_id', { $toString: '$_id' }] },
          doc:          { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
        },
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ['$doc', { messageCount: '$messageCount' }] },
        },
      },
      { $sort: { _sortTime: -1 } },
    ];

    // Cache the global (no-filter) unread count for 60 s — the inbox badge pattern.
    // Per-filter counts always compute live so they remain accurate.
    const isGlobalQuery = !clientIdParam && !direction && !filterParam && !q && !emailParam && !provider && !today;
    const cachedUnread  = isGlobalQuery ? await getCachedUnreadCount() : null;

    // Build $facet: data + count in one pipeline pass.
    // Add unreadCount branch only on cache miss to avoid wasted work.
    const facets = {
      data:  [...preGroupStages, { $project: { _sortTime: 0 } }, { $skip: skip }, { $limit: limit }],
      count: [...preGroupStages, { $count: 'count' }],
    };

    if (cachedUnread === null) {
      const matchUnread = { ...match, is_read: false };
      facets.unreadCount = [
        { $match: matchUnread },
        { $group: { _id: { $ifNull: ['$thread_id', { $toString: '$_id' }] } } },
        { $count: 'count' },
      ];
    }

    // allowDiskUse: safety net for sort stages on 10k+ docs exceeding 100 MB RAM limit
    const [facetResult] = await Email.aggregate(
      [{ $facet: facets }],
      { allowDiskUse: true }
    );

    const rows  = facetResult.data         ?? [];
    const total = facetResult.count?.[0]?.count ?? 0;

    let unreadTotal;
    if (cachedUnread !== null) {
      unreadTotal = cachedUnread;
    } else {
      unreadTotal = facetResult.unreadCount?.[0]?.count ?? 0;
      if (isGlobalQuery) await setCachedUnreadCount(unreadTotal);
    }

    return res.status(200).json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadTotal,
    });
  } catch (err) {
    logger.error('[Email] listEmails failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch email list' });
  }
}

// ─── GET /api/email/thread/:threadId ─────────────────────────────────────────

async function getThreadMessages(req, res) {
  try {
    const { threadId } = req.params;

    if (!threadId?.trim()) {
      return res.status(400).json({ error: 'threadId is required' });
    }

    const limit = Math.min(
      parseInt(req.query.limit, 10) || MAX_THREAD_MESSAGES,
      MAX_THREAD_MESSAGES
    );

    const messages = await Email.aggregate([
      { $match: { thread_id: threadId } },
      { $addFields: { _sortTime: { $ifNull: ['$received_at', '$created_at'] } } },
      { $sort: { _sortTime: 1 } },
      { $limit: limit },
      { $project: { _sortTime: 0 } },
    ]);

    // Hydrate signed attachment URLs for every message in the thread
    const hydrated = await Promise.all(
      messages.map((m) => gmailSyncService.hydrateAttachmentUrls(m))
    );

    return res.status(200).json({ data: hydrated });
  } catch (err) {
    logger.error('[Email] getThreadMessages failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch thread' });
  }
}

// ─── GET /api/email/:id ───────────────────────────────────────────────────────

async function getEmailById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid email id' });
    }

    const email = await Email.findById(id).lean();
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Resolve storage_key → short-lived signed URL for each attachment
    const hydrated = await gmailSyncService.hydrateAttachmentUrls(email);

    return res.status(200).json(hydrated);
  } catch (err) {
    logger.error('[Email] getEmailById failed', { id: req.params.id, error: err.message });
    return res.status(500).json({ error: 'Failed to fetch email' });
  }
}

// ─── GET /api/email/:id/thread ────────────────────────────────────────────────

async function getEmailWithThread(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid email id' });
    }

    const email = await Email.findById(id).lean();
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Hydrate the opened message's attachments
    const hydratedEmail = await gmailSyncService.hydrateAttachmentUrls(email);

    if (!email.thread_id) {
      // Standalone message — wrap in a one-element thread
      const { html: _h, text: _t, ...minimal } = hydratedEmail;
      return res.status(200).json({ email: hydratedEmail, thread: [minimal] });
    }

    const threadDocs = await Email.aggregate([
      { $match: { thread_id: email.thread_id } },
      { $addFields: { _sortTime: { $ifNull: ['$received_at', '$created_at'] } } },
      { $sort: { _sortTime: 1 } },
      { $limit: MAX_THREAD_MESSAGES },
      { $project: { html: 0, text: 0, _sortTime: 0 } },
    ]);

    // Hydrate attachment URLs across all thread messages
    const hydratedThread = await Promise.all(
      threadDocs.map((m) => gmailSyncService.hydrateAttachmentUrls(m))
    );

    return res.status(200).json({ email: hydratedEmail, thread: hydratedThread });
  } catch (err) {
    logger.error('[Email] getEmailWithThread failed', { id: req.params.id, error: err.message });
    return res.status(500).json({ error: 'Failed to fetch email with thread' });
  }
}

// ─── POST /api/email/send ─────────────────────────────────────────────────────

async function sendEmail(req, res) {
  try {
    const {
      to, subject, html, text,
      cc, bcc,
      client_id,
      in_reply_to,
      message_id,
    } = req.body ?? {};

    const files = req.files ?? [];

    // ── Input validation ──────────────────────────────────────────────────────
    if (!to || (typeof to === 'string' && !to.trim())) {
      return res.status(400).json({ error: '"to" is required' });
    }
    if (!subject?.trim()) {
      return res.status(400).json({ error: '"subject" is required' });
    }
    if (!html?.trim()) {
      return res.status(400).json({ error: '"html" is required' });
    }

    let clientId = null;
    if (client_id) {
      if (!mongoose.Types.ObjectId.isValid(client_id)) {
        return res.status(400).json({ error: 'Invalid "client_id"' });
      }
      clientId = new mongoose.Types.ObjectId(client_id);
    }

    if (files.length > MAX_ATTACHMENTS) {
      return res.status(400).json({ error: `Maximum ${MAX_ATTACHMENTS} attachments allowed` });
    }

    const totalSize = files.reduce((sum, f) => sum + (f.size ?? f.buffer?.length ?? 0), 0);
    if (totalSize > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ error: 'Total attachment size exceeds 25 MB' });
    }

    // ── Delegate to email service ─────────────────────────────────────────────
    const result = await emailService.sendEmailFromFrontend({
      to,
      subject,
      html:        html        || undefined,
      text:        text        || undefined,
      cc:          cc          || undefined,
      bcc:         bcc         || undefined,
      client_id:   clientId,
      in_reply_to: in_reply_to || undefined,
      message_id:  message_id  || undefined,
      attachments: files.map((f) => ({
        buffer:   f.buffer,
        filename: f.originalname ?? f.name ?? 'attachment',
        mimetype: f.mimetype ?? 'application/octet-stream',
      })),
    });

    return res.status(200).json({ success: true, id: result.id });
  } catch (err) {
    logger.error('[Email] sendEmail failed', { error: err.message });
    const isClientError = /missing|invalid|required|exceeds/i.test(err.message ?? '');
    return res
      .status(isClientError ? 400 : 500)
      .json({ error: err.message || 'Failed to send email' });
  }
}

// ─── PATCH /api/email/:id/read ────────────────────────────────────────────────

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid email id' });
    }
    const result = await Email.updateOne({ _id: id }, { $set: { is_read: true } });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }
    // Only invalidate when the doc was actually unread (modifiedCount 0 = already read)
    if (result.modifiedCount > 0) {
      invalidateUnreadCache().catch(() => {});
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('[Email] markAsRead failed', { id: req.params.id, error: err.message });
    return res.status(500).json({ error: 'Failed to mark email as read' });
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  handleResendWebhook,
  oauthRedirect,
  oauthCallback,
  syncGmailHistory,
  sendEmail,
  listEmails,
  getThreadMessages,
  getEmailById,
  getEmailWithThread,
  markAsRead,
};