'use strict';

const mongoose = require('mongoose');

const ACTIVITY_TYPES = [
  'application_created',
  'document_uploaded',
  'document_reuploaded',
  'document_status_changed',
  'comment_added',
  'comment_edited',
  'comment_deleted',
  'review_requested',
  'review_status_updated',
  'review_cancelled',
  'review_message_added',
  'quality_check_requested',
  'quality_check_removed',
  'checklist_created',
  'checklist_updated',
  'checklist_deleted',
  'note_added',
  'note_updated',
  'note_deleted',
  'email_sent',
  'email_received',
];

const applicationActivityLogSchema = new mongoose.Schema(
  {
    lead_id: {
      type: String,
      required: true,
      index: true,
    },
    activity_type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      maxlength: 300,
      trim: true,
    },
    actor_type: {
      type: String,
      enum: ['staff', 'client', 'system'],
      required: true,
    },
    actor_name: {
      type: String,
      required: true,
      trim: true,
    },
    actor_role: {
      type: String,
      default: null,
    },
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    document_name: {
      type: String,
      default: null,
    },
    // Stored top-level so frontend can show company name badge
    // e.g. "Wipro Limited Company Documents"
    document_category: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

applicationActivityLogSchema.index({ lead_id: 1, createdAt: -1 });
applicationActivityLogSchema.index({ lead_id: 1, activity_type: 1, createdAt: -1 });

const ApplicationActivityLog = mongoose.model(
  'ApplicationActivityLog',
  applicationActivityLogSchema
);

module.exports = ApplicationActivityLog;
