"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOutboundCall = handleOutboundCall;
const mcubeOutboundService_1 = require("../../services/mcube/mcubeOutboundService");
const logger = require('../../utils/logger');
async function handleOutboundCall(req, res) {
    const user = req.user;
    const exenumber = user?.agent_number;
    if (!exenumber) {
        res.status(400).json({ error: 'agent_number is not configured on your profile. Contact an administrator.' });
        return;
    }
    const { custnumber, refurl, refid } = req.body;
    if (!custnumber) {
        res.status(400).json({ error: 'custnumber is required' });
        return;
    }
    try {
        await (0, mcubeOutboundService_1.initiateOutboundCall)({ exenumber, custnumber, refurl, refid });
        res.status(200).json({ success: true });
    }
    catch (err) {
        logger.error('[MCube] Outbound call failed', {
            exenumber,
            custnumber,
            error: err.message,
        });
        res.status(502).json({ error: 'Failed to initiate call', detail: err.message });
    }
}
