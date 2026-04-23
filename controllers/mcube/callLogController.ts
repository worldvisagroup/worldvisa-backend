import { Request, Response } from 'express';
import mongoose from 'mongoose';
import type { CallLogListQuery, DateRangePreset } from '../../types/callLog.types';

const CallLog = require('../../models/callLog');
const logger  = require('../../utils/logger');
const { escapeRegexForMongo, sanitizeSearchTerm } = require('../../utils/querySanitizer');

// ── Roles that may view all agents' call logs ──────────────────────────────
const PRIVILEGED_ROLES = new Set(['master_admin', 'supervisor', 'team_leader']);

// ── Date range helpers ─────────────────────────────────────────────────────

function buildDateFilter(
  dateRange?: DateRangePreset,
  startDate?: string,
  endDate?: string,
): Record<string, unknown> {
  if (dateRange) {
    const now  = new Date();
    const msOf = {
      last_24h:  24 * 60 * 60 * 1000,
      last_7d:   7  * 24 * 60 * 60 * 1000,
      last_30d:  30 * 24 * 60 * 60 * 1000,
      last_90d:  90 * 24 * 60 * 60 * 1000,
    } as const;
    return { created_at: { $gte: new Date(now.getTime() - msOf[dateRange]) } };
  }

  if (startDate || endDate) {
    const filter: Record<string, Date> = {};
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) filter.$gte = d;
    }
    if (endDate) {
      const d = new Date(endDate);
      // Include the whole end day
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        filter.$lte = d;
      }
    }
    return Object.keys(filter).length ? { created_at: filter } : {};
  }

  return {};
}

// ── List ───────────────────────────────────────────────────────────────────

