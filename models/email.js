const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    // Email provider ids
    provider: {
      type: String,
      enum: ['resend', 'gmail'],
      required: true,
    },
    provider_email_id: {
      type: String,
      default: null,
    },

    // RFC email headers
    message_id: {
      type: String,
      default: null,
    },
    in_reply_to: {
      type: String,
      default: null,
    },
    references: {
      type: [String],
      default: [],
    },

    // Threading
    thread_id: {
      type: String,
      default: null,
    },

    // Application relation
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DmsZohoClient',
      default: null,
    },

    // Direction
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },

    // Type
    email_type: {
      type: String,
      enum: ['system', 'agent', 'client'],
      required: true,
    },

    // Participants
    from: {
      type: String,
      required: true,
    },
    to: {
      type: [String],
      default: [],
    },
    cc: {
      type: [String],
      default: [],
    },
    bcc: {
      type: [String],
      default: [],
    },
    reply_to: {
      type: [String],
      default: [],
    },

    // Content
    subject: {
      type: String,
      default: '',
    },
    html: {
      type: String,
      default: null,
    },
    text: {
      type: String,
      default: null,
    },

    // Attachments
    attachments: {
      type: [
        {
          filename: { type: String, default: '' },
          content_type: { type: String, default: '' },
          size: { type: Number, default: 0 },
          storage_key: { type: String, default: '' },
          provider_attachment_id: { type: String, default: null },
          content_disposition: { type: String, default: null },
          content_id: { type: String, default: null },
        },
      ],
      default: [],
    },

    // Headers
    headers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Events
    last_event: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'opened', 'bounced', 'received', 'complained', 'clicked', 'delivery_delayed'],
      default: 'queued',
    },

    // Read state
    is_read: {
      type: Boolean,
      default: true, // existing docs without the field → treated as read
    },

    // Timestamps
    created_at: {
      type: Date,
      default: Date.now,
    },
    received_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  }
);

emailSchema.index({ client_id: 1, created_at: -1 });
emailSchema.index({ direction: 1, received_at: -1 });
emailSchema.index({ client_id: 1, direction: 1, received_at: -1 });
emailSchema.index({ thread_id: 1 });
emailSchema.index({ provider_email_id: 1 }, { sparse: true });
emailSchema.index({ provider: 1, provider_email_id: 1 }, { unique: true });

// ── Performance indexes for listEmails at 10k+ scale ──────────────────────
// Supports the always-applied { html: { $ne: null } } filter.
// Sparse: documents with html:null do not consume index space.
emailSchema.index({ html: 1 }, { sparse: true });
// Supports ?unread=true filter and the unread-count aggregation pipeline.
emailSchema.index({ is_read: 1 });
// Supports email_type equality filter combined with received_at sort.
emailSchema.index({ email_type: 1, received_at: -1 });
// Covers the common "inbound unread sorted by time" query in one index scan.
emailSchema.index({ direction: 1, is_read: 1, received_at: -1 });

module.exports = mongoose.model('Email', emailSchema);
