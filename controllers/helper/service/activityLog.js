'use strict';

const logger = require('../../../utils/logger');

/**
 * Append one entry to the application-level activity log.
 * Fire-and-forget — never blocks the HTTP response, never throws to the caller.
 *
 * @param {Object} params
 * @param {string}  params.lead_id        - Zoho lead_id / record_id
 * @param {string}  params.activity_type  - One of the ACTIVITY_TYPES enum values
 * @param {string}  params.summary        - Human-readable one-liner (<= 300 chars)
 * @param {'staff'|'client'|'system'} params.actor_type
 * @param {string}  params.actor_name     - Display name or username
 * @param {string}  [params.actor_role]   - Staff role (optional)
 * @param {string|import('mongoose').Types.ObjectId} [params.document_id]
 * @param {string}  [params.document_name]
 * @param {Object}  [params.metadata]     - Flat key/value extra context (optional)
 */
function addActivityLog(params) {
  if (!params?.lead_id || !params?.activity_type || !params?.summary) {
    logger.warn('[ActivityLog] Skipped — missing required fields', { params });
    return;
  }

  setImmediate(async () => {
    try {
      const ApplicationActivityLog = require('../../../models/applicationActivityLog');
      await ApplicationActivityLog.create({
        lead_id:       params.lead_id,
        activity_type: params.activity_type,
        summary:       params.summary.slice(0, 300),
        actor_type:    params.actor_type  ?? 'system',
        actor_name:    params.actor_name  ?? 'Unknown',
        actor_role:    params.actor_role  ?? null,
        document_id:   params.document_id   ?? null,
        document_name: params.document_name ?? null,
        metadata:      params.metadata      ?? null,
      });
    } catch (err) {
      logger.error('[ActivityLog] Failed to write log entry', {
        error:   err.message,
        lead_id: params.lead_id,
        type:    params.activity_type,
      });
    }
  });
}

module.exports = { addActivityLog };
