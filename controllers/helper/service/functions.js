const dmsZohoDocument = require("../../../models/dmsZohoDocument");

/**
 * Helper function to update the Recent_Activity field for a given Zoho record.
 * @param {Function} zohoRequest - The function to make Zoho API requests.
 * @param {String} moduleName - The Zoho module name (e.g., "Visa_Applications", "Spouse_Skill_Assessment").
 * @param {String} recordId - The Zoho record id to update.
 * @param {String} [activityDateTime] - The activity date string to set in Recent_Activity (defaults to today).
 * @returns {Promise<Object>} - The Zoho API response.
 */
async function updateRecentActivity(zohoRequest, moduleName, recordId) {
  try {

    if (typeof zohoRequest !== 'function') {
      throw new Error('zohoRequest function is required for updateRecentActivity');
    }
    if (!moduleName || typeof moduleName !== 'string') {
      throw new Error('moduleName (string) is required for updateRecentActivity');
    }
    if (!recordId || typeof recordId !== 'string') {
      throw new Error('recordId (string) is required for updateRecentActivity');
    }

    // Format date as 'YYYY-MM-DDTHH:mm:ss±HH:MM' (e.g., '2023-05-28T04:25:36-07:00')
    const date = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    // Get timezone offset in minutes, convert to ±HH:MM
    const tzOffsetMin = date.getTimezoneOffset();
    const absOffsetMin = Math.abs(tzOffsetMin);
    const offsetSign = tzOffsetMin > 0 ? '-' : '+';
    const offsetHours = pad(Math.floor(absOffsetMin / 60));
    const offsetMinutes = pad(absOffsetMin % 60);
    const offset = `${offsetSign}${offsetHours}:${offsetMinutes}`;
    // Format date string
    const activityValue =
      date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + 'T' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds()) +
      offset;

    const body = {
      data: [
        {
          id: recordId,
          Recent_Activity: activityValue.trim().toString()
        }
      ]
    };

    // Zoho expects the module name as the endpoint, e.g., "Visa_Applications"
    const response = await zohoRequest(moduleName, "PUT", body);
    return response;
  } catch (error) {
    console.log("Error occured updating recent activity");
    throw new Error('Error occured updating recent activity: ', error)
  }
}

/**
 * Helper function to add a timeline entry to a document.
 * @param {String} docId - The document ID.
 * @param {String} event - The event name (required).
 * @param {String} details - Details for the event (optional).
 * @param {String} triggered_by - Username who triggered the event (required).
 * @returns {Promise<Object>} The added timeline entry.
 * @throws {Error} If any required parameter is missing or document not found.
 */
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
    timestamp: new Date()
  };

  if (!Array.isArray(document.timeline)) {
    document.timeline = [];
  }
  document.timeline.push(timelineEntry);

  await document.save();

  return timelineEntry;
}

/**
 * Helper function to add a moved file entry to a document's moved_files array.
 * @param {String} docId - The document ID.
 * @param {String} file_id - The ID of the moved file.
 * @param {String} file_name - The name of the moved file.
 * @param {String} moved_by - Username who moved/deleted the file.
 * @returns {Promise<Object>} The added moved file entry.
 * @throws {Error} If any required parameter is missing or document not found.
 */
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
    moved_at: new Date()
  };

  if (!Array.isArray(document.moved_files)) {
    document.moved_files = [];
  }
  document.moved_files.push(movedFileEntry);

  await document.save();

  return movedFileEntry;
}


module.exports = {
  updateRecentActivity,
  addToTimeline,
  addMovedFiles
};
