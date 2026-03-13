'use strict';

const mongoose = require('mongoose');
const axios = require('axios');
const { Webhook } = require('svix');
const { google } = require('googleapis');
const Email = require('../models/email');
const logger = require('../utils/logger');
const gmailSyncService = require('../services/gmail/gmailSyncService');
const emailService = require('../services/notifications/emailService');
const { redis } = require('../services/redis');
// const { uploadToR2, getEmailAttachmentKey } = require('../services/r2Client'); // disabled for inbound webhook — re-enable when restoring attachment storage

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_SYNC_REDIS_KEY = 'gmail_sync_lock';
const GMAIL_SYNC_COOLDOWN_SEC = 5 * 60; // 5 minutes

/** Resend event type -> Email.last_event */
const EVENT_MAP = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.clicked': 'clicked',
  'email.delivery_delayed': 'delivery_delayed',
  'email.received': 'received',
};

/** Event order for deduplication: only update if new event is later (or terminal). */
const EVENT_ORDER = { queued: 0, sent: 1, delivered: 2, opened: 3, bounced: 4, complained: 5, clicked: 6, delivery_delayed: 7, received: 8 };

const DEFAULT_EMAIL_LIMIT = 20;
const MAX_EMAIL_LIMIT = 50;
const MAX_THREAD_MESSAGES = 100;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}


/*
 * R2 inbound attachment storage disabled for now — keep for sending API only.
 *
 * async function downloadAndStoreResendAttachments(emailDocId, resendEmailId, rawAttachments, messageId) {
 *   ...
 * }
 */

async function handleResendWebhook(req, res) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (req.body || '');

  if (secret) {
    const headers = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    };
    if (!headers['svix-id'] || !headers['svix-timestamp'] || !headers['svix-signature']) {
      logger.warn('[Email Webhook] Missing Svix headers');
      return res.status(401).send('Missing webhook signature headers');
    }
    try {
      const wh = new Webhook(secret);
      wh.verify(rawBody, headers);
    } catch (err) {
      logger.warn('[Email Webhook] Verification failed', { error: err.message });
      return res.status(401).send('Invalid webhook signature');
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('[Email Webhook] RESEND_WEBHOOK_SECRET not set in production — rejecting request');
    return res.status(500).send('Webhook secret not configured');
  } else {
    logger.warn('[Email Webhook] RESEND_WEBHOOK_SECRET not set — skipping verification');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    logger.warn('[Email Webhook] Invalid JSON', { error: err.message });
    return res.status(400).send('Invalid JSON');
  }

  const { type, data } = payload || {};
  const emailId = data?.email_id;

  logger.info('[Email Webhook] Event received', { type, email_id: emailId });

  // Handle inbound email: create a new Email record if one doesn't exist
  if (type === 'email.received' && emailId) {
    try {
      const inboundDoc = {
        provider: 'resend',
        provider_email_id: emailId,
        direction: 'inbound',
        email_type: 'client',
        message_id: data.message_id || null,
        from: data.from || '',
        to: Array.isArray(data.to) ? data.to : [data.to].filter(Boolean),
        cc: Array.isArray(data.cc) ? data.cc : [],
        bcc: Array.isArray(data.bcc) ? data.bcc : [],
        subject: data.subject || '',
        html: data.html || null,
        text: data.text || null,
        attachments: Array.isArray(data.attachments)
          ? data.attachments.map((a) => ({
              filename: a.filename || '',
              content_type: a.content_type || '',
              size: 0,
              storage_url: '',
              provider_attachment_id: a.id || null,
              content_disposition: a.content_disposition || null,
              content_id: a.content_id || null,
            }))
          : [],
        last_event: 'received',
        received_at: data.created_at ? new Date(data.created_at) : new Date(),
        created_at: new Date(),
      };
      await Email.findOneAndUpdate(
        { provider: 'resend', provider_email_id: emailId },
        { $setOnInsert: inboundDoc },
        { upsert: true, new: false }
      );
      logger.info('[Email Webhook] Inbound email stored', { email_id: emailId });

      // R2 inbound attachment storage disabled — re-enable when restoring
      // if (existing === null && Array.isArray(data.attachments) && data.attachments.length > 0) {
      //   const stored = await Email.findOne({ provider: 'resend', provider_email_id: emailId }, { _id: 1 }).lean();
      //   if (stored) {
      //     downloadAndStoreResendAttachments(stored._id, emailId, data.attachments, data.message_id).catch((err) => {
      //       logger.error('[Email Attachments] Unhandled error in attachment pipeline', { error: err.message });
      //     });
      //   }
      // }
    } catch (err) {
      logger.error('[Email Webhook] Failed to store inbound email', {
        email_id: emailId,
        error: err.message,
      });
    }
    return res.status(200).json({ received: true });
  }

  // Handle outbound delivery-event updates
  const lastEvent = EVENT_MAP[type];
  if (lastEvent && emailId) {
    try {
      const newOrder = EVENT_ORDER[lastEvent];
      // Build a query that only matches if the new event is higher priority (or unordered events)
      const query = { provider: 'resend', provider_email_id: emailId };
      if (newOrder !== undefined) {
        const lowerEvents = Object.entries(EVENT_ORDER)
          .filter(([, order]) => order < newOrder)
          .map(([evt]) => evt);
        query.$or = [
          { last_event: { $exists: false } },
          { last_event: { $in: [...lowerEvents, lastEvent] } },
        ];
      }
      const result = await Email.updateOne(query, { $set: { last_event: lastEvent } });
      if (result.matchedCount === 0) {
        logger.warn('[Email Webhook] No matching email doc for event (possible race or unknown id)', {
          email_id: emailId,
          type,
        });
      }
    } catch (err) {
      logger.error('[Email Webhook] Failed to update Email last_event', {
        email_id: emailId,
        error: err.message,
      });
    }
  }

  res.status(200).json({ received: true });
}

