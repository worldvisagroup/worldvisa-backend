"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInboundWebhook = handleInboundWebhook;
const CallLog = require('../../models/callLog');
const ZohoDmsUser = require('../../models/zohoDmsUser');
const DmsZohoClient = require('../../models/dmsZohoClient');
const logger = require('../../utils/logger');
async function resolveAgent(empPhone, agentName) {
    try {
        const digits = empPhone.replace(/\D/g, '');
        const suffix = digits.length >= 6 ? digits.slice(-9) : null;
        const user = await ZohoDmsUser
            .findOne(suffix
            ? { agent_number: { $regex: `${suffix}$` } }
            : agentName
                ? { $or: [{ mcube_username: agentName }, { full_name: agentName }] }
                : { agent_number: empPhone })
            .select('_id profile_image_url')
            .lean()
            ?? (agentName
                ? await ZohoDmsUser
                    .findOne({ $or: [{ mcube_username: agentName }, { full_name: agentName }] })
                    .select('_id profile_image_url')
                    .lean()
                : null);
        return {
            agent_id: user?._id ?? null,
            agent_image_url: user?.profile_image_url ?? null,
        };
    }
    catch {
        return { agent_id: null, agent_image_url: null };
    }
}
async function resolveClient(customerPhone) {
    try {
        const digits = customerPhone.replace(/\D/g, '');
        if (digits.length < 6)
            return { client_id: null, client_lead_id: null, client_name: null, client_image_url: null };
        const suffix = digits.slice(-9);
        const client = await DmsZohoClient
            .findOne({ phone: { $regex: `${suffix}$` } })
            .select('_id lead_id name profile_image_url')
            .lean();
        if (!client)
            return { client_id: null, client_lead_id: null, client_name: null, client_image_url: null };
        return {
            client_id: client._id,
            client_lead_id: client.lead_id ?? null,
            client_name: client.name ?? null,
            client_image_url: client.profile_image_url ?? null,
        };
    }
    catch {
        return { client_id: null, client_lead_id: null, client_name: null, client_image_url: null };
    }
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDate(value) {
    if (!value)
        return null;
    const d = new Date(value.replace(' ', 'T') + '+05:30');
    return isNaN(d.getTime()) ? null : d;
}
function toOnCallStatus(dialstatus) {
    switch (dialstatus.toUpperCase()) {
        case 'ANSWER': return 'answered';
        case 'CANCEL': return 'cancelled';
        case 'NOANSWER': return 'missed';
        case 'BUSY':
        case 'EXECUTIVE BUSY': return 'busy';
        default: return 'initiated';
    }
}
function toHangupStatus(dialstatus) {
    switch (dialstatus.toUpperCase()) {
        case 'ANSWER': return 'completed';
        case 'CANCEL': return 'cancelled';
        case 'NOANSWER': return 'missed';
        case 'BUSY':
        case 'EXECUTIVE BUSY': return 'busy';
        default: return 'completed';
    }
}
function shouldEmitHangup(dialstatus, direction) {
    const status = dialstatus.toUpperCase();
    if (status === 'ANSWER')
        return true;
    if (status === 'NOANSWER')
        return direction.toLowerCase() === 'outbound';
    return false;
}
// ── Event processors ──────────────────────────────────────────────────────────
async function processOnCall(payload, req) {
    const startTime = parseDate(payload.starttime) ?? new Date();
    const now = new Date();
    const [{ agent_id, agent_image_url }, { client_id, client_lead_id, client_name, client_image_url }] = await Promise.all([
        resolveAgent(payload.emp_phone, payload.agentname),
        resolveClient(payload.callto),
    ]);
    const result = await CallLog.findOneAndUpdate({ call_id: payload.callid }, {
        $setOnInsert: {
            call_id: payload.callid,
            direction: payload.direction?.toLowerCase() ?? 'inbound',
            status: toOnCallStatus(payload.dialstatus),
            dial_status: payload.dialstatus,
            agent_phone: payload.emp_phone,
            agent_name: payload.agentname,
            agent_id,
            agent_image_url,
            customer_phone: payload.callto,
            client_id,
            client_lead_id,
            client_name,
            client_image_url,
            mcube_did: payload.clicktocalldid,
            group_name: payload.groupname,
            start_time: startTime,
            created_at: now,
            updated_at: now,
        },
    }, { upsert: true, new: true, includeResultMetadata: true });
    const doc = result?.value;
    const isNewCall = result?.lastErrorObject?.updatedExisting === false;
    const io = req.app.get('io');
    if (io && doc && isNewCall) {
        io.emit('call-log:new', doc);
        if (agent_id) {
            io.to(`user:${agent_id}`).emit('call:inbound', doc);
        }
    }
    logger.info('[MCube Webhook] On Call stored', {
        call_id: payload.callid,
        agent: payload.emp_phone,
        customer: payload.callto,
        dialstatus: payload.dialstatus,
    });
}
async function processHangup(payload, req) {
    const endTime = parseDate(payload.endtime);
    const now = new Date();
    const [{ agent_id, agent_image_url }, { client_id, client_lead_id, client_name, client_image_url }] = await Promise.all([
        resolveAgent(payload.emp_phone, payload.agentname),
        resolveClient(payload.callto),
    ]);
    const doc = await CallLog.findOneAndUpdate({ call_id: payload.callid }, {
        $set: {
            status: toHangupStatus(payload.dialstatus),
            dial_status: payload.dialstatus,
            end_time: endTime,
            answered_duration: payload.answeredtime ?? null,
            disconnected_by: payload.disconnectedby ?? null,
            recording_url: payload.filename ?? null,
            updated_at: now,
        },
        $setOnInsert: {
            call_id: payload.callid,
            direction: payload.direction?.toLowerCase() ?? 'inbound',
            agent_phone: payload.emp_phone,
            agent_name: payload.agentname,
            agent_id,
            agent_image_url,
            customer_phone: payload.callto,
            client_id,
            client_lead_id,
            client_name,
            client_image_url,
            mcube_did: payload.clicktocalldid,
            group_name: payload.groupname,
            start_time: parseDate(payload.starttime) ?? now,
            created_at: now,
        },
    }, { upsert: true, new: true });
    if (client_id) {
        DmsZohoClient.findByIdAndUpdate(client_id, { last_communication_activity: endTime ?? now, last_communication_provider: 'call' }).catch(() => { });
    }
    const io = req.app.get('io');
    if (io && doc) {
        io.emit('call-log:updated', doc);
        if (agent_id && shouldEmitHangup(payload.dialstatus, payload.direction)) {
            io.to(`user:${agent_id}`).emit('call:hangup', doc);
        }
    }
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
    res.status(200).json({ received: true });
    const isHangup = Boolean(payload.endtime);
    try {
        if (isHangup) {
            await processHangup(payload, req);
        }
        else {
            await processOnCall(payload, req);
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
