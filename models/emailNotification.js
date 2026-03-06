const mongoose = require('mongoose');

const emailNotificationSchema = new mongoose.Schema(
  {
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    recipientName: {
      type: String,
      default: '',
    },
    recipientRole: {
      type: String,
      enum: ['client', 'admin', 'team_leader', 'supervisor', 'master_admin'],
      required: true,
    },

    notificationType: {
      type: String,
      enum: [
        'document_rejected',    // immediate → client
        'checklist_created',    // immediate → client
        'document_approved',    // batched 60min → client
        'document_reviewed',    // batched 60min → client
        'comment_to_client',    // batched 60min → client
        'document_upload',      // batched 60min → admin/lead owner
        'document_reupload',    // batched 60min → admin/lead owner
        'checklist_requested',  // batched 60min → admin/lead owner
        'comment_by_client',    // batched 60min → admin/lead owner
        'review_requested',     // batched 30min → supervisor/master_admin
      ],
      required: true,
    },

    // Lead/application grouping key
    entityParentId: { type: String, default: 'system' },
    // Document-level reference
    entityId: { type: String, default: null },
    entityName: { type: String, default: '' },

    sendImmediately: { type: Boolean, default: false },
    scheduledFor: { type: Date, required: true },

    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed'],
      default: 'pending',
    },
    sentAt: { type: Date, default: null },

    batchId: { type: String, default: null },
    batchedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmailNotification' }],

    subject: { type: String, default: '' },
    message: { type: String, default: '' },
    templateData: { type: mongoose.Schema.Types.Mixed, default: {} },

    resendId: { type: String, default: null },

    error: {
      message: { type: String, default: null },
      retryCount: { type: Number, default: 0 },
      lastRetryAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// For cron aggregator: find pending batched records due for sending
emailNotificationSchema.index({ status: 1, scheduledFor: 1 });

// For batch grouping: find records for same recipient+type+lead
emailNotificationSchema.index({ recipientEmail: 1, notificationType: 1, entityParentId: 1, status: 1 });

// For immediate send queue lookup
emailNotificationSchema.index({ sendImmediately: 1, status: 1 });

// TTL: auto-delete sent records after 30 days
emailNotificationSchema.index({ sentAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, sparse: true });

// TTL: auto-delete failed records after 30 days
emailNotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { status: 'failed' } }
);

module.exports = mongoose.model('EmailNotification', emailNotificationSchema);
