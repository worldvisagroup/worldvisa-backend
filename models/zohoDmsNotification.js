const mongoose = require('mongoose');

const zohoDmsNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ZohoDmsUser',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    default: "general"
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Optionally, you can add a link or reference to related data
  link: {
    type: String,
  },
  leadId: {
    type: String
  },
  documentId: {
    type: String
  },
  documentName: {
    type: String
  },
  applicationType: {
    type: String
  }
});

const ZohoDmsNotification = mongoose.model('ZohoDmsNotification', zohoDmsNotificationSchema);

module.exports = ZohoDmsNotification;
