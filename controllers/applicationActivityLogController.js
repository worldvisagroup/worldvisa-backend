'use strict';

const ApplicationActivityLog = require('../models/applicationActivityLog');
const logger = require('../utils/logger');

const VALID_ACTIVITY_TYPES = new Set([
  'application_created',
  'document_uploaded', 'document_reuploaded', 'document_status_changed',
  'comment_added', 'comment_edited', 'comment_deleted',
  'review_requested', 'review_status_updated', 'review_cancelled', 'review_message_added',
  'quality_check_requested', 'quality_check_removed',
  'checklist_created', 'checklist_updated', 'checklist_deleted',
  'note_added', 'note_updated', 'note_deleted',
  'email_sent', 'email_received',
]);


exports.getActivityLog = async (req, res) => {
  try {
    const lead_id = req.params.id;
    const page    = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit   = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip    = (page - 1) * limit;

    const filter = { lead_id };

    if (req.query.type) {
      const types = req.query.type
        .split(',')
        .map(t => t.trim())
        .filter(t => VALID_ACTIVITY_TYPES.has(t));

      if (types.length === 0) {
        return res.status(400).json({ status: 'fail', message: 'Invalid activity type(s) provided.' });
      }
      filter.activity_type = types.length === 1 ? types[0] : { $in: types };
    }

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