/**
 * GET /api/email/oauth
 * Redirects to Google consent URL for gmail.readonly. One-time use to obtain refresh_token.
 */
function oauthRedirect(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set' });
  }
  const redirectUri =
    process.env.GMAIL_OAUTH_REDIRECT_URI ||
    `${req.protocol}://${req.get('host')}/api/email/oauth/callback`;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [GMAIL_SCOPE],
    prompt: 'consent',
  });
  res.redirect(url);
}

/**
 * GET /api/email/oauth/callback?code=...
 * Exchanges code for tokens. Returns refresh_token for admin to add to .env as GMAIL_REFRESH_TOKEN.
 */
async function oauthCallback(req, res) {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing code. Run GET /api/email/oauth first.');
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GMAIL_OAUTH_REDIRECT_URI ||
    `${req.protocol}://${req.get('host')}/api/email/oauth/callback`;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      return res.status(400).send('No refresh_token in response. Revoke app access and try again with prompt=consent.');
    }
    res.set('Content-Type', 'text/plain');
    res.send(
      `Add this to your .env:\nGMAIL_REFRESH_TOKEN=${refreshToken}\n\nDo not share this value.`
    );
  } catch (err) {
    logger.error('[Gmail OAuth] Callback error', { error: err.message });
    res.status(500).send('Token exchange failed: ' + err.message);
  }
}

/**
 * POST /api/email/sync/gmail
 * Admin-only. Body: { afterDate?, pageToken?, maxPages?, maxMessages? }.
 * Runs fetchAndStoreHistory; returns processed/skipped/failed and optional nextPageToken/nextRunAfterDate.
 * Uses a Redis SET NX lock for distributed cooldown; falls back to a no-op when Redis is unavailable.
 */
