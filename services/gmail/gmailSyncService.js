'use strict';

/**
 * Gmail Sync Service — Production Ready
 *
 * Responsibilities:
 *  1. Fetch full Gmail message history (paginated, rate-limit safe)
 *  2. Recursively parse nested MIME trees → extract html/text body
 *  3. Collect attachment parts → fetch raw bytes → upload to R2
 *  4. Store the R2 *key* (not URL) in MongoDB for long-term stability
 *  5. Upsert Email documents with full deduplication
 *
 * Attachment URL strategy:
 *  - storage_key is stored in MongoDB (env/bucket agnostic)
 *  - Call getSignedAttachmentUrl(key) at read time to generate short-lived URLs
 *  - See r2Client.js for getSignedAttachmentUrl()
 */

const { google }   = require('googleapis');
const Email        = require('../../models/email');
const logger       = require('../../utils/logger');
const { uploadToR2, getEmailAttachmentKey, getSignedAttachmentUrl } = require('../r2Client');

// ─── Constants ────────────────────────────────────────────────────────────────

const GMAIL_SCOPE            = 'https://www.googleapis.com/auth/gmail.readonly';
const LIST_PAGE_SIZE         = 100;   // max Gmail allows per page
const LIST_DELAY_MS          = 350;   // pause between list pages
const BATCH_SIZE             = 12;    // concurrent message fetches
const BATCH_DELAY_MS         = 300;   // pause between batches
const ATTACHMENT_DELAY_MS    = 100;   // pause between R2 uploads
const MAX_RETRIES            = 3;
const BACKOFF_MS             = [1000, 2000, 4000];

// ─── OAuth client ─────────────────────────────────────────────────────────────

/**
 * Build an OAuth2 client from env vars.
 * Throws clearly if any required var is missing.
 */
function getOAuth2Client() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error(
      'Missing required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN'
    );
  }

  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, undefined);
  client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
  return client;
}

// ─── Retry / rate-limit helpers ───────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDailyLimitError(err) {
  const code = err?.code ?? err?.response?.status;
  return (
    code === 403 &&
    (err?.message?.includes('dailyLimitExceeded') ||
      (err?.errors ?? []).some((e) => e?.reason?.toLowerCase().includes('daily')))
  );
}

function isRateLimitError(err) {
  const code = err?.code ?? err?.response?.status;
  return (
    code === 429 ||
    err?.message?.includes('rateLimitExceeded') ||
    err?.message?.includes('userRateLimitExceeded')
  );
}

/**
 * Retry wrapper with exponential backoff.
 * - Bails immediately on daily-limit (non-recoverable within the day).
 * - Retries on transient rate-limit errors up to MAX_RETRIES times.
 */
async function withRetry(fn, context = '') {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      if (isDailyLimitError(err)) throw err;

      if (!isRateLimitError(err) || attempt === MAX_RETRIES) throw err;

      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      logger.warn('[Gmail Sync] Rate-limited, retrying', { context, attempt: attempt + 1, delayMs: delay });
      await sleep(delay);
    }
  }
  throw lastErr;
}

// ─── MIME / header helpers ────────────────────────────────────────────────────

/**
 * Find a top-level message header value by name (case-insensitive).
 */
function getHeader(headers, name) {
  if (!Array.isArray(headers)) return null;
  const lower = name.toLowerCase();
  return headers.find((h) => h?.name?.toLowerCase() === lower)?.value ?? null;
}

/**
 * Find a part-level header (e.g. Content-Disposition).
 */
function getPartHeader(part, name) {
  return getHeader(part?.headers ?? [], name);
}

function parseAddressList(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function decodeBase64url(str) {
  if (!str) return Buffer.alloc(0);
  let b64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);
  return Buffer.from(b64, 'base64');
}

// ─── Recursive MIME tree walkers ──────────────────────────────────────────────

/**
 * Recursively walk the MIME tree and extract the best html + text body parts.
 *
 * Gmail frequently nests content like:
 *   multipart/mixed
 *     └─ multipart/alternative
 *          ├─ text/plain
 *          └─ text/html
 *     └─ application/pdf  (attachment)
 *
 * A flat one-level scan misses everything inside multipart containers.
 */
