'use strict';

const { google } = require('googleapis');
const Email = require('../../models/email');
const logger = require('../../utils/logger');
const { uploadToR2, getEmailAttachmentKey } = require('../r2Client');

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const LIST_DELAY_MS = 350;
const BATCH_SIZE = 12;
const BATCH_DELAY_MS = 300;
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

function getHeader(headers, name) {
  if (!Array.isArray(headers)) return null;
  const h = headers.find((x) => x.name && x.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : null;
}

function parseAddressList(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function decodeBase64url(str) {
  if (!str) return Buffer.alloc(0);
  let base64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  return Buffer.from(base64, 'base64');
}

function getBodyFromPayload(payload) {
  let html = null;
  let text = null;
  if (payload.body && payload.body.data) {
    const decoded = decodeBase64url(payload.body.data).toString('utf8');
    const mime = (payload.mimeType || '').toLowerCase();
    if (mime.includes('html')) html = decoded;
    else text = decoded;
  }
  if (payload.parts && payload.parts.length) {
    for (const part of payload.parts) {
      if (!part.body || !part.body.data) continue;
      const decoded = decodeBase64url(part.body.data).toString('utf8');
      const mime = (part.mimeType || '').toLowerCase();
      if (mime.includes('html') && !html) html = decoded;
      else if ((mime.includes('plain') || !part.filename) && !text) text = decoded;
    }
  }
  return { html, text };
}

function mapAttachments(payload) {
  const attachments = [];
  if (!payload.parts) return attachments;
  for (const part of payload.parts) {
    if (!part.filename) continue;
    attachments.push({
      filename: part.filename,
      content_type: part.mimeType || 'application/octet-stream',
      size: part.body?.size || 0,
      storage_url: '',
    });
  }
  return attachments;
}

const ATTACHMENT_UPLOAD_DELAY_MS = 100;


async function fetchAttachmentsAndUploadToR2(gmail, messageId, payload) {
  const attachments = [];
  if (!payload.parts) return attachments;

  for (const part of payload.parts) {
    if (!part.filename) continue;

    let buffer;
    if (part.body && part.body.data) {
      buffer = decodeBase64url(part.body.data);
    } else if (part.body && part.body.attachmentId) {
      try {
        const res = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId,
          id: part.body.attachmentId,
        });
        buffer = decodeBase64url(res.data.data);
      } catch (err) {
        logger.warn('[Gmail Sync] Failed to fetch attachment', {
          messageId,
          attachmentId: part.body.attachmentId,
          error: err.message,
        });
        attachments.push({
          filename: part.filename,
          content_type: part.mimeType || 'application/octet-stream',
          size: part.body?.size || 0,
          storage_url: '',
        });
        continue;
      }
    } else {
      continue;
    }

    const key = getEmailAttachmentKey({
      direction: 'inbound',
      messageId,
      attachmentId: part.body?.attachmentId,
      filename: part.filename,
    });

    try {
      const url = await uploadToR2(key, buffer, part.mimeType || 'application/octet-stream');
      attachments.push({
        filename: part.filename,
        content_type: part.mimeType || 'application/octet-stream',
        size: part.body?.size || buffer.length,
        storage_url: url,
      });
    } catch (err) {
      logger.warn('[Gmail Sync] R2 upload failed for attachment', {
        messageId,
        filename: part.filename,
        error: err.message,
      });
      attachments.push({
        filename: part.filename,
        content_type: part.mimeType || 'application/octet-stream',
        size: part.body?.size || 0,
        storage_url: '',
      });
    }

    await sleep(ATTACHMENT_UPLOAD_DELAY_MS);
  }

  return attachments;
}

function gmailMessageToEmail(msg) {
  const payload = msg.payload || {};
  const headers = payload.headers || [];
  const from = getHeader(headers, 'From') || '';
  const labelIds = msg.labelIds || [];
  const direction = labelIds.includes('SENT') ? 'outbound' : 'inbound';
  const { html, text } = getBodyFromPayload(payload);
  const internalDate = msg.internalDate ? new Date(parseInt(msg.internalDate, 10)) : null;

  return {
    provider: 'gmail',
    provider_email_id: String(msg.id),
    message_id: getHeader(headers, 'Message-ID') || null,
    in_reply_to: getHeader(headers, 'In-Reply-To') || null,
    references: (getHeader(headers, 'References') || '').split(/\s+/).map((s) => s.trim()).filter(Boolean),
    thread_id: msg.threadId ? String(msg.threadId) : null,
    client_id: null,
    direction,
    email_type: 'client',
    from,
    to: parseAddressList(getHeader(headers, 'To')),
    cc: parseAddressList(getHeader(headers, 'Cc')),
    bcc: parseAddressList(getHeader(headers, 'Bcc')),
    reply_to: parseAddressList(getHeader(headers, 'Reply-To')),
    subject: getHeader(headers, 'Subject') || '',
    html,
    text,
    attachments: mapAttachments(payload),
    headers: {},
    last_event: 'delivered',
    created_at: internalDate || new Date(),
    received_at: internalDate,
  };
}

