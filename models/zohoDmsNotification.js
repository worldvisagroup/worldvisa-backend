const mongoose = require('mongoose');

const NOTIFICATION_SOURCES = ['document_review', 'requested_reviews', 'quality_check', 'requested_checklist', 'general'];

const zohoDmsNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ZohoDmsUser',
    required: true,
  },
  title: {
    type: String,
    maxlength: 120,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    default: 'general',
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info',
  },
  source: {
    type: String,
    enum: NOTIFICATION_SOURCES,
    default: 'general',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  link: {
    type: String,
  },
  leadId: {
    type: String,
  },
  documentId: {
    type: String,
  },
  documentName: {
    type: String,
  },
  applicationType: {
    type: String,
  },
});

zohoDmsNotificationSchema.index({ user: 1, createdAt: -1 });

const ZohoDmsNotification = mongoose.model('ZohoDmsNotification', zohoDmsNotificationSchema);

module.exports = ZohoDmsNotification;
