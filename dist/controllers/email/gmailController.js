"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRedirect = oauthRedirect;
exports.oauthCallback = oauthCallback;
exports.syncGmailHistory = syncGmailHistory;
const googleapis_1 = require("googleapis");
const email_constants_1 = require("../../constants/email.constants");
const logger = require('../../utils/logger');
const gmailSyncService = require('../../services/gmail/gmailSyncService');
const { redis } = require('../../services/redis');
function buildOAuthClient(redirectUri) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
    }
    return new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
}
function resolveRedirectUri(req) {
    return (process.env.GMAIL_OAUTH_REDIRECT_URI ??
        `${req.protocol}://${req.get('host')}/api/email/oauth/callback`);
}
function oauthRedirect(req, res) {
    try {
        const redirectUri = resolveRedirectUri(req);
        const oauth2Client = buildOAuthClient(redirectUri);
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [email_constants_1.GMAIL_SCOPE],
            prompt: 'consent', // ensures refresh_token is returned every time
        });
        res.redirect(url);
    }
    catch (err) {
        logger.error('[Gmail OAuth] Redirect failed', { error: err.message });
        res.status(500).json({ error: err.message });
    }
}
async function oauthCallback(req, res) {
    const { code } = req.query;
    if (!code) {
        res.status(400).send('Missing ?code param. Visit GET /api/email/oauth first.');
        return;
    }
    try {
        const redirectUri = resolveRedirectUri(req);
        const oauth2Client = buildOAuthClient(redirectUri);
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.refresh_token) {
            res.status(400).send('No refresh_token returned. Revoke app access at myaccount.google.com/permissions and retry.');
            return;
        }
        res.type('text').send(`✅ Add this to your .env:\n\nGMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n\n⚠️  Keep this secret.`);
    }
    catch (err) {
        logger.error('[Gmail OAuth] Token exchange failed', { error: err.message });
        res.status(500).send(`Token exchange failed: ${err.message}`);
    }
}
async function syncGmailHistory(req, res) {
    if (redis) {
        const acquired = await redis.set(email_constants_1.GMAIL_SYNC_REDIS_KEY, '1', 'EX', email_constants_1.GMAIL_SYNC_COOLDOWN_SEC, 'NX');
        if (!acquired) {
            res.status(429).json({
                error: 'Sync already in progress or recently completed.',
                message: `Try again in ${email_constants_1.GMAIL_SYNC_COOLDOWN_SEC}s.`,
            });
            return;
        }
    }
    const { afterDate, pageToken, maxPages = 1000, maxMessages = 50000, } = (req.body ?? {});
    try {
        const result = await gmailSyncService.fetchAndStoreHistory({
            afterDate: afterDate ?? undefined,
            pageToken: pageToken ?? undefined,
            maxPages: Number(maxPages),
            maxMessages: Number(maxMessages),
        });
        const response = {
            processed: result.processed,
            skipped: result.skipped,
            failed: result.failed,
            stoppedReason: result.stoppedReason ?? undefined,
            nextPageToken: result.nextPageToken ?? undefined,
            nextRunAfterDate: result.nextRunAfterDate ?? undefined,
        };
        if (result.stoppedReason === 'dailyLimitExceeded') {
            response.message =
                `Daily Gmail quota reached. Stored ${result.processed} emails. ` +
                    `Resume tomorrow with nextPageToken or nextRunAfterDate.`;
        }
        else if (result.nextPageToken) {
            response.message = `More emails available — pass nextPageToken to continue.`;
        }
        res.status(200).json(response);
    }
    catch (err) {
        logger.error('[Gmail Sync] Controller error', { error: err.message });
        res.status(500).json({ error: 'Gmail sync failed', message: err.message });
    }
}
