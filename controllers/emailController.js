'use strict';

const { Webhook } = require('svix');
const { google } = require('googleapis');
const Email = require('../models/email');
const logger = require('../utils/logger');
const gmailSyncService = require('../services/gmail/gmailSyncService');

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let lastGmailSyncStartedAt = null;

/** Resend event type -> Email.last_event */
const EVENT_MAP = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.bounced': 'bounced',
};

/** Event order for deduplication: only update if new event is later (or terminal like bounced). */
const EVENT_ORDER = { queued: 0, sent: 1, delivered: 2, opened: 3, bounced: 4 };

/**
 * POST /api/email/webhook/resend
 * Expects req.body to be raw Buffer (use express.raw for this route).
 * Set RESEND_WEBHOOK_SECRET in env (from Resend dashboard or API) to verify webhook signatures; if unset, payload is logged but not verified.
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

  const lastEvent = EVENT_MAP[type];
  if (lastEvent && emailId) {
    try {
      const newOrder = EVENT_ORDER[lastEvent];
      const doc = await Email.findOne(
        { provider: 'resend', provider_email_id: emailId },
        { last_event: 1 }
      ).lean();
      if (doc && newOrder !== undefined) {
        const currentOrder = EVENT_ORDER[doc.last_event] ?? -1;
        if (newOrder >= currentOrder) {
          await Email.updateOne(
            { provider: 'resend', provider_email_id: emailId },
            { last_event: lastEvent }
          );
        }
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
 */
async function syncGmailHistory(req, res) {
  if (lastGmailSyncStartedAt && Date.now() - lastGmailSyncStartedAt < GMAIL_SYNC_COOLDOWN_MS) {
    return res.status(429).json({
      error: 'Sync in progress or recently run',
      message: 'Try again in a few minutes.',
    });
  }
  lastGmailSyncStartedAt = Date.now();
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

module.exports = {
  handleResendWebhook,
  oauthRedirect,
  oauthCallback,
  syncGmailHistory,
};
