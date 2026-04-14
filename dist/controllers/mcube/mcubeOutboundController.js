"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOutboundCall = handleOutboundCall;
const mcubeOutboundService_1 = require("../../services/mcube/mcubeOutboundService");
const logger = require('../../utils/logger');
async function handleOutboundCall(req, res) {
    const { exenumber, custnumber, refurl, refid } = req.body;
    if (!exenumber) {
        res.status(400).json({ error: 'exenumber is required' });
        return;
    }
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
