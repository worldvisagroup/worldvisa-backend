'use strict';

const ApplicationActivityLog = require('../models/applicationActivityLog');
const logger = require('../utils/logger');

/**
 * GET /api/zoho_dms/visa_applications/:id/activity
 *
 * Query params:
 *   page   (default 1)
 *   limit  (default 20, max 50)
 *   type   (optional) — filter by activity_type
 */
exports.getActivityLog = async (req, res) => {
  try {
    const lead_id = req.params.id;
    const page    = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit   = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip    = (page - 1) * limit;
    const { type } = req.query;

    const filter = { lead_id };
    if (type) filter.activity_type = type;

    const [logs, total] = await Promise.all([
      ApplicationActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ApplicationActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          currentPage:  page,
          totalPages:   Math.ceil(total / limit),
          totalRecords: total,
          limit,
        },
      },
    });
  } catch (err) {
    logger.error('[ActivityLog] getActivityLog failed', {
      error:   err.message,
      lead_id: req.params.id,
    });
    return res.status(500).json({ status: 'error', message: 'Failed to fetch activity log.' });
  }
};
