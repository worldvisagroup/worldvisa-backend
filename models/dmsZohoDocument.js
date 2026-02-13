const mongoose = require('mongoose');

const dmsZohoDocumentSchema = new mongoose.Schema({
  record_id: {
    type: String,
    required: true,
  },
  workdrive_file_id: {
    type: String,
    required: true,
  },
  workdrive_parent_id: {
    type: String,
    required: true,
  },
  file_name: String,
  document_name: String, // Added document name
  document_type: String,
  document_category: { // Added document category
    type: String,
  },
  uploaded_by: String,
  uploaded_at: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'request_review', 'approved', 'rejected'],
    default: 'pending',
  },
  comments: [
    {
      comment: String,
      added_by: String,
      added_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  history: [
    {
      status: String,
      changed_by: String,
      changed_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  requested_reviews: [
    {
      requested_by: {
        type: String,
        required: true,
      },
      requested_to: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
      requested_at: {
        type: Date,
        default: Date.now,
      },
      messages: [
        {
          username: {
            type: String,
            required: true,
          },
          message: {
            type: String,
            required: true,
          },
          added_at: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
  reject_message: {
    type: String,
  },
  download_url: String,
  document_link: String,
  description: String,
  timeline: [
    {
      event: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      details: {
        type: String,
      },
      triggered_by: String
    }
  ],
  moved_files: [
    {
      file_name: String,
      file_id: String,
      moved_at: {
        type: Date,
        default: Date.now,
      },
      moved_by: String
    }
  ]
});

// Indexes for frequently queried fields
// Index on record_id - used in almost every query
dmsZohoDocumentSchema.index({ record_id: 1 });

// Indexes for requested_reviews queries
dmsZohoDocumentSchema.index({ 'requested_reviews.requested_to': 1 });
dmsZohoDocumentSchema.index({ 'requested_reviews.requested_by': 1 });

// Index on status - used in listDocuments and filtering
dmsZohoDocumentSchema.index({ status: 1 });

// Text index for document_name and document_category search
dmsZohoDocumentSchema.index({ document_name: 'text', document_category: 'text' });

// Compound index for common query pattern: record_id + status
dmsZohoDocumentSchema.index({ record_id: 1, status: 1 });

// Compound index for review queries with status filtering
dmsZohoDocumentSchema.index({ 'requested_reviews.requested_to': 1, 'requested_reviews.status': 1 });
dmsZohoDocumentSchema.index({ 'requested_reviews.requested_by': 1, 'requested_reviews.status': 1 });

const dmsZohoDocument = mongoose.model('dmsZohoDocument', dmsZohoDocumentSchema);

module.exports = dmsZohoDocument;