export async function listCallLogs(req: Request, res: Response): Promise<void> {
  try {
    const {
      q,
      status,
      direction,
      dateRange,
      startDate,
      endDate,
      page:  rawPage  = 1,
      limit: rawLimit = 20,
    } = req.query as unknown as CallLogListQuery;

    // ── Pagination ──────────────────────────────────────────────────────────
    const page  = Math.max(1, Number(rawPage)  || 1);
    const limit = Math.min(100, Math.max(1, Number(rawLimit) || 20));
    const skip  = (page - 1) * limit;

    // ── Base match ──────────────────────────────────────────────────────────
    const matchStage: Record<string, unknown> = {};

    // Role-based access: admin → own logs only
    const userRole = (req as any).user?.role as string | undefined;
    if (!PRIVILEGED_ROLES.has(userRole ?? '')) {
      const userId = (req as any).user?._id;
      if (!userId) {
        res.status(403).json({ status: 'fail', message: 'Access denied' });
        return;
      }
      matchStage.agent_id = new mongoose.Types.ObjectId(String(userId));
    }

    // Status filter
    const VALID_STATUSES = new Set(['initiated', 'answered', 'completed', 'missed', 'busy', 'cancelled']);
    if (status && VALID_STATUSES.has(status)) {
      matchStage.status = status;
    }

    // Direction filter
    if (direction === 'inbound' || direction === 'outbound') {
      matchStage.direction = direction;
    }

    // Date filter
    const dateFilter = buildDateFilter(
      dateRange as DateRangePreset | undefined,
      startDate as string | undefined,
      endDate   as string | undefined,
    );
    Object.assign(matchStage, dateFilter);

    // Search filter — regex across phone numbers, agent name, client name
    if (q) {
      const safeQ = sanitizeSearchTerm(String(q), 100);
      if (!safeQ) {
        res.status(400).json({ status: 'fail', message: 'q must be non-empty and up to 100 characters' });
        return;
      }
      const regex = new RegExp(escapeRegexForMongo(safeQ), 'i');
      matchStage.$or = [
        { customer_phone: regex },
        { agent_phone:    regex },
        { agent_name:     regex },
        { client_name:    regex },
        { call_id:        regex },
      ];
    }

    // ── Aggregation ─────────────────────────────────────────────────────────
    const [result] = await CallLog.aggregate([
      { $match: matchStage },
      {
        $facet: {
          data: [
            { $sort: { created_at: -1 } },
            { $skip:  skip },
            { $limit: limit },
            // Lightweight populate — only fields needed for list row
            {
              $lookup: {
                from:         'zohodmsusers',
                localField:   'agent_id',
                foreignField: '_id',
                pipeline:     [{ $project: { name: 1, email: 1, agent_number: 1 } }],
                as:           '_agent',
              },
            },
            {
              $addFields: {
                agent: { $arrayElemAt: ['$_agent', 0] },
              },
            },
            { $project: { _agent: 0, metadata: 0 } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const callLogs   = result?.data       ?? [];
    const total      = result?.totalCount?.[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      status:  'success',
      results: callLogs.length,
      pagination: {
        currentPage:  page,
        totalPages,
        totalRecords: total,
        limit,
      },
      data: { callLogs },
    });
  } catch (err: any) {
    logger.error('[CallLog] listCallLogs failed', { error: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to fetch call logs' });
  }
}

// ── Detail ─────────────────────────────────────────────────────────────────

export async function getCallLogDetail(req: Request, res: Response): Promise<void> {
  try {
    const { callId } = req.params;

    if (!callId) {
      res.status(400).json({ status: 'fail', message: 'callId param is required' });
      return;
    }

    const callLog = await CallLog
      .findOne({ call_id: callId })
      .populate('agent_id',  'name email agent_number')
      .populate('client_id', 'Name Email Phone lead_id')
      .lean();

    if (!callLog) {
      res.status(404).json({ status: 'fail', message: 'Call log not found' });
      return;
    }

    // Role guard: admin can only view their own call logs
    const userRole = (req as any).user?.role as string | undefined;
    if (!PRIVILEGED_ROLES.has(userRole ?? '')) {
      const userId = String((req as any).user?._id);
      const logAgentId = callLog.agent_id
        ? String((callLog.agent_id as any)?._id ?? callLog.agent_id)
        : null;

      if (!logAgentId || logAgentId !== userId) {
        res.status(403).json({ status: 'fail', message: 'Access denied' });
        return;
      }
    }

    res.status(200).json({
      status: 'success',
      data:   { callLog },
    });
  } catch (err: any) {
    logger.error('[CallLog] getCallLogDetail failed', { error: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to fetch call log' });
  }
}

// ── Update call notes (agent disposition after hangup) ─────────────────────

export async function updateCallNotes(req: Request, res: Response): Promise<void> {
  try {
    const { callId } = req.params;

    if (!callId) {
      res.status(400).json({ status: 'fail', message: 'callId param is required' });
      return;
    }

    const { call_note, call_agent_status } = req.body as {
      call_note?:         string | null;
      call_agent_status?: string | null;
    };

    const updateFields: Record<string, unknown> = { updated_at: new Date() };
    if (call_note         !== undefined) updateFields.call_note         = call_note;
    if (call_agent_status !== undefined) updateFields.call_agent_status = call_agent_status;

    // Role guard: non-privileged users may only update their own call logs
    const userRole = (req as any).user?.role as string | undefined;
    const userId   = String((req as any).user?._id);

    const filter: Record<string, unknown> = { call_id: callId };
    if (!PRIVILEGED_ROLES.has(userRole ?? '')) {
      filter.agent_id = new mongoose.Types.ObjectId(userId);
    }

    const callLog = await CallLog.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true },
    );

    if (!callLog) {
      res.status(404).json({ status: 'fail', message: 'Call log not found or access denied' });
      return;
    }

    res.status(200).json({ status: 'success', data: { callLog } });
  } catch (err: any) {
    logger.error('[CallLog] updateCallNotes failed', { error: err.message });
    res.status(500).json({ status: 'error', message: 'Failed to update call notes' });
  }
}
