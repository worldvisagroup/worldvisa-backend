"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInboundWebhook = handleInboundWebhook;
const CallLog = require('../../models/callLog');
const ZohoDmsUser = require('../../models/zohoDmsUser');
const DmsZohoClient = require('../../models/dmsZohoClient');
const logger = require('../../utils/logger');
async function resolveAgentId(empPhone) {
    try {
        const user = await ZohoDmsUser
            .findOne({ agent_number: empPhone })
            .select('_id')
            .lean();
        return user?._id ?? null;
    }
    catch {
        return null;
    }
}
async function resolveClient(customerPhone) {
    try {
        const client = await DmsZohoClient
            .findOne({ phone: customerPhone })
            .select('_id lead_id')
            .lean();
        if (!client)
            return { client_id: null, client_lead_id: null };
        return { client_id: client._id, client_lead_id: client.lead_id };
    }
    catch {
        return { client_id: null, client_lead_id: null };
    }
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDate(value) {
    if (!value)
        return null;
    const d = new Date(value.replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
}
function toOnCallStatus(dialstatus) {
    switch (dialstatus) {
        case 'ANSWER': return 'answered';
        case 'CANCEL': return 'cancelled';
        case 'NoAnswer': return 'missed';
        case 'Busy':
        case 'Executive Busy': return 'busy';
        default: return 'initiated';
    }
}
function toHangupStatus(dialstatus) {
    switch (dialstatus) {
        case 'ANSWER': return 'completed';
        case 'CANCEL': return 'cancelled';
        case 'NoAnswer': return 'missed';
        case 'Busy':
        case 'Executive Busy': return 'busy';
        default: return 'completed';
    }
}
// ── Event processors ──────────────────────────────────────────────────────────
async function processOnCall(payload) {
    const startTime = parseDate(payload.starttime) ?? new Date();
    const now = new Date();
    const [agentId, { client_id, client_lead_id }] = await Promise.all([
        resolveAgentId(payload.emp_phone),
        resolveClient(payload.callto),
    ]);
    await CallLog.findOneAndUpdate({ call_id: payload.callid }, {
        $setOnInsert: {
            call_id: payload.callid,
            direction: payload.direction ?? 'inbound',
            status: toOnCallStatus(payload.dialstatus),
            dial_status: payload.dialstatus,
            agent_phone: payload.emp_phone,
            agent_name: payload.agentname,
            agent_id: agentId,
            customer_phone: payload.callto,
            client_id,
            client_lead_id,
            mcube_did: payload.clicktocalldid,
            group_name: payload.groupname,
            start_time: startTime,
            created_at: now,
            updated_at: now,
        },
    }, { upsert: true, new: false });
    logger.info('[MCube Webhook] On Call stored', {
        call_id: payload.callid,
        agent: payload.emp_phone,
        customer: payload.callto,
        dialstatus: payload.dialstatus,
    });
}
async function processHangup(payload) {
    const endTime = parseDate(payload.endtime);
    const now = new Date();
    const [agentId, { client_id, client_lead_id }] = await Promise.all([
        resolveAgentId(payload.emp_phone),
        resolveClient(payload.callto),
    ]);
    await CallLog.findOneAndUpdate({ call_id: payload.callid }, {
        $set: {
            status: toHangupStatus(payload.dialstatus),
            dial_status: payload.dialstatus,
            end_time: endTime,
            answered_duration: payload.answeredtime ?? null,
            disconnected_by: payload.disconnectedby ?? null,
            recording_url: payload.filename ?? null,
            updated_at: now,
        },
        // Create document if on-call event was missed
        $setOnInsert: {
            call_id: payload.callid,
            direction: payload.direction ?? 'inbound',
            agent_phone: payload.emp_phone,
            agent_name: payload.agentname,
            agent_id: agentId,
            customer_phone: payload.callto,
            client_id,
            client_lead_id,
            mcube_did: payload.clicktocalldid,
            group_name: payload.groupname,
            start_time: parseDate(payload.starttime) ?? now,
            created_at: now,
        },
    }, { upsert: true, new: true });
    logger.info('[MCube Webhook] On Hangup processed', {
        call_id: payload.callid,
        status: toHangupStatus(payload.dialstatus),
        duration: payload.answeredtime,
        recording: !!payload.filename,
    });
}
// ── Route handler ─────────────────────────────────────────────────────────────
async function handleInboundWebhook(req, res) {
    const payload = req.body;
    if (!payload?.callid || !payload?.emp_phone || !payload?.callto) {
        logger.warn('[MCube Webhook] Invalid payload — missing required fields', { body: payload });
        res.status(400).json({ error: 'Invalid payload' });
        return;
    }
    // Respond immediately — MCube does not wait for processing
    res.status(200).json({ received: true });
    const isHangup = Boolean(payload.endtime);
    try {
        if (isHangup) {
            await processHangup(payload);
        }
        else {
            await processOnCall(payload);
        }
    }
    catch (err) {
        logger.error('[MCube Webhook] Failed to persist call log', {
            call_id: payload.callid,
            event: isHangup ? 'hangup' : 'on_call',
            error: err.message,
        });
    }
}
