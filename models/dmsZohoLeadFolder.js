const mongoose = require('mongoose');

const dmsZohoLeadFolderSchema = new mongoose.Schema({
  record_id: {
    type: String,
    required: true,
  },
  workdrive_folder_id: {
    type: String,
    required: true,
  },
});

const dmsZohoLeadFolder = mongoose.model('dmsZohoLeadFolder', dmsZohoLeadFolderSchema);

module.exports = dmsZohoLeadFolder;
