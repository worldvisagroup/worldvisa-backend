"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveClientByEmail = resolveClientByEmail;
const DmsZohoClient = require('../../models/dmsZohoClient');
const logger = require('../../utils/logger');
async function resolveClientByEmail(req, res) {
    try {
        const rawEmail = req.query.email;
        const email = rawEmail?.toLowerCase().trim();
        if (!email) {
            res.status(400).json({ status: 'fail', message: 'email query param is required' });
            return;
        }
        const client = await DmsZohoClient
            .findOne({ email })
            .select('_id name email lead_id account_status')
            .lean();
        if (!client) {
            res.status(404).json({ status: 'fail', message: `No client found with email: ${email}` });
            return;
        }
        res.status(200).json({ status: 'success', data: { client } });
    }
    catch (err) {
        logger.error('[Email] resolveClientByEmail failed', { error: err.message });
        res.status(500).json({ status: 'error', message: 'Failed to resolve client' });
    }
}
