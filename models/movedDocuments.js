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
  },
  move_kind: {
    type: String,
    enum: ['full_move', 'reupload_archive'],
  },
});

// At most one "full" move per document_id; re-upload archives may share the same document_id with move_kind reupload_archive.
movedDocumentSchema.index(
  { document_id: 1 },
  { unique: true, partialFilterExpression: { move_kind: 'full_move' } }
);

module.exports = mongoose.model('MovedDocument', movedDocumentSchema);
