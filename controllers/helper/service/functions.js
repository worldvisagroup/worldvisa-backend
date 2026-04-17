const dmsZohoDocument = require('../../../models/dmsZohoDocument');
const DmsZohoClient = require('../../../models/dmsZohoClient');
const {
  MODULE_VISA_APPLICATION,
  MODULE_SPOUSE_SKILL_ASSESSMENT,
  REQ_MODULE_VISA_APPLICATION,
  REQ_MODULE_SPOUSE_SKILL_ASSESSMENT,
} = require('../constants');

/**
 * Map Zoho CRM module API name to DmsZohoClient.record_type.
 * @param {string} moduleName
 * @returns {string}
 */
function moduleNameToRecordType(moduleName) {
  if (moduleName === MODULE_SPOUSE_SKILL_ASSESSMENT) {
    return REQ_MODULE_SPOUSE_SKILL_ASSESSMENT;
  }
  return REQ_MODULE_VISA_APPLICATION;
}

/**
 * Set recent_activity on the mirrored DmsZohoClient row (MongoDB).
 * @param {string} moduleName - Zoho module name (e.g. Visa_Applications, Spouse_Skill_Assessment).
 * @param {string} recordId - lead_id (Zoho record id) on DmsZohoClient.
 * @returns {Promise<import('mongoose').UpdateResult>}
 */
async function updateRecentActivityInMongo(moduleName, recordId) {
  if (!moduleName || typeof moduleName !== 'string') {
    throw new Error('moduleName (string) is required for updateRecentActivityInMongo');
  }
  if (!recordId || typeof recordId !== 'string') {
    throw new Error('recordId (string) is required for updateRecentActivityInMongo');
  }

  const recordType = moduleNameToRecordType(moduleName);

  try {
    return await DmsZohoClient.updateOne(
      { lead_id: recordId, record_type: recordType },
      { $set: { recent_activity: new Date() } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update recent_activity in MongoDB: ${msg}`);
  }
}

async function addToTimeline(docId, event, details, triggered_by) {
  if (!dmsZohoDocument) {
    throw new Error('dmsZohoDocument is required.');
  }
  if (!docId) {
    throw new Error('Document ID (docId) is required.');
  }
  if (!event) {
    throw new Error('Event is required for timeline entry.');
  }
  if (!triggered_by) {
    throw new Error('triggered_by (username) is required.');
  }

  const document = await dmsZohoDocument.findById(docId);
  if (!document) {
    throw new Error('Document not found.');
  }

  const timelineEntry = {
    event,
    details: details || '',
    triggered_by,
    timestamp: new Date(),
  };

  if (!Array.isArray(document.timeline)) {
    document.timeline = [];
  }
  document.timeline.push(timelineEntry);

  await document.save();

  return timelineEntry;
}

async function addMovedFiles(docId, file_id, file_name, moved_by = 'Unknown') {
  if (!dmsZohoDocument) {
    throw new Error('dmsZohoDocument is required.');
  }
  if (!docId) {
    throw new Error('Document ID (docId) is required.');
  }
  if (!file_id) {
    throw new Error('file_id is required.');
  }
  if (!file_name) {
    throw new Error('file_name is required.');
  }
  if (!moved_by) {
    throw new Error('moved_by is required.');
  }

  const document = await dmsZohoDocument.findById(docId);

  if (!document) {
    throw new Error('Document not found.');
  }

  const movedFileEntry = {
    file_id,
    file_name,
    moved_by,
    moved_at: new Date(),
  };

  if (!Array.isArray(document.moved_files)) {
    document.moved_files = [];
  }
  document.moved_files.push(movedFileEntry);

  await document.save();

  return movedFileEntry;
}

module.exports = {
  updateRecentActivityInMongo,
  addToTimeline,
  addMovedFiles,
};
