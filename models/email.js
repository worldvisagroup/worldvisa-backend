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
          storage_url: { type: String, default: '' },
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
      enum: ['queued', 'sent', 'delivered', 'opened', 'bounced'],
      default: 'queued',
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
emailSchema.index({ thread_id: 1 });
emailSchema.index({ provider_email_id: 1 }, { sparse: true });
emailSchema.index({ provider: 1, provider_email_id: 1 }, { unique: true });

module.exports = mongoose.model('Email', emailSchema);