async function extractBody(payload, gmail, messageId) {
  let html = null;
  let text = null;

  async function walk(part) {
    if (!part) return;
    const mime        = (part.mimeType ?? '').toLowerCase();
    const disposition = (getPartHeader(part, 'content-disposition') ?? '').toLowerCase();

    // Recurse into multipart containers — never try to read their body directly
    if (mime.startsWith('multipart/')) {
      for (const child of part.parts ?? []) await walk(child);
      return;
    }

    // Skip anything that is explicitly an attachment
    if (part.filename || disposition.startsWith('attachment')) return;

    // Get inline data, or fetch via attachmentId if the body was stored externally
    // (Gmail API stores large/externally-structured body parts under body.attachmentId
    //  per official docs — requires a separate messages.attachments.get() call)
    let rawData = part.body?.data ?? null;

    if (!rawData && part.body?.attachmentId && gmail && messageId) {
      try {
        const res = await withRetry(
          () => gmail.users.messages.attachments.get({
            userId:    'me',
            messageId,
            id:        part.body.attachmentId,
          }),
          `body:${messageId}/${part.body.attachmentId}`
        );
        rawData = res.data.data ?? null;
      } catch (err) {
        logger.warn('[Gmail Sync] Failed to fetch external body part', {
          messageId,
          attachmentId: part.body.attachmentId,
          error:        err.message,
        });
        return;
      }
    }

    if (!rawData) return;

    const decoded = decodeBase64url(rawData).toString('utf8');

    if (mime.includes('html') && !html)       html = decoded;
    else if (mime.includes('plain') && !text) text = decoded;
  }

  await walk(payload);
  return { html, text };
}

/**
 * Recursively walk the MIME tree and collect all attachment parts.
 * A part is an attachment if it has a filename OR an "attachment" Content-Disposition.
 */
function collectAttachmentParts(payload) {
  const parts = [];

  function walk(part) {
    if (!part) return;
    const mime        = (part.mimeType ?? '').toLowerCase();
    const disposition = (getPartHeader(part, 'content-disposition') ?? '').toLowerCase();

    if (mime.startsWith('multipart/')) {
      for (const child of part.parts ?? []) walk(child);
      return;
    }

    if (part.filename || disposition.startsWith('attachment')) {
      parts.push(part);
    }
  }

  walk(payload);
  return parts;
}

// ─── Attachment fetch + R2 upload ─────────────────────────────────────────────

/**
 * For every attachment part in the message:
 *   1. Fetch raw bytes (inline data or via attachments.get API)
 *   2. Upload to R2
 *   3. Return metadata with storage_key (NOT a URL)
 *
 * storage_key is stable across env changes; generate signed URLs at read time.
 *
 * Failures are soft — a failed attachment gets storage_key: '' so the rest
 * of the email is not blocked.
 */
async function fetchAndUploadAttachments(gmail, messageId, payload) {
  const attachmentParts = collectAttachmentParts(payload);
  if (attachmentParts.length === 0) return [];

  const results = [];

  for (const part of attachmentParts) {
    const meta = {
      filename:     part.filename,
      content_type: part.mimeType ?? 'application/octet-stream',
      size:         part.body?.size ?? 0,
      storage_key:  '',
    };

    // ── 1. Get raw bytes ──────────────────────────────────────────────────────
    let buffer;

    if (part.body?.data) {
      // Small attachment inlined in the message response
      buffer = decodeBase64url(part.body.data);
    } else if (part.body?.attachmentId) {
      try {
        const res = await withRetry(
          () =>
            gmail.users.messages.attachments.get({
              userId:    'me',
              messageId,
              id:        part.body.attachmentId,
            }),
          `attachment:${messageId}/${part.body.attachmentId}`
        );
        buffer = decodeBase64url(res.data.data);
      } catch (err) {
        logger.warn('[Gmail Sync] Failed to fetch attachment bytes', {
          messageId,
          attachmentId: part.body.attachmentId,
          filename:     part.filename,
          error:        err.message,
        });
        results.push(meta); // push with empty storage_key
        continue;
      }
    } else {
      // No data source — skip silently
      continue;
    }

    // ── 2. Upload to R2 ───────────────────────────────────────────────────────
    const key = getEmailAttachmentKey({
      direction:    'inbound',
      messageId,
      attachmentId: part.body?.attachmentId ?? part.filename,
      filename:     part.filename,
    });

    try {
      await uploadToR2(key, buffer, meta.content_type);
      results.push({
        ...meta,
        size:        part.body?.size ?? buffer.length,
        storage_key: key,   // ← store key, NOT url
      });
    } catch (err) {
      logger.warn('[Gmail Sync] R2 upload failed', {
        messageId,
        filename: part.filename,
        error:    err.message,
      });
      results.push(meta); // push with empty storage_key
    }

    // Small pause to avoid slamming R2
    await sleep(ATTACHMENT_DELAY_MS);
  }

  return results;
}

