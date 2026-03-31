"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEmails = listEmails;
exports.getThreadMessages = getThreadMessages;
exports.getEmailById = getEmailById;
exports.getEmailWithThread = getEmailWithThread;
exports.sendEmail = sendEmail;
exports.markAsRead = markAsRead;
const mongoose_1 = __importDefault(require("mongoose"));
const email_constants_1 = require("../../constants/email.constants");
const Email = require('../../models/email');
const logger = require('../../utils/logger');
const { addActivityLog } = require('../helper/service/activityLog');
const gmailSyncService = require('../../services/gmail/gmailSyncService');
const emailService = require('../../services/notifications/emailService');
const { redis } = require('../../services/redis');
// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function isValidObjectId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}
// ── Redis unread-count cache ──────────────────────────────────────────────────
async function getCachedUnreadCount() {
    if (!redis)
        return null;
    try {
        const val = await redis.get(email_constants_1.UNREAD_CACHE_KEY);
        return val !== null ? parseInt(val, 10) : null;
    }
    catch {
        return null;
    }
}
async function setCachedUnreadCount(count) {
    if (!redis)
        return;
    try {
        await redis.set(email_constants_1.UNREAD_CACHE_KEY, String(count), 'EX', email_constants_1.UNREAD_CACHE_TTL);
    }
    catch { /* non-fatal */ }
}
async function invalidateUnreadCache() {
    if (!redis)
        return;
    try {
        await redis.del(email_constants_1.UNREAD_CACHE_KEY);
    }
    catch { /* non-fatal */ }
}
// ── GET /api/email ────────────────────────────────────────────────────────────
async function listEmails(req, res) {
    try {
        const { page: pageParam, limit: limitParam, direction, filter: filterParam, email_type: emailTypeParam, client_id: clientIdParam, email: emailParam, provider, q, unread, today, startDate, endDate, } = req.query;
        const page = Math.max(parseInt(pageParam ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || email_constants_1.DEFAULT_EMAIL_LIMIT, 1), email_constants_1.MAX_EMAIL_LIMIT);
        const match = {};
        if (direction) {
            if (!email_constants_1.VALID_DIRECTIONS.includes(direction)) {
                res.status(400).json({ error: `direction must be one of: ${email_constants_1.VALID_DIRECTIONS.join(', ')}` });
                return;
            }
            match.direction = direction;
        }
        // email_type: explicit enum filter (new) — takes priority over legacy ?filter=system
        if (emailTypeParam) {
            if (!email_constants_1.VALID_EMAIL_TYPES.includes(emailTypeParam)) {
                res.status(400).json({ error: `email_type must be one of: ${email_constants_1.VALID_EMAIL_TYPES.join(', ')}` });
                return;
            }
            match.email_type = emailTypeParam;
        }
        else if (filterParam) {
            // Legacy shorthand: ?filter=system (backwards compat)
            if (filterParam !== 'system') {
                res.status(400).json({ error: 'filter must be "system"' });
                return;
            }
            match.email_type = 'system';
        }
        else if (direction === 'outbound') {
            match.email_type = { $ne: 'system' };
        }
        if (clientIdParam) {
            if (!isValidObjectId(clientIdParam)) {
                res.status(400).json({ error: 'client_id must be a 24-character hex ObjectId' });
                return;
            }
            match.client_id = new mongoose_1.default.Types.ObjectId(clientIdParam);
        }
        if (provider) {
            if (!email_constants_1.VALID_PROVIDERS.includes(provider)) {
                res.status(400).json({ error: `provider must be one of: ${email_constants_1.VALID_PROVIDERS.join(', ')}` });
                return;
            }
            match.provider = provider;
        }
        if (emailParam?.trim()) {
            const re = { $regex: escapeRegex(emailParam.trim()), $options: 'i' };
            match.$or = [{ from: re }, { to: re }, { cc: re }, { bcc: re }];
        }
        if (q?.trim()) {
            const re = { $regex: escapeRegex(q.trim()), $options: 'i' };
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
        // Date range filter (new)
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate)
                dateFilter.$gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate)
                dateFilter.$lte = new Date(`${endDate}T23:59:59.999Z`);
            match.$and = [...(match.$and ?? []), { created_at: dateFilter }];
        }
        const skip = (page - 1) * limit;
        // Critical memory optimisation: strip heavy fields BEFORE $group so that
        // $$ROOT never carries html/text (10–50 KB each) through the grouping stage.
        // Sort on created_at (always-set, real field) so MongoDB can use the index
        // instead of computing a _sortTime expression which blocks index usage.
        const preGroupStages = [
            { $match: match },
            { $project: email_constants_1.EMAIL_LIST_HEAVY_EXCLUDE },
            { $sort: { created_at: -1 } },
            {
                $group: {
                    _id: { $ifNull: ['$thread_id', { $toString: '$_id' }] },
                    doc: { $first: '$$ROOT' },
                    messageCount: { $sum: 1 },
                },
            },
            {
                $replaceRoot: {
                    newRoot: { $mergeObjects: ['$doc', { messageCount: '$messageCount' }] },
                },
            },
            { $sort: { created_at: -1 } },
        ];
        // Cache the global (no-filter) unread count for 60 s — the inbox badge pattern.
        const isGlobalQuery = !clientIdParam && !direction && !filterParam && !emailTypeParam && !q && !emailParam && !provider && !today && !startDate && !endDate;
        const cachedUnread = isGlobalQuery ? await getCachedUnreadCount() : null;
        const facets = {
            data: [...preGroupStages, { $skip: skip }, { $limit: limit }],
            count: [...preGroupStages, { $count: 'count' }],
        };
        // Only compute unread count for global inbox — filtered views don't need it.
        if (isGlobalQuery && cachedUnread === null) {
            const matchUnread = { ...match, is_read: false };
            facets.unreadCount = [
                { $match: matchUnread },
                { $group: { _id: { $ifNull: ['$thread_id', { $toString: '$_id' }] } } },
                { $count: 'count' },
            ];
        }
        // allowDiskUse: safety net for sort stages on 10k+ docs exceeding 100 MB RAM limit
        const [facetResult] = await Email.aggregate([{ $facet: facets }], { allowDiskUse: true });
        const rows = facetResult.data ?? [];
        const total = facetResult.count?.[0]?.count ?? 0;
        let unreadTotal;
        if (cachedUnread !== null) {
            unreadTotal = cachedUnread;
        }
        else {
            unreadTotal = facetResult.unreadCount?.[0]?.count ?? 0;
            if (isGlobalQuery)
                await setCachedUnreadCount(unreadTotal);
        }
        res.status(200).json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            unreadTotal,
        });
    }
    catch (err) {
        logger.error('[Email] listEmails failed', { error: err.message });
        res.status(500).json({ error: 'Failed to fetch email list' });
    }
}
// ── GET /api/email/threads/:threadId ──────────────────────────────────────────
async function getThreadMessages(req, res) {
    try {
        const threadId = req.params.threadId;
        if (!threadId?.trim()) {
            res.status(400).json({ error: 'threadId is required' });
            return;
        }
        const limit = Math.min(parseInt(req.query.limit ?? '100', 10) || email_constants_1.MAX_THREAD_MESSAGES, email_constants_1.MAX_THREAD_MESSAGES);
        const messages = await Email.aggregate([
            { $match: { thread_id: threadId } },
            { $addFields: { _sortTime: { $ifNull: ['$received_at', '$created_at'] } } },
            { $sort: { _sortTime: 1 } },
            { $limit: limit },
            { $project: { _sortTime: 0 } },
        ]);
        const hydrated = await Promise.all(messages.map((m) => gmailSyncService.hydrateAttachmentUrls(m)));
        res.status(200).json({ data: hydrated });
    }
    catch (err) {
        logger.error('[Email] getThreadMessages failed', { error: err.message });
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
}
// ── GET /api/email/:id ────────────────────────────────────────────────────────
async function getEmailById(req, res) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({ error: 'Invalid email id' });
            return;
        }
        const email = await Email.findById(id).lean();
        if (!email) {
            res.status(404).json({ error: 'Email not found' });
            return;
        }
        const hydrated = await gmailSyncService.hydrateAttachmentUrls(email);
        res.status(200).json(hydrated);
    }
    catch (err) {
        logger.error('[Email] getEmailById failed', { id: req.params.id, error: err.message });
        res.status(500).json({ error: 'Failed to fetch email' });
    }
}
// ── GET /api/email/:id/with-thread ────────────────────────────────────────────
async function getEmailWithThread(req, res) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({ error: 'Invalid email id' });
            return;
        }
        const email = await Email.findById(id).lean();
        if (!email) {
            res.status(404).json({ error: 'Email not found' });
            return;
        }
        const hydratedEmail = await gmailSyncService.hydrateAttachmentUrls(email);
        if (!email.thread_id) {
            // Standalone message — wrap in a one-element thread
            const { html: _h, text: _t, ...minimal } = hydratedEmail;
            res.status(200).json({ email: hydratedEmail, thread: [minimal] });
            return;
        }
        const threadDocs = await Email.aggregate([
            { $match: { thread_id: email.thread_id } },
            { $addFields: { _sortTime: { $ifNull: ['$received_at', '$created_at'] } } },
            { $sort: { _sortTime: 1 } },
            { $limit: email_constants_1.MAX_THREAD_MESSAGES },
            { $project: { html: 0, text: 0, _sortTime: 0 } },
        ]);
        const hydratedThread = await Promise.all(threadDocs.map((m) => gmailSyncService.hydrateAttachmentUrls(m)));
        res.status(200).json({ email: hydratedEmail, thread: hydratedThread });
    }
    catch (err) {
        logger.error('[Email] getEmailWithThread failed', { id: req.params.id, error: err.message });
        res.status(500).json({ error: 'Failed to fetch email with thread' });
    }
}
// ── POST /api/email/send ──────────────────────────────────────────────────────
async function sendEmail(req, res) {
    try {
        const { to, subject, html, text, cc, bcc, client_id, in_reply_to, message_id, } = (req.body ?? {});
        const files = req.files ?? [];
        if (!to || (typeof to === 'string' && !to.trim())) {
            res.status(400).json({ error: '"to" is required' });
            return;
        }
        if (!(typeof subject === 'string' && subject.trim())) {
            res.status(400).json({ error: '"subject" is required' });
            return;
        }
        if (!(typeof html === 'string' && html.trim())) {
            res.status(400).json({ error: '"html" is required' });
            return;
        }
        let clientId = null;
        if (client_id) {
            if (!isValidObjectId(client_id)) {
                res.status(400).json({ error: 'Invalid "client_id"' });
                return;
            }
            clientId = new mongoose_1.default.Types.ObjectId(client_id);
        }
        if (files.length > email_constants_1.MAX_ATTACHMENTS) {
            res.status(400).json({ error: `Maximum ${email_constants_1.MAX_ATTACHMENTS} attachments allowed` });
            return;
        }
        const totalSize = files.reduce((sum, f) => sum + (f.size ?? f.buffer?.length ?? 0), 0);
        if (totalSize > email_constants_1.MAX_ATTACHMENT_BYTES) {
            res.status(400).json({ error: 'Total attachment size exceeds 25 MB' });
            return;
        }
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
            attachments: files.map((f) => ({
                buffer: f.buffer,
                filename: f.originalname ?? f.name ?? 'attachment',
                mimetype: f.mimetype ?? 'application/octet-stream',
            })),
        });
        // Fire-and-forget activity log
        if (clientId) {
            setImmediate(async () => {
                try {
                    const DmsZohoClient = require('../../models/dmsZohoClient');
                    const client = await DmsZohoClient.findById(clientId).select('lead_id').lean();
                    if (client?.lead_id) {
                        addActivityLog({
                            lead_id: client.lead_id,
                            activity_type: 'email_sent',
                            summary: `${req.user?.username ?? 'Unknown'} sent email: "${subject}"`,
                            actor_type: 'staff',
                            actor_name: req.user?.username ?? 'Unknown',
                            actor_role: req.user?.role ?? null,
                            metadata: { subject, to, email_id: result?.id ?? null },
                        });
                    }
                }
                catch { /* non-fatal */ }
            });
        }
        res.status(200).json({ success: true, id: result.id });
    }
    catch (err) {
        logger.error('[Email] sendEmail failed', { error: err.message });
        const isClientError = /missing|invalid|required|exceeds/i.test(err.message ?? '');
        res.status(isClientError ? 400 : 500).json({ error: err.message || 'Failed to send email' });
    }
}
// ── PATCH /api/email/:id/read ─────────────────────────────────────────────────
async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({ error: 'Invalid email id' });
            return;
        }
        const result = await Email.updateOne({ _id: id }, { $set: { is_read: true } });
        if (result.matchedCount === 0) {
            res.status(404).json({ error: 'Email not found' });
            return;
        }
        if (result.modifiedCount > 0) {
            invalidateUnreadCache().catch(() => { });
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        logger.error('[Email] markAsRead failed', { id: req.params.id, error: err.message });
        res.status(500).json({ error: 'Failed to mark email as read' });
    }
}
