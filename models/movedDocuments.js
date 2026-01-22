const mongoose = require('mongoose');

const movedDocumentSchema = new mongoose.Schema({
  document_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'dmsZohoDocument'
  },
  record_id: { // Added lead_id
    type: String,
    required: true
  },
  file_name: {
    type: String,
    required: true
  },
  file_id: {
    type: String,
    required: true
  },
  moved_at: {
    type: Date,
    default: Date.now
  },
  moved_by: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('MovedDocument', movedDocumentSchema);