function isDailyLimitError(err) {
  const msg = (err && err.message) || '';
  const code = err.code || (err.response && err.response.status);
  return (
    code === 403 ||
    msg.includes('dailyLimitExceeded') ||
    msg.includes('daily limit') ||
    (err.errors && err.errors.some((e) => (e.reason || '').toLowerCase().includes('daily')))
  );
}

function isRateLimitError(err) {
  const msg = (err && err.message) || '';
  const code = err.code || (err.response && err.response.status);
  return (
    code === 429 ||
    msg.includes('rateLimitExceeded') ||
    msg.includes('userRateLimitExceeded') ||
    msg.includes('rate limit')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn) {
  let lastErr;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isDailyLimitError(err)) throw err;
      if (!isRateLimitError(err) || i === MAX_RETRIES) throw err;
      const delay = BACKOFF_MS[Math.min(i, BACKOFF_MS.length - 1)];
      logger.warn('[Gmail Sync] Rate limit, retrying', { attempt: i + 1, delayMs: delay });
      await sleep(delay);
    }
  }
  throw lastErr;
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, undefined);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

async function fetchAndStoreHistory(options = {}) {
  const { afterDate, pageToken, maxPages = 1000, maxMessages = 50000 } = options;
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let stoppedReason = null;
  let nextPageToken = pageToken || null;
  let nextRunAfterDate = null;
  let currentPageToken = pageToken || undefined;
  let pagesDone = 0;

  const query = afterDate ? `after:${afterDate.replace(/-/g, '/')}` : undefined;

  logger.info('[Gmail Sync] Starting fetchAndStoreHistory', {
    afterDate: afterDate || null,
    hasPageToken: !!pageToken,
    maxPages,
    maxMessages,
  });

  try {
    while (pagesDone < maxPages && processed + skipped + failed < maxMessages) {
      const listRes = await withRetry(() =>
        gmail.users.messages.list({
          userId: 'me',
          maxResults: 100,
          pageToken: currentPageToken,
          q: query,
        })
      );

      const messages = listRes.data.messages || [];
      currentPageToken = listRes.data.nextPageToken || null;

      if (messages.length === 0 && !currentPageToken) break;

      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (m) => {
          try {
            const full = await withRetry(() =>
              gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' })
            );
            const doc = gmailMessageToEmail(full.data);

            if (doc.attachments && doc.attachments.length > 0) {
              doc.attachments = await fetchAttachmentsAndUploadToR2(
                gmail,
                full.data.id,
                full.data.payload || {}
              );
            }

            await Email.findOneAndUpdate(
              { provider: 'gmail', provider_email_id: doc.provider_email_id },
              { $set: doc },
              { upsert: true }
            );
            return { ok: true };
          } catch (err) {
            if (isDailyLimitError(err)) throw err;
            logger.warn('[Gmail Sync] Message fetch failed', { messageId: m.id, error: err.message });
            return { ok: false };
          }
        });

        const results = await Promise.all(promises);
        for (const r of results) {
          if (r.ok) processed++;
          else failed++;
        }

        if (processed + failed + skipped >= maxMessages) {
          stoppedReason = 'maxMessages';
          nextPageToken = currentPageToken;
          break;
        }

        await sleep(BATCH_DELAY_MS);
      }

      pagesDone++;
      if (stoppedReason) break;

      if (!currentPageToken) break;
      nextPageToken = currentPageToken;
      await sleep(LIST_DELAY_MS);
    }

    if (!nextPageToken && processed > 0) {
      const last = await Email.findOne(
        { provider: 'gmail' },
        { received_at: 1 },
        { sort: { received_at: -1 } }
      ).lean();
      if (last && last.received_at) {
        const d = new Date(last.received_at);
        nextRunAfterDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      }
    }
  } catch (err) {
    if (isDailyLimitError(err)) {
      stoppedReason = 'dailyLimitExceeded';
      logger.warn('[Gmail Sync] Daily limit reached', { processed, failed });
    } else {
      logger.error('[Gmail Sync] fetchAndStoreHistory error', { error: err.message });
      throw err;
    }
  }

  logger.info('[Gmail Sync] Completed', {
    processed,
    skipped,
    failed,
    stoppedReason,
    nextPageToken: nextPageToken || null,
  });

  return {
    processed,
    skipped,
    failed,
    stoppedReason,
    nextPageToken,
    nextRunAfterDate,
  };
}

module.exports = { getOAuth2Client, fetchAndStoreHistory };
