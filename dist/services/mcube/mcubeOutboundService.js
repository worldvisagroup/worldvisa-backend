"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateOutboundCall = initiateOutboundCall;
const CallLog = require('../../models/callLog');
const logger = require('../../utils/logger');
const MCUBE_OUTBOUND_URL = 'https://api.mcube.com/Restmcube-api/outbound-calls';
async function initiateOutboundCall(params) {
    const token = process.env.MCUBE_API_TOKEN;
    if (!token)
        throw new Error('MCUBE_API_TOKEN is not configured');
    const body = {
        HTTP_AUTHORIZATION: token,
        exenumber: params.exenumber,
        custnumber: params.custnumber,
        refurl: params.refurl ?? 1,
        ...(params.refid ? { refid: params.refid } : {}),
    };
    const response = await fetch(MCUBE_OUTBOUND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`MCube API error ${response.status}: ${text}`);
    }
    const now = new Date();
    await CallLog.create({
        call_id: params.refid ?? `out-${params.exenumber}-${params.custnumber}-${Date.now()}`,
        direction: 'outbound',
        status: 'initiated',
        agent_phone: params.exenumber,
        customer_phone: params.custnumber,
        start_time: now,
        created_at: now,
        updated_at: now,
        metadata: { refid: params.refid ?? null },
    });
    logger.info('[MCube] Outbound call initiated', {
        exenumber: params.exenumber,
        custnumber: params.custnumber,
    });
}