// ─── Message → Email document ─────────────────────────────────────────────────

/**
 * Map a raw Gmail API message to the shape expected by the Email model.
 * Attachments are intentionally left empty here — they are populated
 * separately in the fetch loop via fetchAndUploadAttachments().
 */
async function mapGmailMessageToEmail(msg, gmail) {
  const payload     = msg.payload ?? {};
  const headers     = payload.headers ?? [];
  const labelIds    = msg.labelIds ?? [];
  const direction   = labelIds.includes('SENT') ? 'outbound' : 'inbound';
  const { html, text } = await extractBody(payload, gmail, msg.id);
  const internalDate   = msg.internalDate
    ? new Date(parseInt(msg.internalDate, 10))
    : null;

  return {
    provider:          'gmail',
    provider_email_id: String(msg.id),
    message_id:        getHeader(headers, 'Message-ID'),
    in_reply_to:       getHeader(headers, 'In-Reply-To'),
    references:        (getHeader(headers, 'References') ?? '')
                         .split(/\s+/)
                         .map((s) => s.trim())
                         .filter(Boolean),
    thread_id:         msg.threadId ? String(msg.threadId) : null,
    client_id:         null,
    direction,
    email_type:        'client',
    from:              getHeader(headers, 'From') ?? '',
    to:                parseAddressList(getHeader(headers, 'To')),
    cc:                parseAddressList(getHeader(headers, 'Cc')),
    bcc:               parseAddressList(getHeader(headers, 'Bcc')),
    reply_to:          parseAddressList(getHeader(headers, 'Reply-To')),
    subject:           getHeader(headers, 'Subject') ?? '',
    html,
    text,
    attachments:       [],   // populated after R2 upload
    headers:           Object.fromEntries(headers.map((h) => [h.name.toLowerCase(), h.value])),
    last_event:        'delivered',
    created_at:        internalDate ?? new Date(),
    received_at:       internalDate,
  };
}

// ─── Core sync function ───────────────────────────────────────────────────────

async function fetchAndStoreHistory(options = {}) {
  const {
    afterDate,
    pageToken,
    maxPages    = 1000,
    maxMessages = 50000,
  } = options;

  const auth  = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  let processed       = 0;
  let skipped         = 0;
  let failed          = 0;
  let stoppedReason   = null;
  let nextPageToken   = null;
  let nextRunAfterDate = null;

  let currentPageToken = pageToken ?? undefined;
  let pagesDone        = 0;

  // Gmail query: optionally filter to messages after a date
  const query = afterDate ? `after:${afterDate.replace(/-/g, '/')}` : undefined;

  logger.info('[Gmail Sync] Starting fetchAndStoreHistory', {
    afterDate:    afterDate ?? null,
    hasPageToken: !!pageToken,
    maxPages,
    maxMessages,
  });

  try {
    while (pagesDone < maxPages && processed + skipped + failed < maxMessages) {

      // ── List a page of message IDs ──────────────────────────────────────────
      const listRes = await withRetry(
        () =>
          gmail.users.messages.list({
            userId:     'me',
            maxResults: LIST_PAGE_SIZE,
            pageToken:  currentPageToken,
            q:          query,
          }),
        'messages.list'
      );

      const messages       = listRes.data.messages ?? [];
      const nextToken      = listRes.data.nextPageToken ?? null;

      if (messages.length === 0) break;

      // ── Process messages in concurrent batches ──────────────────────────────
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map((m) => processMessage(gmail, m.id))
        );

        for (const r of batchResults) {
          if (r === 'ok')      processed++;
          else if (r === 'skip') skipped++;
          else                   failed++;
        }

        // Check caps after every batch
        if (processed + skipped + failed >= maxMessages) {
          stoppedReason = 'maxMessages';
          nextPageToken = nextToken;
          break;
        }

        await sleep(BATCH_DELAY_MS);
      }

      pagesDone++;
      if (stoppedReason) break;

      // Advance pagination
      currentPageToken = nextToken;
      if (!currentPageToken) break;

      nextPageToken = currentPageToken;
      await sleep(LIST_DELAY_MS);
    }

    // If we consumed all pages, record a cursor date for the next incremental sync
    if (!nextPageToken && processed > 0) {
      const latest = await Email.findOne(
        { provider: 'gmail' },
        { received_at: 1 },
        { sort: { received_at: -1 } }
      ).lean();

      if (latest?.received_at) {
        const d = new Date(latest.received_at);
        nextRunAfterDate = [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0'),
        ].join('/');
      }
    }
  } catch (err) {
    if (isDailyLimitError(err)) {
      stoppedReason = 'dailyLimitExceeded';
      logger.warn('[Gmail Sync] Daily quota reached', { processed, failed });
    } else {
      logger.error('[Gmail Sync] Unexpected error', { error: err.message, stack: err.stack });
      throw err;
    }
  }

  logger.info('[Gmail Sync] Completed', { processed, skipped, failed, stoppedReason, nextPageToken });

  return { processed, skipped, failed, stoppedReason, nextPageToken, nextRunAfterDate };
}