async function syncGmailHistory(req, res) {
  if (redis) {
    const acquired = await redis.set(GMAIL_SYNC_REDIS_KEY, '1', 'EX', GMAIL_SYNC_COOLDOWN_SEC, 'NX');
    if (!acquired) {
      return res.status(429).json({
        error: 'Sync in progress or recently run',
        message: 'Try again in a few minutes.',
      });
    }
  }
  const { afterDate, pageToken, maxPages, maxMessages } = req.body || {};
  try {
    const result = await gmailSyncService.fetchAndStoreHistory({
      afterDate: afterDate || undefined,
      pageToken: pageToken || undefined,
      maxPages: maxPages != null ? Number(maxPages) : undefined,
      maxMessages: maxMessages != null ? Number(maxMessages) : undefined,
    });
    let message;
    if (result.stoppedReason === 'dailyLimitExceeded') {
      message =
        'Daily limit reached. Stored ' +
        result.processed +
        ' emails. Run again tomorrow or with afterDate to continue.';
    }
    res.status(200).json({
      processed: result.processed,
      skipped: result.skipped,
      failed: result.failed,
      stoppedReason: result.stoppedReason || undefined,
      nextPageToken: result.nextPageToken || undefined,
      nextRunAfterDate: result.nextRunAfterDate || undefined,
      message,
    });
  } catch (err) {
    logger.error('[Gmail Sync] API error', { error: err.message });
    res.status(500).json({
      error: 'Gmail sync failed',
      message: err.message,
    });
  }
}

async function listEmails(req, res) {
  try {
    const { page: pageParam, limit: limitParam, direction, client_id: clientIdParam, email: emailParam, provider, q } = req.query;

    let page = parseInt(pageParam, 10) || 1;
    let limit = parseInt(limitParam, 10) || DEFAULT_EMAIL_LIMIT;
    if (page < 1) page = 1;
    if (limit < 1) limit = DEFAULT_EMAIL_LIMIT;
    if (limit > MAX_EMAIL_LIMIT) limit = MAX_EMAIL_LIMIT;

    const match = {};

    if (direction != null && direction !== '') {
      if (direction !== 'inbound' && direction !== 'outbound') {
        return res.status(400).json({ error: 'Invalid direction. Allowed: inbound, outbound' });
      }
      match.direction = direction;
    }

    if (clientIdParam != null && clientIdParam !== '') {
      if (!isValidObjectId(clientIdParam)) {
        return res.status(400).json({ error: 'Invalid client_id. Must be a 24-character hex ObjectId.' });
      }
      match.client_id = new mongoose.Types.ObjectId(clientIdParam);
    }

    if (emailParam != null && typeof emailParam === 'string') {
      const participant = emailParam.trim();
      if (!participant) {
        return res.status(400).json({ error: 'Invalid email. Must be non-empty.' });
      }
      const participantRegex = { $regex: escapeRegex(participant), $options: 'i' };
      match.$or = [
        { from: participantRegex },
        { to: participantRegex },
        { cc: participantRegex },
        { bcc: participantRegex },
      ];
    }

    if (provider != null && provider !== '') {
      if (provider !== 'resend' && provider !== 'gmail') {
        return res.status(400).json({ error: 'Invalid provider. Allowed: resend, gmail' });
      }
      match.provider = provider;
    }

    if (q != null && typeof q === 'string' && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const searchOr = [
        { subject: { $regex: escaped, $options: 'i' } },
        { from: { $regex: escaped, $options: 'i' } },
        { to: { $regex: escaped, $options: 'i' } },
      ];
      match.$and = match.$and || [];
      match.$and.push({ $or: searchOr });
    }

    const sortTime = { $cond: [{ $ne: ['$received_at', null] }, '$received_at', '$created_at'] };
    const skip = (page - 1) * limit;

    const dataPipeline = [
      { $match: Object.keys(match).length ? match : {} },
      { $addFields: { _sortTime: sortTime } },
      { $sort: { _sortTime: -1 } },
      {
        $group: {
          _id: { $ifNull: ['$thread_id', '$_id'] },
          doc: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
        },
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ['$doc', { messageCount: '$messageCount' }] },
        },
      },
      { $sort: { _sortTime: -1 } },
      { $project: { html: 0, text: 0, _sortTime: 0 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      { $match: Object.keys(match).length ? match : {} },
      { $addFields: { _sortTime: sortTime } },
      { $sort: { _sortTime: -1 } },
      { $group: { _id: { $ifNull: ['$thread_id', '$_id'] } } },
      { $count: 'count' },
    ];

    const [facetResult, countResult] = await Promise.all([
      Email.aggregate([...dataPipeline]),
      Email.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: facetResult,
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    logger.error('[Email] listEmails failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch email list', details: err.message });
  }
}

async function getThreadMessages(req, res) {
  try {
    const { threadId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || MAX_THREAD_MESSAGES, MAX_THREAD_MESSAGES);

    const messages = await Email.find({ thread_id: threadId })
      .sort({ received_at: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ data: messages });
  } catch (err) {
    logger.error('[Email] getThreadMessages failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch thread', details: err.message });
  }
}

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
    return res.status(200).json(email);
  } catch (err) {
    logger.error('[Email] getEmailById failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch email', details: err.message });
  }
}

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

    const threadId = email.thread_id || null;
    if (!threadId) {
      const minimal = { ...email };
      delete minimal.html;
      delete minimal.text;
      return res.status(200).json({ email, thread: [minimal] });
    }

    const thread = await Email.find({ thread_id: threadId })
      .sort({ received_at: 1 })
      .select('-html -text')
      .limit(MAX_THREAD_MESSAGES)
      .lean();

    return res.status(200).json({ email, thread });
  } catch (err) {
    logger.error('[Email] getEmailWithThread failed', { error: err.message });
    return res.status(500).json({ error: 'Failed to fetch email with thread', details: err.message });
  }
}

