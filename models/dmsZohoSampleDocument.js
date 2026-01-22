const mongoose = require('mongoose');

const dmsZohoSampleDocumentSchema = new mongoose.Schema({
  document_name: {
    type: String,
    required: true
  },
  zoho_workdrive_id: {
    type: String,
    required: true
  },
  zoho_parent_id: {
    type: String,
    required: true
  },
  download_url: {
    type: String,
  },
  document_link: {
    type: String,
  },
  lead_id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DmsZohoSampleDocument', dmsZohoSampleDocumentSchema);
