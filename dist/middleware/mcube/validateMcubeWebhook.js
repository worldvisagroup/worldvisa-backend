"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMcubeWebhook = validateMcubeWebhook;
const logger = require('../../utils/logger');
function validateMcubeWebhook(req, res, next) {
    const secret = process.env.MCUBE_WEBHOOK_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            logger.error('[MCube Webhook] MCUBE_WEBHOOK_SECRET not set in production — rejecting');
            res.status(500).json({ error: 'Webhook secret not configured' });
            return;
        }
        logger.warn('[MCube Webhook] MCUBE_WEBHOOK_SECRET not set — skipping validation (dev only)');
        return next();
    }
    const incoming = req.headers['x-mcube-secret'];
    if (!incoming || incoming !== secret) {
        logger.warn('[MCube Webhook] Invalid or missing x-mcube-secret header', { ip: req.ip });
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}
