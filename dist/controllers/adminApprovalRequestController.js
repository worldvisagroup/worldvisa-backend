"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequest = createRequest;
exports.getRequests = getRequests;
exports.getRequestsByLead = getRequestsByLead;
exports.approveRequest = approveRequest;
exports.rejectRequest = rejectRequest;
const adminApprovalRequest_model_1 = __importDefault(require("../models/adminApprovalRequest.model"));
const DmsZohoClient = require('../models/dmsZohoClient');
const ZohoDmsUser = require('../models/zohoDmsUser');
const { updateRecentActivityInMongo } = require('./helper/service/functions');
const { addNotificationAndEmit } = require('./helper/service/notifications');
const { addActivityLog } = require('./helper/service/activityLog');
// ─── Zoho → MongoDB field name map ────────────────────────────────────────────
const ZOHO_TO_MONGO_FIELD = {
    Deadline_For_Lodgment: 'deadline_for_lodgment',
    Application_Stage: 'application_stage',
    Application_State: 'application_state',
    DMS_Application_Status: 'dms_application_status',
    Quality_Check_From: 'quality_check_from',
    Package_Finalize: 'package_finalize',
    Checklist_Requested: 'checklist_requested',
    Send_Check_List: 'send_check_list',
    Qualified_Country: 'qualified_country',
    Service_Finalized: 'service_type',
    Suggested_Anzsco: 'suggested_anzsco',
    Assessing_Authority: 'assessing_authority',
    Spouse_Skill_Assessment: 'spouse_skill_assessment',
    Spouse_Name: 'spouse_name',
    Main_Applicant: 'main_applicant',
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getUser(req) {
    return req.user;
}
async function getUserInfoMap(usernames) {
    const unique = [...new Set(usernames.filter(Boolean))];
    if (!unique.length)
        return {};
    const users = await ZohoDmsUser.find({ username: { $in: unique } })
        .select('username full_name profile_image_url')
        .lean();
    return Object.fromEntries(users.map((u) => [u.username, u]));
}
async function getClientName(leadId) {
    const client = await DmsZohoClient.findOne({ lead_id: leadId })
        .select('name full_name')
        .lean();
    return client?.name ?? client?.full_name ?? leadId;
}
async function getClientInfoMap(leadIds) {
    const unique = [...new Set(leadIds.filter(Boolean))];
    if (!unique.length)
        return {};
    const clients = await DmsZohoClient.find({ lead_id: { $in: unique } })
        .select('lead_id full_name name profile_image_url')
        .lean();
    return Object.fromEntries(clients.map((c) => [
        c.lead_id,
        {
            name: c.name ?? c.full_name ?? c.lead_id,
            profile_image_url: c.profile_image_url ?? null,
        },
    ]));
}
async function createRequest(req, res) {
    try {
        const { requestType, leadId, recordType, fieldName, currentValue, requestedValue, reason, requestedTo } = req.body;
        if (!requestType || !leadId || !recordType || !fieldName || !requestedValue || !reason || !requestedTo) {
            res.status(400).json({ success: false, message: 'requestType, leadId, recordType, fieldName, requestedValue, reason, and requestedTo are required.' });
            return;
        }
        const user = getUser(req);
        if (!user?.username) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const targetUser = await ZohoDmsUser.findOne({ username: requestedTo, role: 'master_admin', account_status: 'active' }).lean();
        if (!targetUser) {
            res.status(400).json({ success: false, message: 'requestedTo must be a valid active master_admin username.' });
            return;
        }
        // Check for an existing record with the same lead + field + requestType
        const existing = await adminApprovalRequest_model_1.default.findOne({ leadId, fieldName, requestType }).lean();
        if (existing) {
            if (existing.status === 'pending') {
                res.status(409).json({ success: false, message: 'A pending request for this field already exists.' });
                return;
            }
            if (existing.status === 'rejected') {
                // Reset in-place so we don't create a duplicate record
                const updated = await adminApprovalRequest_model_1.default.findByIdAndUpdate(existing._id, {
                    $set: {
                        currentValue: currentValue ?? null,
                        requestedValue,
                        reason,
                        requestedTo,
                        requestedBy: user.username,
                        status: 'pending',
                        reviewedBy: null,
                        reviewedAt: null,
                        rejectionReason: null,
                    },
                }, { new: true });
                setImmediate(async () => {
                    const clientName = await getClientName(leadId);
                    addNotificationAndEmit({
                        req,
                        userId: targetUser._id,
                        title: 'Field Change Requested',
                        message: `${user.username} requested to change ${fieldName} for ${clientName}`,
                        type: 'info',
                        category: 'general',
                        source: 'general',
                        leadId,
                        sender_type: 'staff',
                        sender_id: user._id,
                    });
                    addActivityLog({
                        lead_id: leadId,
                        activity_type: 'field_change_requested',
                        summary: `${user.username} re-requested to change ${fieldName} to ${requestedValue}`,
                        actor_type: 'staff',
                        actor_name: user.username,
                        actor_role: user.role,
                        metadata: { fieldName, requestedValue, reason, requestedTo },
                    });
                });
                res.status(200).json({ success: true, data: updated });
                return;
            }
        }
        // No existing record (or existing is 'approved') — create fresh
        const newRequest = await adminApprovalRequest_model_1.default.create({
            requestType,
            leadId,
            recordType,
            fieldName,
            currentValue: currentValue ?? null,
            requestedValue,
            reason,
            requestedBy: user.username,
            requestedTo,
        });
        setImmediate(async () => {
            const clientName = await getClientName(leadId);
            addNotificationAndEmit({
                req,
                userId: targetUser._id,
                title: 'Field Change Requested',
                message: `${user.username} requested to change ${fieldName} for ${clientName}`,
                type: 'info',
                category: 'general',
                source: 'general',
                leadId,
                sender_type: 'staff',
                sender_id: user._id,
            });
            addActivityLog({
                lead_id: leadId,
                activity_type: 'field_change_requested',
                summary: `${user.username} requested to change ${fieldName} to ${requestedValue}`,
                actor_type: 'staff',
                actor_name: user.username,
                actor_role: user.role,
                metadata: { fieldName, requestedValue, reason, requestedTo },
            });
        });
        res.status(201).json({ success: true, data: newRequest });
    }
    catch (err) {
        console.error('[AdminApprovalRequest] createRequest error:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
async function getRequests(req, res) {
    try {
        const user = getUser(req);
        if (!user?.username) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const matchStage = { requestedTo: user.username };
        if (req.query.status)
            matchStage.status = req.query.status;
        if (req.query.leadId)
            matchStage.leadId = req.query.leadId;
        if (req.query.requestType)
            matchStage.requestType = req.query.requestType;
        const [results, total] = await Promise.all([
            adminApprovalRequest_model_1.default.aggregate([
                { $match: matchStage },
                {
                    $addFields: {
                        sortWeight: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$status', 'pending'] }, then: 0 },
                                    { case: { $eq: ['$status', 'approved'] }, then: 1 },
                                    { case: { $eq: ['$status', 'rejected'] }, then: 2 },
                                ],
                                default: 3,
                            },
                        },
                    },
                },
                { $sort: { sortWeight: 1, createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: { sortWeight: 0 } },
            ]),
            adminApprovalRequest_model_1.default.countDocuments(matchStage),
        ]);
        const [userInfoMap, clientInfoMap] = await Promise.all([
            getUserInfoMap(results.map((r) => r.requestedBy)),
            getClientInfoMap(results.map((r) => r.leadId)),
        ]);
        const enriched = results.map((r) => ({
            ...r,
            requesterInfo: userInfoMap[r.requestedBy] ?? null,
            client: clientInfoMap[r.leadId] ?? null,
        }));
        res.status(200).json({
            success: true,
            data: enriched,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        console.error('[AdminApprovalRequest] getRequests error:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
async function getRequestsByLead(req, res) {
    try {
        const { leadId } = req.params;
        const query = { leadId };
        if (req.query.status)
            query.status = req.query.status;
        if (req.query.requestType)
            query.requestType = req.query.requestType;
        const requests = await adminApprovalRequest_model_1.default.find(query).sort({ createdAt: -1 }).lean();
        const usernames = [
            ...requests.map((r) => r.requestedBy),
            ...requests.map((r) => r.requestedTo),
        ];
        const userInfoMap = await getUserInfoMap(usernames);
        const enriched = requests.map((r) => ({
            ...r,
            requesterInfo: userInfoMap[r.requestedBy] ?? null,
            reviewerInfo: userInfoMap[r.requestedTo] ?? null,
        }));
        res.status(200).json({ success: true, data: enriched });
    }
    catch (err) {
        console.error('[AdminApprovalRequest] getRequestsByLead error:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
async function approveRequest(req, res) {
    try {
        const user = getUser(req);
        const request = await adminApprovalRequest_model_1.default.findById(req.params.requestId);
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found.' });
            return;
        }
        if (request.status !== 'pending') {
            res.status(409).json({ success: false, message: `Request is already ${request.status}.` });
            return;
        }
        request.status = 'approved';
        request.reviewedBy = user.username;
        request.reviewedAt = new Date();
        await request.save();
        // Push to DmsZohoClient.deadline_extensions (atomic, no race condition)
        await DmsZohoClient.findOneAndUpdate({ lead_id: request.leadId }, {
            $push: {
                deadline_extensions: {
                    fieldName: request.fieldName,
                    previousValue: request.currentValue,
                    newValue: request.requestedValue,
                    reason: request.reason,
                    requestedBy: request.requestedBy,
                    approvedBy: user.username,
                    requestId: request._id,
                    approvedAt: new Date(),
                },
            },
        });
        // Update the live field on DmsZohoClient if a mapping exists
        const mongoField = ZOHO_TO_MONGO_FIELD[request.fieldName];
        if (mongoField) {
            await DmsZohoClient.findOneAndUpdate({ lead_id: request.leadId }, { $set: { [mongoField]: request.requestedValue } });
        }
        // Fire-and-forget: activity update + notification
        setImmediate(async () => {
            await updateRecentActivityInMongo(request.recordType, request.leadId);
            const [requester, clientName] = await Promise.all([
                ZohoDmsUser.findOne({ username: request.requestedBy }).select('_id').lean(),
                getClientName(request.leadId),
            ]);
            if (requester) {
                addNotificationAndEmit({
                    req,
                    userId: requester._id,
                    title: 'Field Change Approved',
                    message: `Your request to change ${request.fieldName} for ${clientName} was approved`,
                    type: 'success',
                    category: 'general',
                    source: 'general',
                    leadId: request.leadId,
                    sender_type: 'staff',
                    sender_id: user._id,
                });
            }
            addActivityLog({
                lead_id: request.leadId,
                activity_type: 'field_change_approved',
                summary: `${user.username} approved change of ${request.fieldName} to ${request.requestedValue}`,
                actor_type: 'staff',
                actor_name: user.username,
                actor_role: user.role,
                metadata: {
                    fieldName: request.fieldName,
                    newValue: request.requestedValue,
                    previousValue: request.currentValue,
                    requestedBy: request.requestedBy,
                },
            });
        });
        res.status(200).json({ success: true, data: request });
    }
    catch (err) {
        console.error('[AdminApprovalRequest] approveRequest error:', err?.response?.data ?? err?.message ?? err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
async function rejectRequest(req, res) {
    try {
        const user = getUser(req);
        const request = await adminApprovalRequest_model_1.default.findById(req.params.requestId);
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found.' });
            return;
        }
        if (request.status !== 'pending') {
            res.status(409).json({ success: false, message: `Request is already ${request.status}.` });
            return;
        }
        request.status = 'rejected';
        request.reviewedBy = user.username;
        request.reviewedAt = new Date();
        request.rejectionReason = req.body.rejectionReason ?? null;
        await request.save();
        setImmediate(async () => {
            const [requester, clientName] = await Promise.all([
                ZohoDmsUser.findOne({ username: request.requestedBy }).select('_id').lean(),
                getClientName(request.leadId),
            ]);
            if (requester) {
                const rejectionNote = request.rejectionReason ? ` Reason: ${request.rejectionReason}` : '';
                addNotificationAndEmit({
                    req,
                    userId: requester._id,
                    title: 'Field Change Rejected',
                    message: `Your request to change ${request.fieldName} for ${clientName} was rejected.${rejectionNote}`,
                    type: 'warning',
                    category: 'general',
                    source: 'general',
                    leadId: request.leadId,
                    sender_type: 'staff',
                    sender_id: user._id,
                });
            }
            addActivityLog({
                lead_id: request.leadId,
                activity_type: 'field_change_rejected',
                summary: `${user.username} rejected change of ${request.fieldName} requested by ${request.requestedBy}`,
                actor_type: 'staff',
                actor_name: user.username,
                actor_role: user.role,
                metadata: {
                    fieldName: request.fieldName,
                    requestedValue: request.requestedValue,
                    rejectionReason: request.rejectionReason,
                    requestedBy: request.requestedBy,
                },
            });
        });
        res.status(200).json({ success: true, data: request });
    }
    catch (err) {
        console.error('[AdminApprovalRequest] rejectRequest error:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