/**
 * Fetch, enrich, and upsert a single Gmail message.
 * Returns 'ok' | 'skip' | 'fail'
 *
 * Extracted into its own function so the batch map stays clean and each
 * message failure is fully isolated.
 */
async function processMessage(gmail, messageId) {
  try {
    // ── Fetch full message ────────────────────────────────────────────────────
    const full = await withRetry(
      () => gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' }),
      `messages.get:${messageId}`
    );

    const msg     = full.data;
    const payload = msg.payload ?? {};

    // ── Map to Email shape ────────────────────────────────────────────────────
    const doc = await mapGmailMessageToEmail(msg, gmail);

    // ── Fetch + upload attachments ────────────────────────────────────────────
    doc.attachments = await fetchAndUploadAttachments(gmail, msg.id, payload);

    // ── Upsert into MongoDB ───────────────────────────────────────────────────
    await Email.findOneAndUpdate(
      { provider: 'gmail', provider_email_id: doc.provider_email_id },
      { $set: doc },
      { upsert: true, new: false }   // new:false avoids returning the full doc (perf)
    );

    return 'ok';
  } catch (err) {
    // Re-throw daily-limit errors so the outer loop can stop cleanly
    if (isDailyLimitError(err)) throw err;

    logger.warn('[Gmail Sync] Failed to process message', {
      messageId,
      error: err.message,
    });
    return 'fail';
  }
}

// ─── Read-time: hydrate signed attachment URLs ────────────────────────────────

/**
 * Given an email document from MongoDB, replace each attachment's storage_key
 * with a short-lived signed URL for the frontend.
 *
 * Call this in your GET /api/email/:id handler — never store the signed URL.
 *
 * @param {object} emailDoc  - Raw Mongoose/lean document
 * @param {number} [ttl=3600] - Signed URL TTL in seconds (default 1 hour)
 * @returns {object}  emailDoc with attachments[*].url populated
 */
async function hydrateAttachmentUrls(emailDoc, ttl = 3600) {
  if (!emailDoc?.attachments?.length) return emailDoc;

  const attachments = await Promise.all(
    emailDoc.attachments.map(async (att) => {
      if (!att.storage_key) return { ...att, url: null };
      try {
        const url = await getSignedAttachmentUrl(att.storage_key, ttl);
        return { ...att, url };
      } catch (err) {
        logger.warn('[Gmail Sync] Failed to generate signed URL', {
          storage_key: att.storage_key,
          error: err.message,
        });
        return { ...att, url: null };
      }
    })
  );

  return { ...emailDoc, attachments };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getOAuth2Client,
  fetchAndStoreHistory,
  hydrateAttachmentUrls,

  // Exposed for unit testing
  extractBody,
  collectAttachmentParts,
  mapGmailMessageToEmail,
};