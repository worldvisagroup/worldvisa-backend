"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleClerkWebhook = void 0;
const svix_1 = require("svix");
const clerk_1 = require("../constants/clerk");
const clerkWebhookService_1 = require("../services/clerk/clerkWebhookService");
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET ?? '';
const handleClerkWebhook = async (req, res) => {
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];
    if (!svixId || !svixTimestamp || !svixSignature) {
        res.status(400).json({ status: 'fail', message: clerk_1.WEBHOOK_ERRORS.MISSING_HEADERS });
        return;
    }
    let event;
    try {
        const wh = new svix_1.Webhook(CLERK_WEBHOOK_SECRET);
        event = wh.verify(req.body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        });
    }
    catch {
        res.status(400).json({ status: 'fail', message: clerk_1.WEBHOOK_ERRORS.INVALID_SIGNATURE });
        return;
    }
    try {
        switch (event.type) {
            case clerk_1.CLERK_WEBHOOK_EVENTS.USER_CREATED: {
                const result = await (0, clerkWebhookService_1.syncUserOnCreated)(event.data);
                res.status(200).json({ status: 'success', data: result });
                break;
            }
            case clerk_1.CLERK_WEBHOOK_EVENTS.USER_UPDATED: {
                const result = await (0, clerkWebhookService_1.syncUserOnUpdated)(event.data);
                res.status(200).json({ status: 'success', data: result });
                break;
            }
            case clerk_1.CLERK_WEBHOOK_EVENTS.USER_DELETED: {
                const result = await (0, clerkWebhookService_1.syncUserOnDeleted)(event.data.id);
                res.status(200).json({ status: 'success', data: result });
                break;
            }
            default:
                res.status(200).json({ status: 'success', ignored: true, type: event.type });
        }
    }
    catch (err) {
        res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
    }
};
exports.handleClerkWebhook = handleClerkWebhook;
