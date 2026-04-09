import type { Request, Response } from 'express';
import AdminApprovalRequest from '../models/adminApprovalRequest.model';

const DmsZohoClient          = require('../models/dmsZohoClient');
const ZohoDmsUser             = require('../models/zohoDmsUser');
const { zohoRequest }         = require('./zohoDms/zohoApi');
const { updateRecentActivity } = require('./helper/service/functions');
const { addNotificationAndEmit } = require('./helper/service/notifications');
const { addActivityLog }      = require('./helper/service/activityLog');
const {
  MODULE_VISA_APPLICATION,
  MODULE_SPOUSE_SKILL_ASSESSMENT,
  REQ_MODULE_SPOUSE_SKILL_ASSESSMENT,
} = require('./helper/constants');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveModule(recordType: string): string {
  return recordType === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT
    ? MODULE_SPOUSE_SKILL_ASSESSMENT
    : MODULE_VISA_APPLICATION;
}

function getUser(req: Request) {
  return req.user as any;
}

/** Single batch lookup — avoids N+1 when enriching lists */
async function getUserInfoMap(
  usernames: string[]
): Promise<Record<string, { username: string; full_name: string | null; profile_image_url: string | null }>> {
  const unique = [...new Set(usernames.filter(Boolean))];
  if (!unique.length) return {};
  const users = await ZohoDmsUser.find({ username: { $in: unique } })
    .select('username full_name profile_image_url')
    .lean();
  return Object.fromEntries((users as any[]).map((u) => [u.username, u]));
}

/** Returns client display name from DmsZohoClient — falls back to leadId */
async function getClientName(leadId: string): Promise<string> {
  const client = await DmsZohoClient.findOne({ lead_id: leadId })
    .select('name full_name')
    .lean();
  return (client as any)?.name ?? (client as any)?.full_name ?? leadId;
}

/** Single batch lookup — avoids N+1 when enriching lists */
async function getClientInfoMap(
  leadIds: string[]
): Promise<Record<string, { name: string; profile_image_url: string | null }>> {
  const unique = [...new Set(leadIds.filter(Boolean))];
  if (!unique.length) return {};
  const clients = await DmsZohoClient.find({ lead_id: { $in: unique } })
    .select('lead_id full_name name profile_image_url')
    .lean();

  return Object.fromEntries(
    (clients as any[]).map((c) => [
      c.lead_id,
      {
        name: c.name ?? c.full_name ?? c.lead_id,
        profile_image_url: c.profile_image_url ?? null,
      },
    ])
  );
}

