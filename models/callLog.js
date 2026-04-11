'use strict';

const mongoose = require('mongoose');

const CALL_STATUSES = ['initiated', 'answered', 'completed', 'missed', 'busy', 'cancelled'];

const callLogSchema = new mongoose.Schema(
  {
    /** MCube unique call ID — used as idempotency key */
    call_id: {
      type: String,
      required: true,
      unique: true,
    },

    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },

    status: {
      type: String,
      enum: CALL_STATUSES,
      default: 'initiated',
    },

    /** Raw MCube dialstatus value for reference */
    dial_status: {
      type: String,
      default: '',
    },

    agent_phone: {
      type: String,
      required: true,
    },

    agent_name: {
      type: String,
      default: '',
    },

    /** Resolved ZohoDmsUser — linked via agent_number match */
    agent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ZohoDmsUser',
      default: null,
    },

    /** Customer (caller/callee) phone number */
    customer_phone: {
      type: String,
      required: true,
    },

    /** Resolved DmsZohoClient — matched by customer_phone. Null if number is unknown. */
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DmsZohoClient',
      default: null,
    },

    /** Zoho lead_id of the matched client — for quick lookup without populate */
    client_lead_id: {
      type: String,
      default: null,
    },

    /** Denormalized client display name — avoids $lookup on search queries */
    client_name: {
      type: String,
      default: null,
    },

    /** MCube DID number that received the call */
    mcube_did: {
      type: String,
      default: '',
    },

    group_name: {
      type: String,
      default: '',
    },

    start_time: {
      type: Date,
      required: true,
    },

    end_time: {
      type: Date,
      default: null,
    },

    /** Raw duration string from MCube — "HH:MM:SS" */
    answered_duration: {
      type: String,
      default: null,
    },

    disconnected_by: {
      type: String,
      enum: ['Customer', 'Agent', null],
      default: null,
    },

    /** AWS S3 recording URL delivered on hangup */
    recording_url: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    created_at: {
      type: Date,
      default: Date.now,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
callLogSchema.index({ customer_phone: 1, created_at: -1 });
callLogSchema.index({ agent_phone: 1, created_at: -1 });
callLogSchema.index({ agent_id: 1, created_at: -1 });
callLogSchema.index({ status: 1, created_at: -1 });
callLogSchema.index({ direction: 1, created_at: -1 });
callLogSchema.index({ created_at: -1 });

// Full-text search index across searchable fields
callLogSchema.index(
  { customer_phone: 'text', agent_phone: 'text', agent_name: 'text', client_name: 'text' },
  { name: 'call_log_text_search' }
);

module.exports = mongoose.model('CallLog', callLogSchema);
