'use strict';

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      required: true,
    },

    path: {
      type: String,
      required: true,
    },

    status_code: {
      type: Number,
      default: null,
    },

    duration_ms: {
      type: Number,
      default: null,
    },

    /** Resolved from req.user after auth middleware */
    user_id: {
      type: String,
      default: null,
    },

    user_role: {
      type: String,
      default: null,
    },

    /** clerk_id or internal _id string */
    clerk_id: {
      type: String,
      default: null,
    },

    ip: {
      type: String,
      default: null,
    },

    user_agent: {
      type: String,
      default: null,
    },

    /** Sanitized request body — passwords/tokens stripped */
    request_body: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    /** Error message if request resulted in 4xx/5xx */
    error: {
      type: String,
      default: null,
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
auditLogSchema.index({ created_at: -1 });
auditLogSchema.index({ user_id: 1, created_at: -1 });
auditLogSchema.index({ path: 1, created_at: -1 });
auditLogSchema.index({ status_code: 1, created_at: -1 });

// Auto-delete logs older than 90 days
auditLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