export async function createRequest(req: Request, res: Response): Promise<void> {
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

    // Validate requestedTo is a real active master_admin
    const targetUser = await ZohoDmsUser.findOne({ username: requestedTo, role: 'master_admin', account_status: 'active' }).lean();
    if (!targetUser) {
      res.status(400).json({ success: false, message: 'requestedTo must be a valid active master_admin username.' });
      return;
    }

    // Check for an existing record with the same lead + field + requestType
    const existing = await AdminApprovalRequest.findOne({ leadId, fieldName, requestType }).lean();

    if (existing) {
      if (existing.status === 'pending') {
        res.status(409).json({ success: false, message: 'A pending request for this field already exists.' });
        return;
      }

      if (existing.status === 'rejected') {
        // Reset in-place so we don't create a duplicate record
        const updated = await AdminApprovalRequest.findByIdAndUpdate(
          existing._id,
          {
            $set: {
              currentValue:    currentValue ?? null,
              requestedValue,
              reason,
              requestedTo,
              requestedBy:     user.username,
              status:          'pending',
              reviewedBy:      null,
              reviewedAt:      null,
              rejectionReason: null,
            },
          },
          { new: true }
        );

        setImmediate(async () => {
          const clientName = await getClientName(leadId);
          addNotificationAndEmit({
            req,
            userId:      (targetUser as any)._id,
            title:       'Field Change Requested',
            message:     `${user.username} requested to change ${fieldName} for ${clientName}`,
            type:        'info',
            category:    'general',
            source:      'general',
            leadId,
            sender_type: 'staff',
            sender_id:   user._id,
          });
          addActivityLog({
            lead_id:      leadId,
            activity_type: 'field_change_requested',
            summary:      `${user.username} re-requested to change ${fieldName} to ${requestedValue}`,
            actor_type:   'staff',
            actor_name:   user.username,
            actor_role:   user.role,
            metadata:     { fieldName, requestedValue, reason, requestedTo },
          });
        });

        res.status(200).json({ success: true, data: updated });
        return;
      }
    }

    // No existing record (or existing is 'approved') — create fresh
    const newRequest = await AdminApprovalRequest.create({
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
        userId:      (targetUser as any)._id,
        title:       'Field Change Requested',
        message:     `${user.username} requested to change ${fieldName} for ${clientName}`,
        type:        'info',
        category:    'general',
        source:      'general',
        leadId,
        sender_type: 'staff',
        sender_id:   user._id,
      });
      addActivityLog({
        lead_id:      leadId,
        activity_type: 'field_change_requested',
        summary:      `${user.username} requested to change ${fieldName} to ${requestedValue}`,
        actor_type:   'staff',
        actor_name:   user.username,
        actor_role:   user.role,
        metadata:     { fieldName, requestedValue, reason, requestedTo },
      });
    });

    res.status(201).json({ success: true, data: newRequest });
  } catch (err: any) {
    console.error('[AdminApprovalRequest] createRequest error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}


export async function getRequests(req: Request, res: Response): Promise<void> {
  try {
    const user  = getUser(req);
    if (!user?.username) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip  = (page - 1) * limit;

    const matchStage: Record<string, any> = { requestedTo: user.username };
    if (req.query.status)      matchStage.status      = req.query.status;
    if (req.query.leadId)      matchStage.leadId       = req.query.leadId;
    if (req.query.requestType) matchStage.requestType  = req.query.requestType;

    const [results, total] = await Promise.all([
      AdminApprovalRequest.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            sortWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 'pending'] },  then: 0 },
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
      AdminApprovalRequest.countDocuments(matchStage),
    ]);

    const [userInfoMap, clientInfoMap] = await Promise.all([
      getUserInfoMap(results.map((r: any) => r.requestedBy)),
      getClientInfoMap(results.map((r: any) => r.leadId)),
    ]);
    const enriched = results.map((r: any) => ({
      ...r,
      requesterInfo: userInfoMap[r.requestedBy] ?? null,
      client: clientInfoMap[r.leadId] ?? null,
    }));

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error('[AdminApprovalRequest] getRequests error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * GET /admin-approval-requests/lead/:leadId
 * Any staff — returns all requests for a given lead with profile enrichment.
 */
export async function getRequestsByLead(req: Request, res: Response): Promise<void> {
  try {
    const { leadId } = req.params;
    const query: Record<string, any> = { leadId };
    if (req.query.status)      query.status      = req.query.status;
    if (req.query.requestType) query.requestType  = req.query.requestType;

    const requests = await AdminApprovalRequest.find(query).sort({ createdAt: -1 }).lean();

    const usernames = [
      ...requests.map((r: any) => r.requestedBy),
      ...requests.map((r: any) => r.requestedTo),
    ];
    const userInfoMap = await getUserInfoMap(usernames);

    const enriched = (requests as any[]).map((r) => ({
      ...r,
      requesterInfo: userInfoMap[r.requestedBy] ?? null,
      reviewerInfo:  userInfoMap[r.requestedTo] ?? null,
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (err: any) {
    console.error('[AdminApprovalRequest] getRequestsByLead error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * PATCH /admin-approval-requests/:requestId/approve
 * master_admin only — pushes the change to Zoho, then marks approved.
 */
export async function approveRequest(req: Request, res: Response): Promise<void> {
  try {
    const user    = getUser(req);
    const request = await AdminApprovalRequest.findById(req.params.requestId);

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found.' });
      return;
    }
    if (request.status !== 'pending') {
      res.status(409).json({ success: false, message: `Request is already ${request.status}.` });
      return;
    }

    // Push to Zoho first — only mark approved on success
    const moduleName = resolveModule(request.recordType as string);
    const zohoRes = await zohoRequest(moduleName, 'PUT', {
      data: [{ id: request.leadId, [request.fieldName as string]: request.requestedValue }],
    });

    if (!zohoRes?.data) {
      res.status(502).json({ success: false, message: 'Failed to update field in Zoho. Request not approved.' });
      return;
    }

    request.status     = 'approved';
    request.reviewedBy = user.username;
    request.reviewedAt = new Date();
    await request.save();

    // Push to DmsZohoClient.deadline_extensions (atomic, no race condition)
    await DmsZohoClient.findOneAndUpdate(
      { lead_id: request.leadId },
      {
        $push: {
          deadline_extensions: {
            fieldName:     request.fieldName,
            previousValue: request.currentValue,
            newValue:      request.requestedValue,
            reason:        request.reason,
            requestedBy:   request.requestedBy,
            approvedBy:    user.username,
            requestId:     request._id,
            approvedAt:    new Date(),
          },
        },
      }
    );

    // Fire-and-forget: activity update + notification
    setImmediate(async () => {
      await updateRecentActivity(zohoRequest, moduleName, request.leadId);

      const [requester, clientName] = await Promise.all([
        ZohoDmsUser.findOne({ username: request.requestedBy }).select('_id').lean(),
        getClientName(request.leadId as string),
      ]);

      if (requester) {
        addNotificationAndEmit({
          req,
          userId:      (requester as any)._id,
          title:       'Field Change Approved',
          message:     `Your request to change ${request.fieldName} for ${clientName} was approved`,
          type:        'success',
          category:    'general',
          source:      'general',
          leadId:      request.leadId,
          sender_type: 'staff',
          sender_id:   user._id,
        });
      }

      addActivityLog({
        lead_id:      request.leadId,
        activity_type: 'field_change_approved',
        summary:      `${user.username} approved change of ${request.fieldName} to ${request.requestedValue}`,
        actor_type:   'staff',
        actor_name:   user.username,
        actor_role:   user.role,
        metadata:     {
          fieldName:      request.fieldName,
          newValue:       request.requestedValue,
          previousValue:  request.currentValue,
          requestedBy:    request.requestedBy,
        },
      });
    });

    res.status(200).json({ success: true, data: request });
  } catch (err: any) {
    console.error('[AdminApprovalRequest] approveRequest error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * PATCH /admin-approval-requests/:requestId/reject
 * master_admin only — rejects the request with an optional reason.
 */
export async function rejectRequest(req: Request, res: Response): Promise<void> {
  try {
    const user    = getUser(req);
    const request = await AdminApprovalRequest.findById(req.params.requestId);

    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found.' });
      return;
    }
    if (request.status !== 'pending') {
      res.status(409).json({ success: false, message: `Request is already ${request.status}.` });
      return;
    }

    request.status          = 'rejected';
    request.reviewedBy      = user.username;
    request.reviewedAt      = new Date();
    request.rejectionReason = req.body.rejectionReason ?? null;
    await request.save();

    setImmediate(async () => {
      const [requester, clientName] = await Promise.all([
        ZohoDmsUser.findOne({ username: request.requestedBy }).select('_id').lean(),
        getClientName(request.leadId as string),
      ]);

      if (requester) {
        const rejectionNote = request.rejectionReason ? ` Reason: ${request.rejectionReason}` : '';
        addNotificationAndEmit({
          req,
          userId:      (requester as any)._id,
          title:       'Field Change Rejected',
          message:     `Your request to change ${request.fieldName} for ${clientName} was rejected.${rejectionNote}`,
          type:        'warning',
          category:    'general',
          source:      'general',
          leadId:      request.leadId,
          sender_type: 'staff',
          sender_id:   user._id,
        });
      }

      addActivityLog({
        lead_id:      request.leadId,
        activity_type: 'field_change_rejected',
        summary:      `${user.username} rejected change of ${request.fieldName} requested by ${request.requestedBy}`,
        actor_type:   'staff',
        actor_name:   user.username,
        actor_role:   user.role,
        metadata:     {
          fieldName:       request.fieldName,
          requestedValue:  request.requestedValue,
          rejectionReason: request.rejectionReason,
          requestedBy:     request.requestedBy,
        },
      });
    });

    res.status(200).json({ success: true, data: request });
  } catch (err: any) {
    console.error('[AdminApprovalRequest] rejectRequest error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
