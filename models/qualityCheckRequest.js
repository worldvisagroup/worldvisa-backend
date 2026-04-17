const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message:  { type: String, required: true },
  added_at: { type: Date, default: Date.now },
});

const qualityCheckRequestSchema = new mongoose.Schema({
  leadId:       { type: String, required: true },
  recordType:   { type: String, required: true },
  requested_by: { type: String, required: true },
  requested_to: { type: String, required: true },
  status:       { type: String, default: 'pending' }, // 'pending' | 'reviewed'
  requested_at: { type: Date, default: Date.now },
  messages:     [messageSchema],
  migrated:     { type: Boolean, default: false }, // true = seeded from Zoho migration script
}, { timestamps: true });

qualityCheckRequestSchema.index({ leadId: 1 });
qualityCheckRequestSchema.index({ requested_to: 1 });
qualityCheckRequestSchema.index({ requested_by: 1 });
qualityCheckRequestSchema.index({ requested_to: 1, status: 1 });
qualityCheckRequestSchema.index({ requested_by: 1, status: 1 });
qualityCheckRequestSchema.index({ status: 1, recordType: 1, requested_at: -1 });

module.exports = mongoose.model('QualityCheckRequest', qualityCheckRequestSchema);
