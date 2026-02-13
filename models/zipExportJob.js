const mongoose = require('mongoose');

const zipExportJobSchema = new mongoose.Schema({
  record_id: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
    default: 'pending',
    index: true,
  },
  progress: {
    current: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  r2_key: String,        // R2 object key
  download_url: String,  // Public R2 URL
  error_message: String,
  requested_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ZohoDmsUser',
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  completed_at: Date,
  expires_at: {
    type: Date,
  },
}, { timestamps: true });

// Auto-delete expired jobs
zipExportJobSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ZipExportJob', zipExportJobSchema);
