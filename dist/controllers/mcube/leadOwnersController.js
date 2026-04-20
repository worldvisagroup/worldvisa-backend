"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLeadOwners = listLeadOwners;
exports.getLeadOwnerByPhone = getLeadOwnerByPhone;
const ZohoDmsUser = require('../../models/zohoDmsUser');
const DmsZohoClient = require('../../models/dmsZohoClient');
const logger = require('../../utils/logger');
async function listLeadOwners(_req, res) {
    try {
        const users = await ZohoDmsUser
            .find({ account_status: 'active', role: 'admin' })
            .select('_id username email agent_number mcube_username role')
            .lean();
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { leadOwners: users },
        });
    }
    catch (err) {
        logger.error('[MCube] listLeadOwners failed', { error: err.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch lead owners' });
    }
}
async function getLeadOwnerByPhone(req, res) {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({ status: 'fail', message: 'phoneNumber is required in request body' });
            return;
        }
        // Strip everything except digits, then take last 9 digits for country-code-agnostic match
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length < 6) {
            res.status(400).json({ status: 'fail', message: 'phoneNumber is too short' });
            return;
        }
        const suffix = digits.slice(-9);
        const client = await DmsZohoClient
            .findOne({ phone: { $regex: `${suffix}$` } })
            .select('lead_owner name phone')
            .lean();
        if (!client) {
            res.status(404).json({ status: 'fail', message: 'No client found with that phone number' });
            return;
        }
        res.status(200).json({
            status: 'success',
            data: {
                name: client.name,
                lead_owner: client.lead_owner,
            },
        });
    }
    catch (err) {
        logger.error('[MCube] getLeadOwnerByPhone failed', { error: err.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch lead owner' });
    }
}