const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENTS_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB

async function sendEmail(req, res) {
  try {
    const { to, subject, html, text, cc, bcc, client_id, in_reply_to, message_id } = req.body || {};
    const files = req.files || [];

    if (!to || (typeof to === 'string' && !to.trim())) {
      return res.status(400).json({ error: 'Missing or invalid "to"' });
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'Missing or invalid "subject"' });
    }
    const hasBody = (html && typeof html === 'string' && html.trim()) || (text && typeof text === 'string' && text.trim());
    if (!hasBody) {
      return res.status(400).json({ error: 'At least one of "html" or "text" is required' });
    }

    let clientId = null;
    if (client_id != null && client_id !== '') {
      if (!mongoose.Types.ObjectId.isValid(client_id)) {
        return res.status(400).json({ error: 'Invalid "client_id"' });
      }
      clientId = new mongoose.Types.ObjectId(client_id);
    }

    if (files.length > MAX_ATTACHMENTS) {
      return res.status(400).json({ error: `At most ${MAX_ATTACHMENTS} attachments allowed` });
    }
    let totalSize = 0;
    for (const f of files) {
      totalSize += (f.size || f.buffer?.length || 0);
    }
    if (totalSize > MAX_ATTACHMENTS_TOTAL_BYTES) {
      return res.status(400).json({ error: 'Total attachment size exceeds 25 MB' });
    }

    const attachments = files.map((f) => ({
      buffer: f.buffer,
      filename: f.originalname || f.name || 'attachment',
      mimetype: f.mimetype || 'application/octet-stream',
    }));

    const result = await emailService.sendEmailFromFrontend({
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
      cc: cc || undefined,
      bcc: bcc || undefined,
      client_id: clientId,
      in_reply_to: in_reply_to || undefined,
      message_id: message_id || undefined,
      attachments,
    });

    return res.status(200).json({
      success: true,
      id: result.id,
      message: 'Sent',
    });
  } catch (err) {
    logger.error('[Email] sendEmail failed', { error: err.message });
    const msg = err.message || 'Failed to send email';
    if (msg.includes('Missing') || msg.includes('invalid') || msg.includes('required') || msg.includes('exceeds')) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: 'Failed to send email', message: msg });
  }
}

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
};
