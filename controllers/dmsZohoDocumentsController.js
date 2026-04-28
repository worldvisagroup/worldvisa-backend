const dmsZohoDocument = require('../models/dmsZohoDocument');
const dmsZohoLeadFolder = require('../models/dmsZohoLeadFolder');
const DmsZohoClient = require('../models/dmsZohoClient');
const dmsZohoAusStage2Documents = require("../models/dmsZohoAusStage2Documents");
const dmsZohoSampleDocument = require("../models/dmsZohoSampleDocument");
const mongoose = require('mongoose');
const { STAFF_ROLES } = require('../constants/roles');
const { getdmsZohoLeadFolderId, uploadFileToWorkDrive, deleteFileFromWorkDrive, getFileLinks, createFileLinks, downloadAllFilesInZip, moveFileToSpecificFolder } = require('../utils/dmsZohoWorkDrive');
const { buildDocumentKey, buildVersionedDocumentKey, uploadDocument, moveToDeleted } = require('../services/r2DocumentStorage');
const multer = require('multer');
const { zohoRequest } = require('./zohoDms/zohoApi');
const { addNotificationAndEmit } = require('./helper/service/notifications');
const ZohoDmsUser = require('../models/zohoDmsUser');
const {
  MODULE_VISA_APPLICATION, MODULE_SPOUSE_SKILL_ASSESSMENT,
  REQ_MODULE_VISA_APPLICATION, REQ_MODULE_SPOUSE_SKILL_ASSESSMENT,
  APPLICATION_STAGES, APPLICATION_STAGES_CANADA, APPLICATION_STAGES_GERMANY, SUPPORTED_COUNTRIES,
  APPLICATION_STATE_ACTIVE, ADMIN_ROLES,
  SEARCH_TERM_MAX_LENGTH,
  SERVICE_FINALIZED_PERMANENT_RESIDENCY,
} = require('./helper/constants');
const { searchApplications } = require('../services/opensearchService');
const DEFAULT_GLOBAL_SEARCH_LIMIT = 10;
const { updateRecentActivityInMongo, addToTimeline, addMovedFiles } = require('./helper/service/functions');
const { addActivityLog, getCompanyLabel } = require('./helper/service/activityLog');
const { getAccessToken, refreshAccessToken } = require('./zohoDms/zohoAuth');
const DmsMovedDocuments = require('../models/movedDocuments');
const { capitalizeFn } = require('../utils/helperFunction');
const { escapeRegexForMongo, escapeString, sanitizeUsername, sanitizeSearchTerm } = require('../utils/querySanitizer');
const { processWithRetry } = require('../workers/zipExportWorker');
const ZipExportJob = require('../models/zipExportJob');
const QualityCheckRequest = require('../models/qualityCheckRequest');


const WORKDRIVE_RESOURCE_ID_RE = /^[a-zA-Z0-9]{20,64}$/;


exports.listDocuments = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { status } = req.query; // Get the optional status from query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Build the query object
    const query = { record_id: record_id };
    if (status) {
      query.status = status; // Add status to the query if it exists
    }

    // Run both queries in parallel for better performance
    const [documents, totalRecords] = await Promise.all([
      dmsZohoDocument.find(query).lean().skip(skip).limit(limit),
      dmsZohoDocument.countDocuments(query)
    ]);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
};

exports.getDocumentByReviewUsername = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { username } = req.user;

    if (!username) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const query = { 'requested_reviews.requested_to': username };

    // Run both queries in parallel for better performance
    const [documents, totalRecords] = await Promise.all([
      dmsZohoDocument.find(query).lean().skip(skip).limit(limit),
      dmsZohoDocument.countDocuments(query)
    ]);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error('Error listing documents by user ID:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve documents for the user.' });
  }
};


exports.getDocumentDetails = async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await dmsZohoDocument.findById(docId).lean();
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error retrieving document details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve document details.' });
  }
};


exports.uploadDocument = async (req, res) => {
  try {
    const user = req.user;
    const { record_id } = req.params;
    const { file_name, document_name, document_category, uploaded_by, description, document_type } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    if (!document_name || !document_category) {
      return res.status(400).json({ success: false, message: 'Document name and category are required.' });
    }

    const clientData = await DmsZohoClient.findOne({ lead_id: record_id }).select('name record_type').lean();
    const clientName = clientData?.name || record_id;

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype } = file;
      const r2Key = buildDocumentKey(clientName, record_id, document_category, document_name, originalname);
      await uploadDocument(r2Key, buffer, mimetype);

      const doc = await dmsZohoDocument.create({
        record_id,
        storage_type: 'r2',
        r2_key: r2Key,
        file_name: file_name || originalname,
        document_name,
        document_category,
        uploaded_by: uploaded_by || 'Unknown',
        status: 'pending',
        history: [{ status: 'pending', changed_by: uploaded_by || 'Unknown' }],
        description: description,
        document_type: document_type,
      });

      // Add it to the timeline
      if (doc && doc._id) {
        await addToTimeline(
          doc._id,
          "Document Uploaded",
          `${user?.username ? user.username : user.name || "Unknown"} has uploaded ${doc.document_name}`,
          user?.username ? `${user.role}: ${user?.username}` : `Client: ${user.name}` || "Unknown"
        );
      }

      const isClientUpload = Boolean(user?.lead_id);
      const _uploadCompany = getCompanyLabel(doc.document_category);
      const _uploadDocLabel = _uploadCompany ? `${_uploadCompany} - ${doc.document_name}` : doc.document_name;
      addActivityLog({
        lead_id:           record_id,
        activity_type:     'document_uploaded',
        summary:           `${isClientUpload ? (user.name ?? 'Client') : (user?.username ?? 'Unknown')} uploaded "${_uploadDocLabel}"`,
        actor_type:        isClientUpload ? 'client' : 'staff',
        actor_name:        isClientUpload ? (user.name ?? 'Client') : (user?.username ?? 'Unknown'),
        actor_role:        isClientUpload ? null : (user?.role ?? null),
        document_id:       doc._id,
        document_name:     doc.document_name,
        document_category: doc.document_category,
      });

      const moduleName = clientData?.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT
        ? MODULE_SPOUSE_SKILL_ASSESSMENT
        : MODULE_VISA_APPLICATION;
      // await updateRecentActivityInMongo(moduleName, record_id)
      // Add Notification only if user.role is client
      if (user?.lead_owner) {
        let leadOwnerUser = null;

        if (user?.lead_owner) {
          leadOwnerUser = await ZohoDmsUser.findOne({ username: user.lead_owner });
        }

        if (leadOwnerUser && leadOwnerUser._id) {
          await addNotificationAndEmit({
            req,
            userId: leadOwnerUser._id,
            leadId: user?.lead_id ? user.lead_id : null,
            documentId: doc?._id,
            documentName: doc?.document_name,
            title: `Document uploaded by ${user.name}`,
            message: `${user.name} uploaded ${document_name}`,
            category: 'document',
            source: 'document_review',
            applicationType: moduleName,
            emailNotificationType: 'document_upload',
            emailSubject: `${user.name} uploaded a document`,
            emailTemplateData: {
              clientName: user.name,
              leadOwnerName: user.lead_owner,
              companyName: getCompanyLabel(doc.document_category) || null,
              uploadedAt: new Date().toISOString(),
            },
          });
        }
      };

      return doc;
    });

    const uploadedDocuments = await Promise.all(uploadPromises);

    res.status(201).json({ success: true, data: uploadedDocuments });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ success: false, message: 'Unable to upload the document. Please try again.' });
  }
};

exports.updateDocument = async (req, res) => {

  try {
    const user = req.user;
    const { document_id } = req.params;
    const { file_name, document_name, document_category, uploaded_by, description, document_type } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    if (!document_name || !document_category) {
      return res.status(400).json({ success: false, message: 'Document name and category are required.' });
    }

    const document = await dmsZohoDocument.findById(document_id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const reuploadClientData = await DmsZohoClient.findOne({ lead_id: document.record_id }).select('name record_type').lean();
    const reuploadClientName = reuploadClientData?.name || document.record_id;

    // Archive the existing file
    if (document.storage_type === 'r2' && document.r2_key) {
      try {
        await moveToDeleted(document.r2_key, reuploadClientName, document.record_id, document.document_category, document.document_name, document.file_name);
      } catch (archiveErr) {
        if (archiveErr.Code === 'NoSuchKey' || archiveErr.name === 'NoSuchKey') {
          console.warn(`R2 archive skipped — source key not found (already deleted?): ${document.r2_key}`);
        } else {
          throw archiveErr;
        }
      }
    } else if (document.workdrive_file_id) {
      try {
        await moveFileToSpecificFolder(document.workdrive_file_id);
      } catch (wdErr) {
        console.warn('WorkDrive archive failed (non-fatal):', wdErr.message);
      }
    }

    // Track archive in moved documents
    await DmsMovedDocuments.create({
      document_id: document._id,
      record_id: document.record_id,
      file_name: document.file_name,
      file_id: document.storage_type === 'r2' ? document.r2_key : document.workdrive_file_id,
      moved_by: user && user?.name ? user.name : user.username || 'Unknown',
      move_kind: 'reupload_archive',
    });

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype } = file;
      const r2Key = buildVersionedDocumentKey(
        reuploadClientName,
        document.record_id,
        document_category,
        document_name,
        originalname
      );
      await uploadDocument(r2Key, buffer, mimetype);

      // Update document details
      document.storage_type = 'r2';
      document.r2_key = r2Key;
      document.workdrive_file_id = undefined;
      document.workdrive_parent_id = undefined;
      document.document_link = undefined;
      document.download_url = undefined;
      document.file_name = file_name || originalname;
      document.document_name = document_name;
      document.document_category = document_category;
      document.uploaded_by = uploaded_by || 'Unknown';
      document.status = 'pending';
      document.history.push({ status: 'pending', changed_by: uploaded_by || 'Unknown' });
      document.description = description;
      document.document_type = document_type;

      await document.save();

      // Add it to the timeline
      if (document && document._id) {
        await addToTimeline(
          document._id,
          "Document Re Uploaded",
          `${user?.username ? user.username : user.name || "Unknown"} has uploaded ${document.document_name}`,
          user?.username ? `${user?.role}: ${user?.username}` : `Client: ${user.name}` || "Unknown");
      }

      const isClientReupload = Boolean(user?.lead_id);
      const _reuploadCompany = getCompanyLabel(document.document_category);
      const _reuploadDocLabel = _reuploadCompany ? `${_reuploadCompany} - ${document.document_name}` : document.document_name;
      addActivityLog({
        lead_id:           document.record_id,
        activity_type:     'document_reuploaded',
        summary:           `${isClientReupload ? (user.name ?? 'Client') : (user?.username ?? 'Unknown')} re-uploaded "${_reuploadDocLabel}"`,
        actor_type:        isClientReupload ? 'client' : 'staff',
        actor_name:        isClientReupload ? (user.name ?? 'Client') : (user?.username ?? 'Unknown'),
        actor_role:        isClientReupload ? null : (user?.role ?? null),
        document_id:       document._id,
        document_name:     document.document_name,
        document_category: document.document_category,
      });

      let moduleName = MODULE_VISA_APPLICATION;
      if (reuploadClientData?.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT;
      }

      await updateRecentActivityInMongo(moduleName, document.record_id);

      // Add Notification only if user.role is client
      if (user?.lead_owner) {
        const User = require('../models/zohoDmsUser'); // Adjust path as needed

        let leadOwnerUser = null;

        if (user?.lead_owner) {
          leadOwnerUser = await User.findOne({ username: user.lead_owner });
        }

        if (leadOwnerUser && leadOwnerUser._id) {
          await addNotificationAndEmit({
            req,
            userId: leadOwnerUser._id,
            leadId: user?.lead_id ? user.lead_id : null,
            documentId: document?._id,
            documentName: document?.document_name,
            title: `Document re-uploaded by ${user.name}`,
            message: `${user.name} re uploaded ${document.document_name}`,
            category: 'document',
            source: 'document_review',
            applicationType: moduleName,
            emailNotificationType: 'document_reupload',
            emailSubject: `${user.name} re-uploaded a document`,
            emailTemplateData: {
              clientName: user.name,
              leadOwnerName: user.lead_owner,
              companyName: getCompanyLabel(document.document_category) || null,
              uploadedAt: new Date().toISOString(),
            },
          });
        }
      }
    });

    await Promise.all(uploadPromises);

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ success: false, message: 'Unable to upload the document. Please try again.' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { docId } = req.params;
    const { status, changed_by, reject_message } = req.body;


    const document = await dmsZohoDocument.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const allowedStatuses = ['pending', 'reviewed', 'request_review', 'approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    document.status = status;
    document.reject_message = reject_message;
    document.history.push({ status, changed_by: changed_by || 'Unknown' });
    await document.save();

    const timelineMessage = reject_message
      ? `Document status updated to: ${capitalizeFn(status)} by ${capitalizeFn(changed_by)
      } with this reject message: ${reject_message} `
      : `Document status updated to: ${capitalizeFn(status)} by ${capitalizeFn(changed_by)} `;

    await addToTimeline(document._id, timelineMessage, timelineMessage, changed_by);

    const _statusCompany = getCompanyLabel(document.document_category);
    const _statusDocLabel = _statusCompany ? `${_statusCompany} - ${document.document_name}` : document.document_name;
    addActivityLog({
      lead_id:           document.record_id,
      activity_type:     'document_status_changed',
      summary:           `${changed_by ?? 'Unknown'} changed "${_statusDocLabel}" status to ${status}`,
      actor_type:        'staff',
      actor_name:        changed_by ?? 'Unknown',
      document_id:       document._id,
      document_name:     document.document_name,
      document_category: document.document_category,
      metadata:          { new_status: status, reject_message: reject_message ?? null },
    });

    // Send notification to client when document status changes (approved, rejected, reviewed)
    if (status === 'reviewed') {
      try {
        const clientData = await DmsZohoClient.findOne({ lead_id: document.record_id }).lean();
        if (clientData?._id) {
          const { sendToUser } = require('../services/fcm/fcmService');
          setImmediate(async () => {
            try {
              await sendToUser(String(clientData._id), {
                title: 'Document In Review',
                body: `Your ${_statusDocLabel} is with our team for review.`,
                data: { url: '/', tag: `doc-reviewed-${document._id}` },
              });
            } catch (err) {
              require('../utils/logger').error('[FCM] reviewed push failed', { error: err.message });
            }
          });
        }
      } catch (notifErr) {
        const logger = require('../utils/logger');
        logger.error('Failed to send document reviewed FCM', { error: notifErr.message, docId, status });
      }
    }

    if (status === 'approved' || status === 'rejected') {
      try {
        const clientData = await DmsZohoClient.findOne({ lead_id: document.record_id }).lean();
        if (clientData?._id) {
          await addNotificationAndEmit({
            req,
            userId: clientData._id,
            leadId: document.record_id,
            documentId: document._id,
            documentName: document.document_name,
            title: status === 'approved' ? 'Document Approved' : 'Document Rejected',
            message: status === 'approved'
              ? `Your document "${document.document_name}" has been approved.`
              : `Your document "${document.document_name}" was rejected. Reason: ${reject_message || 'See portal'}`,
            type: status === 'approved' ? 'success' : 'error',
            category: 'document',
            source: 'document_review',
            applicationType: document.applicationType || MODULE_VISA_APPLICATION,
            emailNotificationType: status === 'approved' ? 'document_approved' : 'document_rejected',
            emailSubject: status === 'approved'
              ? `Document Approved: ${document.document_name}`
              : `Action Required — Document Rejected: ${document.document_name}`,
            emailTemplateData: {
              rejectReason: reject_message || null,
              reviewedBy: changed_by || null,
              companyName: _statusCompany || null,
            },
            fcmPayload: {
              title: status === 'approved' ? 'Document Approved' : 'Action Required',
              body: status === 'approved'
                ? `Your ${_statusDocLabel} has been approved!`
                : `Your ${_statusDocLabel} needs a quick update — please review and reupload.`,
              data: { tag: `doc-${status}-${document._id}` },
            },
          });
        }
      } catch (notifErr) {
        // Non-fatal — log and continue
        const logger = require('../utils/logger');
        logger.error('Failed to send document status notification', {
          error: notifErr.message,
          docId,
          status,
        });
      }
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {

    res.status(500).json({ success: false, message: 'Failed to update document status.' });
  }
};

const enrichEntriesWithProfileImages = async (entries = [], senderField = 'added_by') => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const senderNames = [...new Set(
    safeEntries
      .map((entry) => (typeof entry?.[senderField] === 'string' ? entry[senderField].trim() : ''))
      .filter(Boolean)
  )];

  if (!senderNames.length) {
    return safeEntries.map((entry) => ({ ...entry, profile_image_url: null }));
  }

  try {
    const fullNameRegex = senderNames.map((name) => ({
      full_name: { $regex: `^${escapeRegexForMongo(name)}$`, $options: 'i' },
    }));
    const clientNameRegex = senderNames.map((name) => ({
      name: { $regex: `^${escapeRegexForMongo(name)}$`, $options: 'i' },
    }));

    const [staffUsers, clientUsers] = await Promise.all([
      ZohoDmsUser.find({
        $or: [
          { username: { $in: senderNames.map((name) => name.toLowerCase()) } },
          ...fullNameRegex,
        ],
      })
        .select('username full_name profile_image_url')
        .lean(),
      DmsZohoClient.find({
        $or: [
          ...clientNameRegex,
          ...fullNameRegex,
        ],
      })
        .select('name full_name profile_image_url')
        .lean(),
    ]);

    const profileImageByName = {};
    const storeProfile = (name, profileImageUrl) => {
      if (!name || typeof name !== 'string') return;
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName) return;

      // Keep first non-null profile image for each key.
      if (!(normalizedName in profileImageByName) || (profileImageByName[normalizedName] == null && profileImageUrl != null)) {
        profileImageByName[normalizedName] = profileImageUrl ?? null;
      }
    };

    for (const staffUser of staffUsers) {
      storeProfile(staffUser?.username, staffUser?.profile_image_url);
      storeProfile(staffUser?.full_name, staffUser?.profile_image_url);
    }
    for (const clientUser of clientUsers) {
      storeProfile(clientUser?.name, clientUser?.profile_image_url);
      storeProfile(clientUser?.full_name, clientUser?.profile_image_url);
    }

    return safeEntries.map((entry) => {
      const normalizedSender = typeof entry?.[senderField] === 'string'
        ? entry[senderField].trim().toLowerCase()
        : '';
      return {
        ...entry,
        profile_image_url: profileImageByName[normalizedSender] ?? null,
      };
    });
  } catch (error) {
    console.error('Error enriching profile images:', error);
    return safeEntries.map((entry) => ({ ...entry, profile_image_url: null }));
  }
};

const toPlainObject = (value) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  if (value._doc && typeof value._doc === 'object') return value._doc;
  return value;
};

exports.getComments = async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await dmsZohoDocument.findById(docId).select('comments').lean();
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const commentsWithProfileImage = await enrichEntriesWithProfileImages(document.comments ?? [], 'added_by');
    res.status(200).json({ success: true, data: commentsWithProfileImage });
  } catch (error) {
    console.error('Error retrieving comments from document:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve comments.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { docId } = req.params;
    const { comment, added_by, document_link } = req.body;
    const commentPayload = { comment, added_by: added_by || 'Unknown' };

    if (typeof document_link === 'string' && document_link.trim()) {
      commentPayload.document_link = document_link.trim();
    }

    const document = await dmsZohoDocument.findOneAndUpdate(
      { _id: docId },
      { $push: { comments: commentPayload } },
      { new: true }
    );
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (document?.record_id) {
      const clientData = await DmsZohoClient.findOne({ lead_id: document.record_id });

      if (!clientData && !clientData.record_type) {
        throw new Error("Client not found or record type doesn't exist");
      }

      let moduleName = MODULE_VISA_APPLICATION;
      if (clientData.record_type === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (clientData.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
      } else {
        moduleName = MODULE_VISA_APPLICATION;
      }
      // Update Recent Activity
      await updateRecentActivityInMongo(moduleName, document?.record_id);
    }

    const _commentCompany = getCompanyLabel(document.document_category);
    const _commentDocLabel = _commentCompany ? `${_commentCompany} - ${document.document_name}` : document.document_name;
    addActivityLog({
      lead_id:           document.record_id,
      activity_type:     'comment_added',
      summary:           `${added_by ?? 'Unknown'} commented on "${_commentDocLabel}"`,
      actor_type:        req.user?.lead_id ? 'client' : 'staff',
      actor_name:        added_by ?? 'Unknown',
      actor_role:        req.user?.lead_id ? null : (req.user?.role ?? null),
      document_id:       document._id,
      document_name:     document.document_name,
      document_category: document.document_category,
    });

    // FCM push to client when a staff member adds a comment
    if (!req.user?.lead_id && document?.record_id) {
      setImmediate(async () => {
        try {
          const clientTarget = await DmsZohoClient.findOne({ lead_id: document.record_id }).select('_id').lean();
          if (clientTarget?._id) {
            const { sendToUser } = require('../services/fcm/fcmService');
            await sendToUser(String(clientTarget._id), {
              title: 'New Update',
              body: `Your case manager has a note on your ${_commentDocLabel}.`,
              data: { url: '/', tag: `comment-${document._id}` },
            });
          }
        } catch (err) {
          require('../utils/logger').error('[FCM] comment push failed', { error: err.message });
        }
      });
    }

    // In-app + email notification to lead owner when CLIENT adds a comment
    if (req.user?.lead_id && document?.record_id && req.user?.lead_owner) {
      setImmediate(async () => {
        try {
          const leadOwnerUser = await ZohoDmsUser.findOne({ username: req.user.lead_owner }).lean();
          if (leadOwnerUser?._id) {
            await addNotificationAndEmit({
              req,
              userId:                leadOwnerUser._id,
              leadId:                document.record_id,
              documentId:            document._id,
              documentName:          document.document_name,
              link:                  `/admin/applications/${document.record_id}`,
              title:                 `Comment from ${req.user.name}`,
              message:               `${req.user.name} commented on "${_commentDocLabel}"`,
              type:                  'info',
              category:              'document',
              source:                'general',
              applicationType:       document.applicationType || MODULE_VISA_APPLICATION,
              emailNotificationType: 'comment_by_client',
              emailSubject:          `${req.user.name} added a comment`,
              emailTemplateData: {
                clientName:    req.user.name,
                leadOwnerName: req.user.lead_owner,
                companyName:   _commentCompany || null,
                documentName:  document.document_name,
              },
            });
          }
        } catch (err) {
          require('../utils/logger').error('[Notify] client comment notification failed', { error: err.message });
        }
      });
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error adding comment to document:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
};

exports.editComment = async (req, res) => {
  try {
    const { docId } = req.params;
    const { commentId, comment: newComment, edited_by } = req.body;

    const document = await dmsZohoDocument.findOneAndUpdate(
      { _id: docId, 'comments._id': commentId },
      { $set: { 'comments.$.comment': newComment, 'comments.$.edited_by': edited_by || 'Unknown', 'comments.$.edited_at': new Date() } },
      { new: true }
    );
    if (!document) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error editing comment in document:', error);
    res.status(500).json({ success: false, message: 'Failed to edit comment.' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { docId } = req.params;
    const { commentId } = req.body;

    const result = await dmsZohoDocument.findOneAndUpdate(
      { _id: docId, 'comments._id': commentId },
      { $pull: { comments: { _id: commentId } } },
      { new: false }
    );
    if (!result) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    res.status(200).json({ success: true, message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment from document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment.' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await dmsZohoDocument.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (document.storage_type === 'r2' && document.r2_key) {
      const deleteClientData = await DmsZohoClient.findOne({ lead_id: document.record_id }).select('name').lean();
      const deleteClientName = deleteClientData?.name || document.record_id;
      await moveToDeleted(document.r2_key, deleteClientName, document.record_id, document.document_category, document.document_name, document.file_name);
    } else if (document.workdrive_file_id) {
      try {
        await deleteFileFromWorkDrive(document.workdrive_file_id);
      } catch (wdErr) {
        console.warn('WorkDrive delete failed (non-fatal):', wdErr.message);
      }
    }

    // Delete from MongoDB
    await dmsZohoDocument.findByIdAndDelete(docId);

    const user = req.user;
    const isClient = !!user?.lead_id;
    const actorName = isClient ? (user?.name ?? 'Unknown') : (user?.username ?? 'Unknown');
    const docLabel = document.document_name || document.file_name || docId;
    const companyLabel = getCompanyLabel(document.document_category);
    const summarySuffix = companyLabel ? ` (${companyLabel})` : '';

    addActivityLog({
      lead_id:           document.record_id,
      activity_type:     'document_deleted',
      summary:           `${actorName} deleted "${docLabel}"${summarySuffix}`,
      actor_type:        isClient ? 'client' : 'staff',
      actor_name:        actorName,
      actor_role:        isClient ? null : (user?.role ?? null),
      document_id:       document._id,
      document_name:     document.document_name,
      document_category: document.document_category,
    });

    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
};


function formatMovedDocumentPayload(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id,
    document_id: o.document_id,
    record_id: o.record_id,
    file_name: o.file_name,
    file_id: o.file_id,
    moved_at: o.moved_at,
    moved_by: o.moved_by,
    move_kind: o.move_kind,
  };
}


exports.moveFile = async (req, res) => {
  try {
    const user = req.user;
    const { docId } = req.params;

    if (!mongoose.isValidObjectId(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid document id.' });
    }

    const docObjectId = new mongoose.Types.ObjectId(docId);
    const movedBy = user && user.name ? user.name : user.username || 'Unknown';

    let destinationOverride;
    const bodyDest = req.body?.destinationFolderId;
    if (bodyDest != null && String(bodyDest).trim()) {
      if (!STAFF_ROLES.includes(user?.role)) {
        return res.status(403).json({
          success: false,
          message: 'destinationFolderId is only allowed for staff.',
        });
      }
      const trimmed = String(bodyDest).trim();
      if (!WORKDRIVE_RESOURCE_ID_RE.test(trimmed)) {
        return res.status(400).json({ success: false, message: 'Invalid destinationFolderId.' });
      }
      destinationOverride = trimmed;
    }

    const document = await dmsZohoDocument.findById(docId);

    if (!document) {
      let existingFullMove = await DmsMovedDocuments.findOne({
        document_id: docObjectId,
        move_kind: 'full_move',
      }).lean();
      if (!existingFullMove) {
        const legacyRows = await DmsMovedDocuments.find({ document_id: docObjectId }).lean();
        if (legacyRows.length === 1 && legacyRows[0].move_kind == null) {
          existingFullMove = legacyRows[0];
        }
      }
      if (existingFullMove) {
        return res.status(200).json({
          success: true,
          alreadyMoved: true,
          message: 'Document was already moved.',
          data: formatMovedDocumentPayload(existingFullMove),
        });
      }
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    let movedFileId;

    if (document.storage_type === 'r2' && document.r2_key) {
      const clientData = await DmsZohoClient.findOne({ lead_id: document.record_id }).select('name').lean();
      const clientName = clientData?.name || document.record_id;
      movedFileId = await moveToDeleted(
        document.r2_key,
        clientName,
        document.record_id,
        document.document_category,
        document.document_name,
        document.file_name
      );
    } else if (document.workdrive_file_id) {
      await moveFileToSpecificFolder(document.workdrive_file_id, destinationOverride);
      movedFileId = document.workdrive_file_id;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Document has no file reference (no r2_key or workdrive_file_id).',
      });
    }

    const movedPayload = {
      document_id: document._id,
      record_id: document.record_id,
      file_name: document.file_name,
      file_id: movedFileId,
      moved_by: movedBy,
      move_kind: 'full_move',
    };

    let movedRecord;
    try {
      movedRecord = await DmsMovedDocuments.create(movedPayload);
    } catch (createErr) {
      if (createErr.code === 11000 || createErr.code === '11000') {
        movedRecord = await DmsMovedDocuments.findOne({
          document_id: docObjectId,
          move_kind: 'full_move',
        }).lean();
        if (!movedRecord) {
          console.error('[moveFile] duplicate key but no full_move MovedDocument row', { docId });
          throw createErr;
        }
        console.warn('[moveFile] concurrent move; using existing MovedDocument', { docId });
      } else {
        console.error('[moveFile] Mongo insert failed after Zoho move', {
          docId,
          workdrive_file_id: document.workdrive_file_id,
          message: createErr.message,
        });
        try {
          const Sentry = require('@sentry/node');
          Sentry.captureException?.(createErr, {
            extra: { docId, workdrive_file_id: document.workdrive_file_id, phase: 'mongo_insert_after_zoho' },
          });
        } catch (_) {
          /* optional */
        }
        throw createErr;
      }
    }

    await dmsZohoDocument.findByIdAndDelete(docId);

    const data = formatMovedDocumentPayload(
      movedRecord.toObject ? movedRecord.toObject() : movedRecord
    );

    return res.status(200).json({
      success: true,
      alreadyMoved: false,
      message: 'Document moved successfully.',
      data,
    });
  } catch (error) {
    const status = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500;
    console.error('Error moving file:', error.message || error);
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to move file.',
    });
  }
};

exports.allMovedFiles = async (req, res) => {
  try {
    const user = req.user;
    const { record_id } = req.params;

    if (!user) {
      return res.status(401).json({ success: false, message: "Error: UnAuthenticated." })
    }

    if (!record_id) {
      return res.status(404).json({ success: false, message: "record_id is invalid or not found" })
    }

    // Return moved files from the MovedDocument collection for the given record_id
    const movedFiles = await DmsMovedDocuments.find({ record_id });

    res.status(200).json({ success: true, data: movedFiles });
  } catch (error) {
    res.status(500).json({ success: false, data: `Error Occred: ${error} ` })
  }
}


exports.deleteFolderByRecordId = async (req, res) => {
  try {
    const { record_id } = req.params;

    // 1. Find the dmsZohoLeadFolder by record_id
    const leadFolder = await dmsZohoLeadFolder.findOne({ record_id });
    if (!leadFolder) {
      return res.status(404).json({ success: false, message: 'Folder not found for this record ID.' });
    }

    // 2. Delete all associated files from their respective storage
    const documentsToDelete = await dmsZohoDocument.find({ record_id });
    const { deleteFromR2 } = require('../services/r2Client');
    for (const doc of documentsToDelete) {
      if (doc.storage_type === 'r2' && doc.r2_key) {
        await deleteFromR2(doc.r2_key);
      } else if (doc.workdrive_file_id) {
        try {
          await deleteFileFromWorkDrive(doc.workdrive_file_id);
        } catch (wdErr) {
          console.warn('WorkDrive delete failed (non-fatal):', wdErr.message);
        }
      }
    }

    // 3. Delete the corresponding entry from dmsZohoLeadFolder collection (WorkDrive only)
    await dmsZohoLeadFolder.findByIdAndDelete(leadFolder._id);

    // 4. Delete all documents associated with that record_id from dmsZohoDocument collection
    await dmsZohoDocument.deleteMany({ record_id });

    res.status(200).json({ success: true, message: 'Folder and associated documents deleted successfully from WorkDrive and MongoDB.' });
  } catch (error) {
    console.error('Error deleting folder by record ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete folder and associated documents.' });
  }
};

exports.getFileLinks = async (req, res) => {
  try {
    const { resource_id } = req.params;

    if (!resource_id) {
      return res.status(400).json({ success: false, message: 'Resource ID is required.' });
    }

    const linksData = await getFileLinks(resource_id);

    res.status(200).json({ success: true, data: linksData });
  } catch (error) {
    console.error('Error in getFileLinks controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get file links.' });
  }
}


exports.createExternalFileLinks = async (req, res) => {
  try {
    const { resource_id } = req.params;

    if (!resource_id) {
      return res.status(400).json({ success: false, message: 'Resource ID is required.' });
    }

    const linksCreatedResponse = await createFileLinks(resource_id);

    res.status(200).json({ success: true, data: linksCreatedResponse });
  } catch (error) {
    console.error('Error in createExternalFileLinks controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create file links.' });
  }
}

exports.getQualityCheckApplications = async (req, res) => {
  try {
    const username = req.user.username;
    const role = req.user.role;
    const { search, status, recordType } = req.query;

    // Extract pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    if (!username) {
      return res.status(400).json({
        code: 'INVALID_QUERY',
        details: { expected_data_type: 'bigint', column_name: 'id' },
        message: 'value given seems to be invalid for the column',
        status: 'error'
      });
    }

    // Mongo-only endpoint: status comes from QualityCheckRequest.
    // Do not return "removed" to the frontend.
    const VALID_STATUSES = ['pending', 'reviewed'];
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Supported values: ${VALID_STATUSES.join(', ')}` });
    }

    const VALID_RECORD_TYPES = [REQ_MODULE_VISA_APPLICATION, REQ_MODULE_SPOUSE_SKILL_ASSESSMENT];
    if (recordType && !VALID_RECORD_TYPES.includes(recordType)) {
      return res.status(400).json({ success: false, message: `Invalid recordType. Supported values: ${VALID_RECORD_TYPES.join(', ')}` });
    }

    const qcQuery = {
      status: { $ne: 'removed' },
    };

    if (role !== 'master_admin') {
      qcQuery.requested_to = username;
    }

    if (status) {
      qcQuery.status = status;
    }

    if (recordType) {
      qcQuery.recordType = recordType;
    }

    // Search across leadId and client name (Mongo-backed).
    if (search) {
      const safeTerm = sanitizeSearchTerm(search).substring(0, SEARCH_TERM_MAX_LENGTH);
      const rx = new RegExp(escapeRegexForMongo(safeTerm), 'i');

      // First phase: find matching clients to get lead IDs by name/lead_id.
      const matchingClients = await DmsZohoClient.find({
        $or: [{ lead_id: rx }, { name: rx }],
      })
        .select('lead_id')
        .lean()
        .limit(5000);

      const leadIdsFromClients = matchingClients.map((c) => c.lead_id).filter(Boolean);

      qcQuery.$or = [
        { leadId: rx },
        ...(leadIdsFromClients.length > 0 ? [{ leadId: { $in: leadIdsFromClients } }] : []),
      ];
    }

    const [qcDocs, totalRecords] = await Promise.all([
      QualityCheckRequest.find(qcQuery)
        .select('leadId recordType status messages migrated requested_at requested_by requested_to')
        .sort({ requested_at: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      QualityCheckRequest.countDocuments(qcQuery),
    ]);

    const leadIds = qcDocs.map((d) => d.leadId).filter(Boolean);
    const clients = leadIds.length
      ? await DmsZohoClient.find({ lead_id: { $in: leadIds } })
          .select(
            'lead_id name email phone record_type lead_owner zoho_created_time created_at qualified_country dms_application_status main_applicant',
          )
          .lean()
      : [];

    const clientByLeadId = {};
    for (const c of clients) {
      clientByLeadId[c.lead_id] = c;
    }

    const data = qcDocs.map((qc) => {
      const client = clientByLeadId[qc.leadId] || null;
      const createdTime = client?.zoho_created_time || client?.created_at || qc?.requested_at || null;

      return {
        id: qc.leadId,
        Name: client?.name ?? null,
        Email: client?.email ?? null,
        Phone: client?.phone ?? null,
        Created_Time: createdTime,
        Application_Handled_By: client?.lead_owner ?? null,
        Quality_Check_From: qc.requested_to ?? null,
        DMS_Application_Status: client?.dms_application_status ?? null,
        Main_Applicant: client?.main_applicant ?? null,
        Record_Type: qc.recordType ?? client?.record_type ?? null,

        // QC fields (Mongo-backed)
        leadId: qc.leadId,
        qcId: qc._id,
        qcStatus: qc.status ?? null,
        messageCount: Array.isArray(qc.messages) ? qc.messages.length : 0,
        migrated: Boolean(qc.migrated),
        qcRequestedAt: qc.requested_at ?? null,
        qcRequestedBy: qc.requested_by ?? null,
        qcRequestedTo: qc.requested_to ?? null,
      };
    });

    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      data,
      totalCount: totalRecords,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error in getQualityCheckApplications: ", error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get applications of quality check.',
      error: error.message || error.toString()
    });
  }
}

exports.requestQualityCheck = async (req, res) => {
  try {
    const user = req.user;
    const { leadId, reqUserName, recordType } = req.body;

    if (!leadId || !reqUserName) {
      return res.status(400).json({ success: false, message: 'Record ID and reqUserName are required.' });
    }

    const updatedQualityCheckData = {
      "data": [
        {
          "id": leadId,
          "Quality_Check_From": reqUserName
        }
      ]
    };

    let moduleName = MODULE_VISA_APPLICATION;

    if (recordType) {
      if (recordType === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (recordType === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
      }
    }

    const response = await zohoRequest(moduleName, 'PUT', updatedQualityCheckData);

    // Get user details from dmsUserTable using reqUserName
    const userDetails = await ZohoDmsUser.findOne({ username: reqUserName });

    // Get user details from reqUserName
    if (userDetails) {
      await addNotificationAndEmit({
        req,
        leadId,
        userId: userDetails._id,
        title: `Quality check requested by ${user.username}`,
        message: `Application Requested for Quality Check by ${user.username}`,
        category: 'quality check',
        source: 'quality_check',
        applicationType: moduleName,
      });

      // Update recent activity with current date
      await updateRecentActivityInMongo(moduleName, leadId);
    }

    if (!userDetails) {
      return res.status(404).json({ success: false, message: 'User not found in dmsUserTable.' });
    }

    if (response.data) {
      const existing = await QualityCheckRequest.findOne({ leadId });

      if (existing) {
        // Reuse existing record (preserves full message history), reset to pending
        existing.status = 'pending';
        existing.requested_at = new Date();
        existing.requested_by = user.username;
        existing.requested_to = reqUserName;
        existing.recordType = moduleName;
        await existing.save();
      } else {
        await QualityCheckRequest.create({
          leadId,
          recordType: moduleName,
          requested_by: user.username,
          requested_to: reqUserName,
          status: 'pending',
          requested_at: new Date(),
          messages: [],
        });
      }

      addActivityLog({
        lead_id:       leadId,
        activity_type: 'quality_check_requested',
        summary:       `${user.username} sent application for quality check to ${reqUserName}`,
        actor_type:    'staff',
        actor_name:    user.username,
        actor_role:    user.role ?? null,
        metadata:      { requested_to: reqUserName, record_type: recordType ?? null },
      });

      // FCM push to client — positive progress notification
      setImmediate(async () => {
        try {
          const clientForFcm = await DmsZohoClient.findOne({ lead_id: leadId }).select('_id').lean();
          if (clientForFcm?._id) {
            const { sendToUser } = require('../services/fcm/fcmService');
            await sendToUser(String(clientForFcm._id), {
              title: 'Application Progressing',
              body: 'Excellent progress! Your application is moving to quality review.',
              data: { url: '/', tag: `quality-check-${leadId}` },
            });
          }
        } catch (err) {
          require('../utils/logger').error('[FCM] quality-check push failed', { error: err.message });
        }
      });

      return res.status(200).json({ success: true, message: 'Quality check requested successfully.' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to request quality check.' });
    }

  } catch (error) {
    console.error('Error in requestQualityCheck controller:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while requesting quality check.' });
  }
};

exports.removeRequestQualityCheck = async (req, res) => {
  try {
    const { leadId } = req.params;
    const recordType = req.query.recordType;

    if (!leadId) {
      return res.status(400).json({ success: false, message: 'Record ID is required.' });
    }

    const updatedQualityCheckData = {
      "data": [
        {
          "id": leadId,
          "Quality_Check_From": null
        }
      ]
    };

    let moduleName = MODULE_VISA_APPLICATION;

    if (recordType) {
      if (recordType === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (recordType === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
      } else {
        moduleName = MODULE_VISA_APPLICATION;
      }
    }

    const response = await zohoRequest(moduleName, 'PUT', updatedQualityCheckData);

    if (response.data) {
      await QualityCheckRequest.findOneAndUpdate(
        { leadId },
        { status: 'removed' }
      );

      addActivityLog({
        lead_id:       leadId,
        activity_type: 'quality_check_removed',
        summary:       `${req.user?.username ?? 'Unknown'} removed quality check for this application`,
        actor_type:    'staff',
        actor_name:    req.user?.username ?? 'Unknown',
        actor_role:    req.user?.role ?? null,
        metadata:      { record_type: recordType ?? null },
      });

      return res.status(200).json({ success: true, message: 'Quality check removed successfully.' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to remove quality check.' });
    }
  } catch (error) {
    console.error('Error in removeRequestQualityCheck controller');
    return res.status(500).json({ success: false, message: 'An error occurred while removing quality check.' });
  }
};

// -------------------- Quality Check - MongoDB backed endpoints --------------------

exports.getQualityCheckByLeadId = async (req, res) => {
  try {
    const { leadId } = req.params;
    if (!leadId) {
      return res.status(400).json({ success: false, message: 'leadId is required.' });
    }
    const qcRequest = await QualityCheckRequest.findOne({ leadId }).lean();
    if (!qcRequest) {
      return res.status(404).json({ success: false, message: 'Quality check request not found.' });
    }
    return res.status(200).json({ success: true, data: qcRequest });
  } catch (error) {
    console.error('Error in getQualityCheckByLeadId:', error);
    return res.status(500).json({ success: false, message: 'Failed to get quality check request.' });
  }
};

exports.updateQualityCheckStatus = async (req, res) => {
  try {
    const { qcId } = req.params;
    const { status } = req.body;
    if (!qcId || !status) {
      return res.status(400).json({ success: false, message: 'qcId and status are required.' });
    }
    const qcRequest = await QualityCheckRequest.findByIdAndUpdate(
      qcId,
      { status },
      { new: true }
    );
    if (!qcRequest) {
      return res.status(404).json({ success: false, message: 'Quality check request not found.' });
    }
    return res.status(200).json({ success: true, data: qcRequest });
  } catch (error) {
    console.error('Error in updateQualityCheckStatus:', error);
    return res.status(500).json({ success: false, message: 'Failed to update quality check status.' });
  }
};

exports.getQualityCheckMessages = async (req, res) => {
  try {
    const { qcId } = req.params;
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const qcRequest = await QualityCheckRequest.findById(qcId).select('messages').lean();
    if (!qcRequest) {
      return res.status(404).json({ success: false, message: 'Quality check request not found.' });
    }

    // Messages are stored oldest-first; return newest-first for chat pagination
    const allMessages   = [...qcRequest.messages].sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
    const totalMessages = allMessages.length;
    const totalPages    = Math.ceil(totalMessages / limit);
    const offset        = (page - 1) * limit;
    const messages      = allMessages.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage:    page,
        pageSize:       limit,
        totalMessages,
        totalPages,
        hasNextPage:     page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in getQualityCheckMessages:', error);
    return res.status(500).json({ success: false, message: 'Failed to get quality check messages.' });
  }
};

exports.addQualityCheckMessage = async (req, res) => {
  try {
    const { qcId } = req.params;
    const { message } = req.body;
    const username = req.user.username;

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required.' });
    }

    const qcRequest = await QualityCheckRequest.findById(qcId);
    if (!qcRequest) {
      return res.status(404).json({ success: false, message: 'Quality check request not found.' });
    }

    qcRequest.messages.push({ username, message, added_at: new Date() });
    await qcRequest.save();

    // Notify the other party
    const notifyUsername = username === qcRequest.requested_to
      ? qcRequest.requested_by
      : qcRequest.requested_to;

    const notifyUser = await ZohoDmsUser.findOne({ username: notifyUsername });
    if (notifyUser) {
      await addNotificationAndEmit({
        req,
        leadId: qcRequest.leadId,
        userId: notifyUser._id,
        title: `Quality check message from ${username}`,
        message,
        category: 'quality check',
        source: 'quality_check',
        applicationType: qcRequest.recordType,
      });
    }

    return res.status(200).json({ success: true, data: qcRequest.messages });
  } catch (error) {
    console.error('Error in addQualityCheckMessage:', error);
    return res.status(500).json({ success: false, message: 'Failed to add quality check message.' });
  }
};

exports.updateQualityCheckMessage = async (req, res) => {
  try {
    const { qcId } = req.params;
    const { messageId, message } = req.body;

    if (!messageId || !message) {
      return res.status(400).json({ success: false, message: 'messageId and message are required.' });
    }

    const qcRequest = await QualityCheckRequest.findById(qcId);
    if (!qcRequest) {
      return res.status(404).json({ success: false, message: 'Quality check request not found.' });
    }

    const msg = qcRequest.messages.id(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    msg.message = message;
    await qcRequest.save();

    return res.status(200).json({ success: true, message: 'Message updated successfully.' });
  } catch (error) {
    console.error('Error in updateQualityCheckMessage:', error);
    return res.status(500).json({ success: false, message: 'Failed to update quality check message.' });
  }
};

exports.deleteQualityCheckMessage = async (req, res) => {
  try {
    const { qcId } = req.params;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ success: false, message: 'messageId is required.' });
    }

    const qcRequest = await QualityCheckRequest.findById(qcId);
    if (!qcRequest) {
      return res.status(404).json({ success: false, message: 'Quality check request not found.' });
    }

    const msgIndex = qcRequest.messages.findIndex(m => m._id.toString() === messageId);
    if (msgIndex === -1) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    qcRequest.messages.splice(msgIndex, 1);
    await qcRequest.save();

    return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteQualityCheckMessage:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete quality check message.' });
  }
};

// ---------------------------------------------------------------------------------

exports.getChecklistRequestedApplications = async (req, res) => {
  try {
    const username = req.user.username;
    const role = req.user.role;

    if (!username) {
      return res.status(400).json({
        code: 'INVALID_QUERY',
        details: { expected_data_type: 'bigint', column_name: 'id' },
        message: 'value given seems to be invalid for the column',
        status: 'error'
      });
    }

    const { page = 1, limit = 10 } = req.query; // Default pagination values

    let whereClause = `Checklist_Requested = true`;

    if (role === 'admin' || role === 'team_leader') {
      whereClause += ` and Application_Handled_By like ${username} `;
    }

    const selectQuery = `select Name, Email, Phone, Created_Time, Application_Handled_By, Checklist_Requested, Deadline_For_Lodgment, DMS_Application_Status, Record_Type from Visa_Applications where ${whereClause} `;

    const response = await zohoRequest('coql', 'POST', { select_query: selectQuery });

    const selectSpouseQuery = `select Name, Email, Phone, Created_Time, Application_Handled_By, Checklist_Requested, Deadline_For_Lodgment, DMS_Application_Status, Record_Type, Main_Applicant from Spouse_Skill_Assessment where ${whereClause} `;

    const responseSpouse = await zohoRequest('coql', 'POST', { select_query: selectSpouseQuery });

    // Merge both Visa_Applications and Spouse_Skill_Assessment results and return responseSpouse
    const dataVisa = response.data ? response.data : [];
    const dataSpouse = responseSpouse.data ? responseSpouse.data : [];

    // Combine and sort by Created_Time descending (most recent first)
    const data = [...dataVisa, ...dataSpouse].sort((a, b) => {
      // Parse Created_Time as Date, fallback to 0 if missing
      const dateA = a.Created_Time ? new Date(a.Created_Time) : new Date(0);
      const dateB = b.Created_Time ? new Date(b.Created_Time) : new Date(0);
      return dateB - dateA;
    });

    if (data.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(data.length / limit),
        totalItems: data.length
      }
    });

  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({ success: false, message: 'Failed to get applications with checklist requested.' });
  }
};

exports.updateChecklistRequestStatus = async (req, res) => {
  try {
    const user = req.user;
    const { leadId, checklistRequested } = req.body;

    if (!leadId || typeof checklistRequested !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Record ID and checklistRequested (true/false) are required.' });
    }

    const updatedChecklistData = {
      "data": [
        {
          "id": leadId,
          "Checklist_Requested": checklistRequested
        }
      ]
    };

    let moduleName = 'Visa_Applications';

    if (user?.record_type) {
      if (user.record_type === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (user.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
      } else {
        moduleName = MODULE_VISA_APPLICATION;
      }
    }

    const response = await zohoRequest(moduleName, 'PUT', updatedChecklistData);

    if (req.user.lead_owner && checklistRequested) {
      const leadOwnerUser = await ZohoDmsUser.findOne({ username: req.user.lead_owner });

      if (leadOwnerUser) {
        await addNotificationAndEmit({
          req,
          leadId: req.user.lead_id,
          userId: leadOwnerUser._id,
          title: `Checklist requested by ${req.user.name || 'Unknown'}`,
          message: `${req.user.name || 'Unknown'} has requested Checklist`,
          category: 'requested checklist',
          source: 'requested_checklist',
          applicationType: moduleName,
          emailNotificationType: 'checklist_requested',
          emailSubject: `Checklist requested by ${req.user.name || 'Unknown'}`,
          emailTemplateData: {
            clientName: req.user.name || 'Unknown',
            leadOwnerName: leadOwnerUser?.username,
            requestedAt: new Date().toISOString(),
          },
        });
      }

      if (user?.record_type) {
        let moduleName = MODULE_VISA_APPLICATION;
        if (user.record_type === REQ_MODULE_VISA_APPLICATION) {
          moduleName = MODULE_VISA_APPLICATION;
        } else if (user.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
          moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
        } else {
          moduleName = MODULE_VISA_APPLICATION;
        }

        // Update Recent Activity
        await updateRecentActivityInMongo(moduleName, user.lead_id)
      }
    }

    if (response.data) {
      const message = checklistRequested ? 'Checklist requested successfully.' : 'Checklist request removed successfully.';
      return res.status(200).json({ success: true, message });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to update checklist request status.' });
    }
  } catch (error) {
    console.error('Error in updateChecklistRequestStatus controller:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating checklist request status.' });
  }
};



exports.updateZohoFields = async (req, res) => {
  try {
    const { leadId, fieldsToUpdate, recordType } = req.body;

    if (!leadId || !fieldsToUpdate || typeof fieldsToUpdate !== 'object') {
      return res.status(400).json({ success: false, message: 'leadId and fieldsToUpdate are required.' });
    }

    const updatedData = {
      "data": [
        {
          "id": leadId,
          ...fieldsToUpdate
        }
      ]
    };

    let moduleName = MODULE_VISA_APPLICATION;

    if (recordType) {
      if (recordType === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (recordType === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT;
      } else {
        moduleName = MODULE_VISA_APPLICATION;
      }
    }

    const response = await zohoRequest(moduleName, 'PUT', updatedData);

    // Update Recent Acitivity
    await updateRecentActivityInMongo(moduleName, leadId);

    if (response.data) {
      return res.status(200).json({ success: true, message: 'Fields updated successfully.' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to update fields.' });
    }
  } catch (error) {
    console.error('Error in updateZohoFields controller:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating fields.' });
  }
};


exports.searchZohoApplications = async (req, res) => {
  try {
    const rawSearch = req.query.search;
    if (rawSearch != null && String(rawSearch).trim() !== '') {
      const { getApplicationsWithAttachments } = require('./visaApplicationController');
      return getApplicationsWithAttachments(req, res);
    }

    const username = req.user.username;
    const role = req.user.role;

    const { criteria, email, phone, name, giveMine, country = 'Australia' } = req.query;

    if (!criteria && !email && !phone && !name) {
      return res.status(400).json({
        code: 'EXPECTED_PARAM_MISSING',
        details: { param_names: ['criteria', 'email', 'phone', 'name'] },
        message: 'One of the expected parameters is missing',
        status: 'error'
      });
    }

    if (!SUPPORTED_COUNTRIES.includes(country)) {
      return res.status(400).json({ success: false, message: `Invalid country parameter. Supported values: ${SUPPORTED_COUNTRIES.join(', ')}` });
    }

    const whereParts = [];

    if (role === 'admin' || giveMine === 'true') {
      whereParts.push(`Application_Handled_By like '%${username}%'`);
    }

    if (phone) whereParts.push(`Phone like '%${phone}%'`);
    if (name)  whereParts.push(`Name like '%${name}%'`);
    if (email) whereParts.push(`Email like '%${email}%'`);
    if (criteria) whereParts.push(criteria);

    const userWhereClause = whereParts.length > 0 ? `where(${whereParts.join(' and ')})` : '';

    const defaultStages = (country === 'Canada' ? APPLICATION_STAGES_CANADA : APPLICATION_STAGES)
      .map(s => `'${s}'`).join(', ');

    const coreFilters = ` and((((Application_State = 'Active') and(Qualified_Country = '${country}')) and(Service_Finalized = 'Permanent Residency')) and(Application_Stage in (${defaultStages})))`;

    const whereClause = userWhereClause + coreFilters;

    const selectQuery = `select Name, Email, Phone, Created_Time, Application_Handled_By, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Application_Stage from Visa_Applications ${whereClause}`;

    const response = await zohoRequest('coql', 'POST', { select_query: selectQuery });


    const data = response.data ? response.data : [];

    if (data.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const recordIds = data.map(app => app.id);

    const counts = await dmsZohoDocument.aggregate([
      { $match: { record_id: { $in: recordIds } } },
      { $group: { _id: "$record_id", count: { $sum: 1 } } }
    ]);

    const countMap = new Map(counts.map(item => [item._id, item.count]));

    const applicationsWithAttachments = data.map(app => ({
      ...app,
      AttachmentCount: countMap.get(app.id) || 0
    }));

    return res.status(200).json({ success: true, data: applicationsWithAttachments });
  } catch (error) {
    console.error(
      'Error searching Zoho applications:',
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({ success: false, message: 'Failed to search Zoho applications.' });
  }
};

const ALLOWED_GLOBAL_SEARCH_ROLES = ['master_admin', 'supervisor', 'team_leader', 'admin'];


exports.globalSearch = async (req, res) => {
  try {
    const username = req.user?.username;
    const role = req.user?.role;
    const rawSearch = req.query.search;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_GLOBAL_SEARCH_LIMIT, 1), 50);

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!role || !ALLOWED_GLOBAL_SEARCH_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const trimmedSearch = sanitizeSearchTerm(rawSearch, SEARCH_TERM_MAX_LENGTH);
    if (!trimmedSearch) {
      return res.status(400).json({
        success: false,
        message: 'Search parameter is required, must be non-empty, and at most ' + SEARCH_TERM_MAX_LENGTH + ' characters.'
      });
    }

    const mongoRegexEscaped = escapeRegexForMongo(trimmedSearch);
    const mongoRegex = { $regex: mongoRegexEscaped, $options: 'i' };

    const requestedReviewPipeline = [
      { $match: { 'requested_reviews.0': { $exists: true } } },
      {
        $lookup: {
          from: 'dmszohoclients',
          localField: 'record_id',
          foreignField: 'lead_id',
          as: 'client_info'
        }
      },
      {
        $match: {
          $or: [
            { document_name: mongoRegex },
            { document_category: mongoRegex },
            { 'client_info.name': mongoRegex },
            { 'requested_reviews.requested_by': mongoRegex },
            { 'requested_reviews.requested_to': mongoRegex }
          ]
        }
      },
      { $unwind: '$requested_reviews' },
      { $sort: { 'requested_reviews.requested_at': -1 } }
    ];

    if (role === 'admin') {
      requestedReviewPipeline.push({
        $match: {
          $or: [
            { 'requested_reviews.requested_to': username },
            { 'requested_reviews.requested_by': username }
          ]
        }
      });
    }

    requestedReviewPipeline.push(
      {
        $project: {
          _id: 1,
          record_id: 1,
          client_name: { $arrayElemAt: ['$client_info.name', 0] },
          document_name: 1,
          document_category: 1,
          requested_review: {
            requested_by: '$requested_reviews.requested_by',
            requested_to: '$requested_reviews.requested_to',
            status: '$requested_reviews.status',
            _id: '$requested_reviews._id',
            requested_at: '$requested_reviews.requested_at'
          }
        }
      },
      { $limit: limit }
    );

    const [searchR, reviewResult] = await Promise.allSettled([
      searchApplications(trimmedSearch, { size: Math.min(50, limit * 3) }),
      dmsZohoDocument.aggregate(requestedReviewPipeline),
    ]);

    if (searchR.status === 'rejected') console.error('globalSearch OpenSearch query failed:', searchR.reason);
    if (reviewResult.status === 'rejected') console.error('globalSearch review pipeline failed:', reviewResult.reason);

    const searchHits = searchR.status === 'fulfilled' ? searchR.value : [];

    const seenIds = new Set();
    const mergedApps = [];
    for (const hit of searchHits) {
      const s = hit.source;
      if (!s.lead_id || seenIds.has(s.lead_id)) continue;
      seenIds.add(s.lead_id);
      mergedApps.push({
        id: s.lead_id,
        Name: s.name,
        Email: s.email,
        Phone: s.phone,
        Created_Time: s.created_time,
        Application_Handled_By: s.handled_by,
        DMS_Application_Status: s.dms_status,
        Package_Finalize: s.package_finalize,
        Checklist_Requested: s.checklist_requested,
        Deadline_For_Lodgment: s.deadline,
        Record_Type: s.record_type,
        Application_Stage: s.stage,
        Quality_Check_From: s.quality_check_from,
        Qualified_Country: s.country,
        Main_Applicant: s.main_applicant,
      });
    }

    const requestedReviewResult = reviewResult.status === 'fulfilled' ? reviewResult.value : [];

    const recordIds = mergedApps.map(app => app.id).filter(Boolean);
    let countMap = new Map();
    if (recordIds.length > 0) {
      const counts = await dmsZohoDocument.aggregate([
        { $match: { record_id: { $in: recordIds } } },
        { $group: { _id: '$record_id', count: { $sum: 1 } } }
      ]);
      countMap = new Map(counts.map(item => [item._id, item.count]));
    }

    const applicationsWithCount = mergedApps.map(app => ({
      ...app,
      AttachmentCount: countMap.get(app.id) || 0
    }));

    const applications = applicationsWithCount.slice(0, limit);

    const checklistRequested = applicationsWithCount
      .filter(app => app.Checklist_Requested === true)
      .slice(0, limit);

    const qualityCheckFiltered = applicationsWithCount.filter(app => {
      if (!app.Quality_Check_From) return false;
      if (ADMIN_ROLES.includes(role)) return true;
      return app.Quality_Check_From === username;
    });
    const qualityCheck = qualityCheckFiltered.slice(0, limit);

    const requestedReview = Array.isArray(requestedReviewResult) ? requestedReviewResult : [];

    return res.status(200).json({
      success: true,
      data: {
        applications,
        requestedReview,
        checklistRequested,
        qualityCheck
      }
    });
  } catch (error) {
    console.error('Error in globalSearch:', error);
    const devError = process.env.NODE_ENV === 'development' ? error.message : undefined;
    return res.status(500).json({
      success: false,
      message: 'Failed to perform global search.',
      error: devError
    });
  }
};

exports.searchSpouseZohoApplications = async (req, res) => {
  try {
    const rawSearch = req.query.search;
    if (rawSearch != null && String(rawSearch).trim() !== '') {
      const { getSpouseApplicationsWithAttachments } = require('./visaApplicationController');
      return getSpouseApplicationsWithAttachments(req, res);
    }

    const username = req.user.username;
    const role = req.user.role;

    const { criteria, email, phone, name, giveMine } = req.query;

    if (!criteria && !email && !phone && !name) {
      return res.status(400).json({
        code: 'EXPECTED_PARAM_MISSING',
        details: { param_names: ['criteria', 'email', 'phone', 'name'] },
        message: 'One of the expected parameters is missing',
        status: 'error'
      });
    }

    let whereParts = [];
    // Restrict to user's own applications if not admin
    if (role === "admin" || giveMine && giveMine === 'true') {
      whereParts.push(`Application_Handled_By like '%${username}%'`);
    }

    // Build COQL criteria using like for case-insensitive, contains search
    if (phone) {
      whereParts.push(`Phone like '%${phone}%'`);
    }
    if (name) {
      whereParts.push(`Name like '%${name}%'`);
    }
    if (email) {
      whereParts.push(`Email like '%${email}%'`);
    }
    // Generic criteria string (e.g. custom COQL passed in)
    if (criteria) {
      whereParts.push(criteria);
    }

    // Combine all criteria with AND logic
    const whereClause =
      whereParts.length > 0
        ? `where(${whereParts.join(' and ')})`
        : '';

    // Build full COQL query
    const selectQuery = `select Name, Email, Phone, Created_Time, Application_Handled_By, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Application_Stage, Main_Applicant from Spouse_Skill_Assessment ${whereClause} `;

    // Make COQL API request (POST)
    const response = await zohoRequest('coql', 'POST', { select_query: selectQuery });


    const data = response.data ? response.data : [];

    if (data.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Extract all record IDs from applications
    const recordIds = data.map(app => app.id);

    // Use aggregation to count documents for all record_ids in a single query
    const counts = await dmsZohoDocument.aggregate([
      { $match: { record_id: { $in: recordIds } } },
      { $group: { _id: "$record_id", count: { $sum: 1 } } }
    ]);

    // Create a Map for O(1) lookup: record_id -> count
    const countMap = new Map(counts.map(item => [item._id, item.count]));

    // Map counts back to applications
    const applicationsWithAttachments = data.map(app => ({
      ...app,
      AttachmentCount: countMap.get(app.id) || 0
    }));

    return res.status(200).json({ success: true, data: applicationsWithAttachments });
  } catch (error) {
    console.error(
      'Error searching Zoho applications:',
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({ success: false, message: 'Failed to search Zoho applications.' });
  }
};

exports.getChecklist = async (req, res) => {
  try {
    const { record_id } = req.params;

    const user = await DmsZohoClient.findOne({ lead_id: record_id });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    const checklist = user.checklist; // Assuming 'checklist' is a field in the User model

    res.status(200).json({
      status: 'success',
      data: {
        checklist,
      },
    });
  } catch (error) {
    console.error('Error fetching user checklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching the checklist.',
    });
  }
}

exports.addChecklist = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { document_type, document_category, required, description } = req.body;

    if (!document_type || !document_category || required === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Document type, category, and required status are required.',
      });
    }

    const user = await DmsZohoClient.findOne({ lead_id: record_id });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    // Assuming 'checklist' is an array in the User model
    const isNewChecklist = user.checklist.length === 0;
    user.checklist.push({ document_type, document_category, required, description });
    await user.save();

    if (user?.record_type && user?.lead_id) {
      let moduleName = MODULE_VISA_APPLICATION;
      if (user.record_type === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (user.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
      } else {
        moduleName = MODULE_VISA_APPLICATION;
      }
      // Update Recent Activity
      await updateRecentActivityInMongo(moduleName, user.lead_id);

      if (isNewChecklist) {
        // First item ever — notify client that their checklist is ready
        await addNotificationAndEmit({
          req,
          userId: user._id,
          leadId: user.lead_id,
          title: 'Document Checklist Ready',
          message: 'Your document checklist has been prepared. Please log in to view and submit the required documents.',
          type: 'info',
          category: 'document',
          source: 'general',
          applicationType: moduleName,
          emailNotificationType: 'checklist_created',
          emailSubject: 'Your Document Checklist is Ready',
          emailTemplateData: {},
          fcmPayload: {
            title: 'Document Checklist Ready',
            body: 'Your document checklist has been prepared. Please log in to view and submit the required documents.',
            data: { tag: 'checklist-created' },
          },
        });
      } else {
        // Adding to an existing checklist — notify client of the update
        await addNotificationAndEmit({
          req,
          userId: user._id,
          leadId: user.lead_id,
          title: 'Document Checklist Updated',
          message: 'Your document checklist has been updated. Please review the latest requirements.',
          type: 'info',
          category: 'document',
          source: 'general',
          applicationType: moduleName,
          emailNotificationType: 'checklist_updated',
          emailSubject: 'Your Document Checklist Has Been Updated',
          emailTemplateData: {},
          fcmPayload: {
            title: 'Document Checklist Updated',
            body: 'Your document checklist has been updated. Please review the latest requirements.',
            data: { tag: 'checklist-updated' },
          },
        });
      }
    }

    addActivityLog({
      lead_id:       record_id,
      activity_type: 'checklist_created',
      summary:       `${req.user?.username ?? 'Unknown'} added checklist item: "${document_type}"`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Unknown',
      actor_role:    req.user?.role ?? null,
      metadata:      { document_type, document_category },
    });

    res.status(200).json({
      status: 'success',
      message: 'Checklist updated successfully.',
    });
  } catch (error) {
    console.error('Error adding to checklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while adding to the checklist.',
    });
  }
};


exports.editChecklist = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { checklist_id, document_type, document_category, required, description } = req.body;

    if (!checklist_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Checklist ID is required.',
      });
    }

    const user = await DmsZohoClient.findOne({ lead_id: record_id });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    const checklistItem = user.checklist.id(checklist_id);

    if (!checklistItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Checklist item not found.',
      });
    }

    if (document_type !== undefined) checklistItem.document_type = document_type;
    if (document_category !== undefined) checklistItem.document_category = document_category;
    if (required !== undefined) checklistItem.required = required;
    if (description !== undefined) checklistItem.description = description;

    await user.save();

    if (user?.record_type && user?.lead_id) {
      let moduleName = MODULE_VISA_APPLICATION;
      if (user.record_type === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (user.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT;
      } else {
        moduleName = MODULE_VISA_APPLICATION;
      }

      await addNotificationAndEmit({
        req,
        userId: user._id,
        leadId: user.lead_id,
        title: 'Document Checklist Updated',
        message: 'Your document checklist has been updated. Please review the latest requirements.',
        type: 'info',
        category: 'document',
        source: 'general',
        applicationType: moduleName,
        emailNotificationType: 'checklist_updated',
        emailSubject: 'Your Document Checklist Has Been Updated',
        emailTemplateData: {},
        fcmPayload: {
          title: 'Document Checklist Updated',
          body: 'Your document checklist has been updated. Please review the latest requirements.',
          data: { tag: 'checklist-updated' },
        },
      });
    }

    addActivityLog({
      lead_id:       record_id,
      activity_type: 'checklist_updated',
      summary:       `${req.user?.username ?? 'Unknown'} updated a checklist item`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Unknown',
      actor_role:    req.user?.role ?? null,
      metadata:      { document_type, document_category },
    });

    res.status(200).json({
      status: 'success',
      message: 'Checklist item updated successfully.',
    });
  } catch (error) {
    console.error('Error editing checklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while editing the checklist.',
    });
  }
};

exports.deleteChecklist = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { checklist_id } = req.body;

    if (!checklist_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Checklist ID is required.',
      });
    }

    const user = await DmsZohoClient.findOne({ lead_id: record_id });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    const checklistIndex = user.checklist.findIndex(item => item.id === checklist_id);

    if (checklistIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Checklist item not found.',
      });
    }

    const deletedItem = user.checklist[checklistIndex];
    user.checklist.splice(checklistIndex, 1);
    await user.save();

    addActivityLog({
      lead_id:       record_id,
      activity_type: 'checklist_deleted',
      summary:       `${req.user?.username ?? 'Unknown'} deleted checklist item: "${deletedItem?.document_type ?? 'Unknown'}"`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Unknown',
      actor_role:    req.user?.role ?? null,
      metadata:      { document_type: deletedItem?.document_type ?? null },
    });

    res.status(200).json({
      status: 'success',
      message: 'Checklist item deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while deleting the checklist.',
    });
  }
};

exports.getAllRequestedToReview = async (req, res) => {
  try {
    const username = req.user.username;
    const { page = 1, limit = 10, requested_by, requested_to, status, sort = 'last_activity_at', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = sort === 'requested_at' ? 'requested_reviews.requested_at' : 'last_activity_at';

    const result = await dmsZohoDocument.aggregate([
      { $match: { 'requested_reviews.requested_to': username } },
      { $unwind: '$requested_reviews' },
      {
        $match: {
          'requested_reviews.requested_to': username,
          ...(requested_by && { 'requested_reviews.requested_by': requested_by }),
          ...(requested_to && { 'requested_reviews.requested_to': requested_to }),
          ...(status && { 'requested_reviews.status': status })
        }
      },
      // Compute last activity from the timeline array (covers comments, status changes, new requests)
      { $addFields: { last_activity_at: { $arrayElemAt: ['$timeline.timestamp', -1] } } },
      { $sort: { [sortField]: sortDir } },
      {
        $lookup: {
          from: 'dmszohoclients',
          localField: 'record_id',
          foreignField: 'lead_id',
          as: 'client_info'
        }
      },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
                client_name: { $arrayElemAt: ['$client_info.name', 0] },
                suggested_anzsco: { $arrayElemAt: ['$client_info.suggested_anzsco', 0] },
                storage_type: 1,
                r2_key: 1,
                workdrive_file_id: 1,
                workdrive_parent_id: 1,
                file_name: 1,
                document_name: 1,
                document_type: 1,
                document_category: 1,
                uploaded_by: 1,
                uploaded_at: 1,
                status: 1,
                comments: 1,
                download_url: 1,
                document_link: 1,
                description: 1,
                timeline: 1,
                moved_files: 1,
                requested_review: {
                  requested_by: '$requested_reviews.requested_by',
                  requested_to: '$requested_reviews.requested_to',
                  status: '$requested_reviews.status',
                  _id: '$requested_reviews._id',
                  messages: '$requested_reviews.messages',
                  requested_at: '$requested_reviews.requested_at',
                  participants: '$requested_reviews.participants'
                }
              }
            },
            { $skip: skip },
            { $limit: parseInt(limit, 10) }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const paginatedReviews = result[0].data || [];
    const totalItems = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      status: 'success',
      data: paginatedReviews,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching requested reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching requested reviews.'
    });
  }
};

exports.getAllRequestedFromReview = async (req, res) => {
  try {
    const username = req.user.username;
    const { page = 1, limit = 10, requested_to, status, sort = 'last_activity_at', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = sort === 'requested_at' ? 'requested_reviews.requested_at' : 'last_activity_at';

    const result = await dmsZohoDocument.aggregate([
      { $match: { 'requested_reviews.requested_by': username } },
      { $unwind: '$requested_reviews' },
      {
        $match: {
          'requested_reviews.requested_by': username,
          ...(requested_to && { 'requested_reviews.requested_to': requested_to }),
          ...(status && { 'requested_reviews.status': status })
        }
      },
      { $addFields: { last_activity_at: { $arrayElemAt: ['$timeline.timestamp', -1] } } },
      { $sort: { [sortField]: sortDir } },
      {
        $lookup: {
          from: 'dmszohoclients',
          localField: 'record_id',
          foreignField: 'lead_id',
          as: 'client_info'
        }
      },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
                client_name: { $arrayElemAt: ['$client_info.name', 0] },
                suggested_anzsco: { $arrayElemAt: ['$client_info.suggested_anzsco', 0] },
                storage_type: 1,
                r2_key: 1,
                workdrive_file_id: 1,
                workdrive_parent_id: 1,
                file_name: 1,
                document_name: 1,
                document_type: 1,
                document_category: 1,
                uploaded_by: 1,
                uploaded_at: 1,
                status: 1,
                comments: 1,
                download_url: 1,
                document_link: 1,
                description: 1,
                timeline: 1,
                moved_files: 1,
                requested_review: {
                  requested_by: '$requested_reviews.requested_by',
                  requested_to: '$requested_reviews.requested_to',
                  status: '$requested_reviews.status',
                  _id: '$requested_reviews._id',
                  messages: '$requested_reviews.messages',
                  requested_at: '$requested_reviews.requested_at'
                }
              }
            },
            { $skip: skip },
            { $limit: parseInt(limit, 10) }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    const paginatedReviews = result[0].data || [];
    const totalItems = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      status: 'success',
      data: paginatedReviews,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching requested from reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching requested from reviews.'
    });
  }
};

exports.getAllRequestedReview = async (req, res) => {
  try {
    const { page = 1, limit = 10, requested_by, requested_to, status, sort = 'last_activity_at', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;
    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = sort === 'requested_at' ? 'latest_review_at' : 'last_activity_at';

    // Build document-level filter: match docs where any review entry satisfies the criteria
    const reviewFilter = {};
    if (requested_by) reviewFilter.requested_by = requested_by;
    if (requested_to) reviewFilter.requested_to = requested_to;
    if (status) reviewFilter.status = status;

    const documentMatch = {
      'requested_reviews.0': { $exists: true },
      ...(Object.keys(reviewFilter).length > 0 && { requested_reviews: { $elemMatch: reviewFilter } }),
    };

    const result = await dmsZohoDocument.aggregate([
      { $match: documentMatch },
      // Unwind to sort entries chronologically per document
      { $unwind: '$requested_reviews' },
      { $sort: { _id: 1, 'requested_reviews.requested_at': 1 } },
      {
        $lookup: {
          from: 'zohodmsusers',
          let: { requested_to_username: '$requested_reviews.requested_to' },
          pipeline: [
            { $match: { $expr: { $eq: ['$username', '$$requested_to_username'] } } },
            { $project: { _id: 0, role: 1 } }
          ],
          as: 'requested_to_user_info'
        }
      },
      {
        $addFields: {
          'requested_reviews.requested_to_role': { $arrayElemAt: ['$requested_to_user_info.role', 0] }
        }
      },
      // Group back: build full chain (chronological) + track latest for outer sort
      {
        $group: {
          _id: '$_id',
          record_id: { $first: '$record_id' },
          storage_type: { $first: '$storage_type' },
          r2_key: { $first: '$r2_key' },
          workdrive_file_id: { $first: '$workdrive_file_id' },
          workdrive_parent_id: { $first: '$workdrive_parent_id' },
          file_name: { $first: '$file_name' },
          document_name: { $first: '$document_name' },
          document_type: { $first: '$document_type' },
          document_category: { $first: '$document_category' },
          uploaded_by: { $first: '$uploaded_by' },
          uploaded_at: { $first: '$uploaded_at' },
          status: { $first: '$status' },
          comments: { $first: '$comments' },
          download_url: { $first: '$download_url' },
          document_link: { $first: '$document_link' },
          description: { $first: '$description' },
          timeline: { $first: '$timeline' },
          moved_files: { $first: '$moved_files' },
          review_chain: { $push: '$requested_reviews' },       // full chronological chain
          latest_review: { $last: '$requested_reviews' },       // most recent entry
          latest_review_at: { $last: '$requested_reviews.requested_at' },
        },
      },
      // Compute last activity from timeline (covers comments, status changes, new requests)
      {
        $addFields: {
          last_activity_at: { $arrayElemAt: ['$timeline.timestamp', -1] },
          last_uploaded_at: {
            $max: {
              $map: {
                input: {
                  $filter: {
                    input: '$timeline',
                    as: 't',
                    cond: { $in: ['$$t.event', ['Document Uploaded', 'Document Re Uploaded']] }
                  }
                },
                as: 't',
                in: '$$t.timestamp'
              }
            }
          }
        }
      },
      { $sort: { [sortField]: sortDir } },
      {
        $lookup: {
          from: 'dmszohoclients',
          localField: 'record_id',
          foreignField: 'lead_id',
          as: 'client_info',
        },
      },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
                client_name: { $arrayElemAt: ['$client_info.name', 0] },
                suggested_anzsco: { $arrayElemAt: ['$client_info.suggested_anzsco', 0] },
                storage_type: 1,
                r2_key: 1,
                workdrive_file_id: 1,
                workdrive_parent_id: 1,
                file_name: 1,
                document_name: 1,
                document_type: 1,
                document_category: 1,
                uploaded_by: 1,
                uploaded_at: { $ifNull: ['$last_uploaded_at', '$uploaded_at'] },
                status: 1,
                comments: 1,
                download_url: 1,
                document_link: 1,
                description: 1,
                timeline: 1,
                moved_files: 1,
                review_chain: 1,
                requested_review: {
                  requested_by: '$latest_review.requested_by',
                  requested_to: '$latest_review.requested_to',
                  status: '$latest_review.status',
                  _id: '$latest_review._id',
                  messages: '$latest_review.messages',
                  requested_at: '$latest_review.requested_at',
                  participants: '$latest_review.participants',
                },
              },
            },
            { $skip: skip },
            { $limit: parseInt(limit, 10) },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const paginatedReviews = result[0].data || [];
    const totalItems = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      status: 'success',
      data: paginatedReviews,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching all requested reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching all requested reviews.'
    });
  }
};


exports.searchRequestedReviewDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      q,
      document_name,
      document_category,
      client_name,
      requested_by,
      requested_to
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchConditions = { 'requested_reviews.0': { $exists: true } };

    // One search param `q` searches across: document_name, document_category, client name, requested_by, requested_to
    const useUnifiedSearch = q && String(q).trim().length > 0;
    if (!useUnifiedSearch) {
      if (document_name) {
        matchConditions.document_name = {
          $regex: escapeRegexForMongo(document_name),
          $options: 'i'
        };
      }
      if (document_category) {
        matchConditions.document_category = {
          $regex: escapeRegexForMongo(document_category),
          $options: 'i'
        };
      }
      if (requested_by) {
        matchConditions['requested_reviews.requested_by'] = {
          $regex: escapeRegexForMongo(requested_by),
          $options: 'i'
        };
      }
      if (requested_to) {
        matchConditions['requested_reviews.requested_to'] = {
          $regex: escapeRegexForMongo(requested_to),
          $options: 'i'
        };
      }
    }

    const pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'dmszohoclients',
          localField: 'record_id',
          foreignField: 'lead_id',
          as: 'client_info'
        }
      }
    ];

    if (useUnifiedSearch) {
      const escapedQ = escapeRegexForMongo(String(q).trim());
      const regex = { $regex: escapedQ, $options: 'i' };
      pipeline.push({
        $match: {
          $or: [
            { document_name: regex },
            { document_category: regex },
            { 'client_info.name': regex },
            { 'requested_reviews.requested_by': regex },
            { 'requested_reviews.requested_to': regex }
          ]
        }
      });
    } else if (client_name) {
      pipeline.push({
        $match: {
          'client_info.name': {
            $regex: escapeRegexForMongo(client_name),
            $options: 'i'
          }
        }
      });
    }

    pipeline.push(
      { $unwind: '$requested_reviews' },
      { $sort: { 'requested_reviews.requested_at': -1 } },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
                client_name: { $arrayElemAt: ['$client_info.name', 0] },
                suggested_anzsco: { $arrayElemAt: ['$client_info.suggested_anzsco', 0] },
                workdrive_file_id: 1,
                workdrive_parent_id: 1,
                file_name: 1,
                document_name: 1,
                document_type: 1,
                document_category: 1,
                uploaded_by: 1,
                uploaded_at: 1,
                status: 1,
                comments: 1,
                download_url: 1,
                document_link: 1,
                description: 1,
                timeline: 1,
                moved_files: 1,
                requested_review: {
                  requested_by: '$requested_reviews.requested_by',
                  requested_to: '$requested_reviews.requested_to',
                  status: '$requested_reviews.status',
                  _id: '$requested_reviews._id',
                  messages: '$requested_reviews.messages',
                  requested_at: '$requested_reviews.requested_at'
                }
              }
            },
            { $skip: skip },
            { $limit: parseInt(limit, 10) }
          ],
          totalCount: [{ $count: 'count' }]
        }
      }
    );

    const result = await dmsZohoDocument.aggregate(pipeline);

    const paginatedReviews = result[0].data || [];
    const totalItems = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
      status: 'success',
      data: paginatedReviews,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems
      }
    });
  } catch (error) {
    console.error('Error searching requested review documents:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while searching requested review documents.'
    });
  }
};


exports.getRequestedReviewsByDocId = async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await dmsZohoDocument.findById(docId).lean();
    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: document.requested_reviews || [],
    });
  } catch (error) {
    console.error('Error fetching requested reviews by document ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching requested reviews.',
    });
  }
};

exports.addRequestedReviews = async (req, res) => {
  try {
    const { docId } = req.params;
    const { requested_by, requested_to, messages } = req.body;

    if (!requested_by || !requested_to) {
      return res.status(400).json({
        status: 'fail',
        message: 'Both requested_by and requested_to fields are required.',
      });
    }

    const document = await dmsZohoDocument.findById(docId);
    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    document.requested_reviews.push({ requested_by, requested_to, messages, status: 'pending', requested_at: new Date(), participants: [requested_by, requested_to] });

    await document.save();

    const user = await DmsZohoClient.findOne({ lead_id: document?.record_id });

    if (!user) {
      throw new Error("User not found");
    }

    let moduleName = MODULE_VISA_APPLICATION;
    if (user.record_type === REQ_MODULE_VISA_APPLICATION) {
      moduleName = MODULE_VISA_APPLICATION;
    } else if (user.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
      moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
    } else {
      moduleName = MODULE_VISA_APPLICATION;
    }

    // Add it to document timeling
    try {
      await addToTimeline(document._id, `Document requested for review by ${capitalizeFn(requested_by)} from ${capitalizeFn(requested_to)} `, `Document requested for review by ${requested_by} from ${capitalizeFn(requested_to)} `, capitalizeFn(requested_by));
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to add Requested for Review to timeline.',
      });
    }

    // Send Notification to requested_to
    if (requested_by) {
      const DmsUser = require('../models/zohoDmsUser');

      const requestedToUser = await DmsUser.findOne({ username: requested_to });

      if (requestedToUser) {
        const emailQualifies = ['supervisor', 'master_admin'].includes(requestedToUser.role);
        await addNotificationAndEmit({
          req,
          leadId: document?.record_id,
          userId: requestedToUser._id,
          title: `Review requested by ${requested_by}`,
          message: `${requested_by} has requested to review ${document.document_name} document`,
          category: 'request review',
          source: 'requested_reviews',
          applicationType: moduleName,
          ...(emailQualifies && {
            emailNotificationType: 'review_requested',
            emailSubject: `Review requested: ${document.document_name}`,
            emailTemplateData: {
              clientName:      user.name,
              companyName:     getCompanyLabel(document.document_category) ?? null,
              requestedBy:     requested_by,
              requestedAt:     new Date().toISOString(),
              documentName:    document.document_name,
              applicationType: moduleName,
              comment:         messages || null,
            },
          }),
        });
      }

      try {
        if (document?.record_id) {
          await updateRecentActivityInMongo(moduleName, document?.record_id)
        }
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: `Error Occured while updating recent activity: ${error} `,
        });
      }
    }

    const _rrCompany = getCompanyLabel(document.document_category);
    const _rrDocLabel = _rrCompany ? `${_rrCompany} - ${document.document_name}` : document.document_name;
    addActivityLog({
      lead_id:           document.record_id,
      activity_type:     'review_requested',
      summary:           `${requested_by} requested review of "${_rrDocLabel}" from ${requested_to}`,
      actor_type:        'staff',
      actor_name:        requested_by,
      document_id:       document._id,
      document_name:     document.document_name,
      document_category: document.document_category,
      metadata:          { requested_to },
    });

    res.status(200).json({
      status: 'success',
      data: document.requested_reviews,
    });
  } catch (error) {
    console.error('Error adding requested reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add requested reviews.',
    });
  }
};

exports.sendRequestedReview = async (req, res) => {
  try {
    const { docId } = req.params;
    const { requested_to, message } = req.body;
    const requested_by = req.user.username; 

    if (!requested_to || !Array.isArray(requested_to) || requested_to.length === 0) {
      return res.status(400).json({ success: false, message: 'requested_to must be a non-empty array.' });
    }

    const document = await dmsZohoDocument.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const user = await DmsZohoClient.findOne({ lead_id: document?.record_id });
    let moduleName = MODULE_VISA_APPLICATION;
    if (user?.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
      moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT;
    }
    const companyName = getCompanyLabel(document.document_category) || null;

    const created = [];
    const updated = [];
    const now = new Date();

    for (const recipient of [...new Set(requested_to)]) {
      const existing = document.requested_reviews.find(r => r.requested_to === recipient);

      if (existing) {
        // Update — reset to pending, add message, expand participants
        existing.status = 'pending';
        existing.requested_at = now;
        if (message) {
          existing.messages.push({ username: requested_by, message, added_at: now });
        }
        if (!existing.participants) existing.participants = [];
        if (!existing.participants.includes(requested_by)) existing.participants.push(requested_by);
        if (!existing.participants.includes(recipient)) existing.participants.push(recipient);
        updated.push(recipient);
      } else {
        // Create — new review entry
        document.requested_reviews.push({
          requested_by,
          requested_to: recipient,
          status: 'pending',
          requested_at: now,
          participants: [requested_by, recipient],
          messages: message ? [{ username: requested_by, message, added_at: now }] : [],
        });
        created.push(recipient);
      }
    }

    await document.save();

    const allRecipients = [...created, ...updated];

    // Timeline entry
    try {
      await addToTimeline(
        document._id,
        `Review request sent to: ${allRecipients.map(capitalizeFn).join(', ')} by ${capitalizeFn(requested_by)}`,
        `${requested_by} sent review request to ${allRecipients.join(', ')}`,
        capitalizeFn(requested_by)
      );
    } catch (err) {
      console.error('Timeline error:', err);
    }

    // Notify each newly created recipient
    if (created.length > 0) {
      // Notify original requesters (other than the current sender) that the doc moved to a higher stage
      const existingReviews = document.requested_reviews.filter(r => !created.includes(r.requested_to));
      const originalRequesters = [...new Set(existingReviews.map(r => r.requested_by))].filter(
        r => r !== requested_by
      );

      for (const originalRequester of originalRequesters) {
        const originalUser = await ZohoDmsUser.findOne({ username: originalRequester });
        if (originalUser) {
          await addNotificationAndEmit({
            req,
            leadId: document?.record_id,
            documentId: document._id,
            userId: originalUser._id,
            title: 'Review forwarded to higher stage',
            message: `${capitalizeFn(requested_by)} has forwarded the review of "${document.document_name}" to ${created.map(capitalizeFn).join(', ')} for further review`,
            category: 'request review',
            source: 'requested_reviews',
            applicationType: moduleName,
            documentName: document.document_name,
          });
        }
      }

      // Notify each new recipient
      for (const recipient of created) {
        const recipientUser = await ZohoDmsUser.findOne({ username: recipient });
        if (recipientUser) {
          await addNotificationAndEmit({
            req,
            leadId: document?.record_id,
            documentId: document._id,
            userId: recipientUser._id,
            title: `Review requested by ${capitalizeFn(requested_by)}`,
            message: `${capitalizeFn(requested_by)} has requested you to review "${document.document_name}"`,
            category: 'request review',
            source: 'requested_reviews',
            applicationType: moduleName,
            documentName: document.document_name,
            emailNotificationType: 'review_requested',
            emailSubject: `Review requested: ${document.document_name}`,
            emailTemplateData: {
              clientName: user?.name || null,
              companyName,
              applicationType: moduleName,
              documentName: document.document_name,
              comment: message || null,
              requestedBy: requested_by,
              requestedAt: now.toISOString(),
            },
          });
        }
      }
    }

    // Notify re-requested (updated) recipients
    for (const recipient of updated) {
      const recipientUser = await ZohoDmsUser.findOne({ username: recipient });
      if (recipientUser) {
        await addNotificationAndEmit({
          req,
          leadId: document?.record_id,
          documentId: document._id,
          userId: recipientUser._id,
          title: `Review reminder from ${capitalizeFn(requested_by)}`,
          message: `${capitalizeFn(requested_by)} has re-requested your review of "${document.document_name}"`,
          category: 'request review',
          source: 'requested_reviews',
          applicationType: moduleName,
          documentName: document.document_name,
          emailNotificationType: 'review_requested',
          emailSubject: `Review reminder: ${document.document_name}`,
          emailTemplateData: {
            clientName: user?.name || null,
            companyName,
            applicationType: moduleName,
            documentName: document.document_name,
            comment: message || null,
            requestedBy: requested_by,
            requestedAt: now.toISOString(),
          },
        });
      }
    }

    // Activity log (fire-and-forget)
    const _company = getCompanyLabel(document.document_category);
    const _docLabel = _company ? `${_company} - ${document.document_name}` : document.document_name;
    const actionLabel =
      created.length > 0 && updated.length > 0
        ? `sent new requests to ${created.join(', ')} and re-sent to ${updated.join(', ')}`
        : created.length > 0
        ? `forwarded review to ${created.join(', ')}`
        : `re-sent review request to ${updated.join(', ')}`;

    addActivityLog({
      lead_id: document.record_id,
      activity_type: 'review_requested',
      summary: `${requested_by} ${actionLabel} for "${_docLabel}"`,
      actor_type: 'staff',
      actor_name: requested_by,
      document_id: document._id,
      document_name: document.document_name,
      document_category: document.document_category,
      metadata: { created, updated },
    });

    return res.status(200).json({
      success: true,
      message: 'Review requests processed.',
      data: { created, updated },
    });
  } catch (error) {
    console.error('Error in sendRequestedReview:', error);
    res.status(500).json({ success: false, message: 'Failed to process review requests.' });
  }
};

exports.editRequestedReview = async (req, res) => {
  try {
    const { docId } = req.params;
    const { reviewId, requested_by, requested_to, messages, status } = req.body;

    const document = await dmsZohoDocument.findById(docId);
    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    const review = document.requested_reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Requested review not found.',
      });
    }

    // Never overwrite requested_by — original requester must stay visible in all_me
    if (requested_to !== undefined) {
      review.requested_to = requested_to;
      if (!review.participants) review.participants = [];
      if (!review.participants.includes(requested_to)) review.participants.push(requested_to);
    }
    if (messages !== undefined) review.messages = messages;
    if (status !== undefined) {
      review.status = status;
      if (status === 'pending') {
        review.requested_at = new Date();   
      }
    }
    

    await document.save();

    // Add it to document timeling
    try {
      await addToTimeline(
        document._id,
        messages && messages.trim()
          ? `Document was successfully reviewed by ${capitalizeFn(requested_to)} with this message: ${messages}`
          : `Document was successfully reviewed by ${capitalizeFn(requested_to)}`,
        messages && messages.trim()
          ? `Document was successfully reviewed by ${capitalizeFn(requested_to)} with this message: ${messages}`
          : `Document was successfully reviewed by ${capitalizeFn(requested_to)}`,
        capitalizeFn(requested_to)
      );
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to add Requested for Review to timeline.',
      });
    }

    const _rsuCompany = getCompanyLabel(document.document_category);
    const _rsuDocLabel = _rsuCompany ? `${_rsuCompany} - ${document.document_name}` : document.document_name;
    addActivityLog({
      lead_id:           document.record_id,
      activity_type:     'review_status_updated',
      summary:           `${requested_to ?? req.user?.username ?? 'Unknown'} updated review status to "${status}" on "${_rsuDocLabel}"`,
      actor_type:        'staff',
      actor_name:        requested_to ?? req.user?.username ?? 'Unknown',
      document_id:       document._id,
      document_name:     document.document_name,
      document_category: document.document_category,
      metadata:          { status, requested_by },
    });

    res.status(200).json({
      status: 'success',
      data: document.requested_reviews,
    });
  } catch (error) {
    console.error('Error editing requested review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to edit requested review.',
    });
  }
};

exports.deleteRequestedReview = async (req, res) => {
  try {
    const { docId } = req.params;
    const { reviewId } = req.body;

    const document = await dmsZohoDocument.findById(docId);
    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    const reviewIndex = document.requested_reviews.findIndex(review => review._id.toString() === reviewId);
    if (reviewIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Requested review not found.',
      });
    }

    document.requested_reviews.splice(reviewIndex, 1);
    await document.save();

    const _rcCompany = getCompanyLabel(document.document_category);
    const _rcDocLabel = _rcCompany ? `${_rcCompany} - ${document.document_name}` : document.document_name;
    addActivityLog({
      lead_id:           document.record_id,
      activity_type:     'review_cancelled',
      summary:           `${req.user?.username ?? 'Unknown'} cancelled a review request on "${_rcDocLabel}"`,
      actor_type:        'staff',
      actor_name:        req.user?.username ?? 'Unknown',
      actor_role:        req.user?.role ?? null,
      document_id:       document._id,
      document_name:     document.document_name,
      document_category: document.document_category,
    });

    res.status(200).json({
      status: 'success',
      message: 'Requested review deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting requested review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete requested review.',
    });
  }
};

exports.allRequestedReviewMessages = async (req, res) => {
  try {
    const { docId, reviewId } = req.params;

    const document = await dmsZohoDocument.findById(docId);
    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    const review = document.requested_reviews.find(review => review._id.toString() === reviewId);
    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Requested review not found.',
      });
    }

    const plainMessages = (review.messages ?? []).map(toPlainObject);
    const requestedReviewMessages = await enrichEntriesWithProfileImages(plainMessages, 'username');

    res.status(200).json({
      status: 'success',
      data: requestedReviewMessages,
    });
  } catch (error) {
    console.error('Error fetching requested review messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch requested review messages.',
    });
  }
};

exports.addRequestedReviewMessage = async (req, res) => {
  try {
    const { username } = req.user;
    const { docId, reviewId } = req.params;
    const { message } = req.body;

    if (!username || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Both username and message content are required.',
      });
    }

    const document = await dmsZohoDocument.findById(docId);

    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    const review = document.requested_reviews.find(review => review._id.toString() === reviewId);

    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Requested review not found.',
      });
    }

    review.messages.push({ username, message });

    await document.save();

    const clientData = await DmsZohoClient.findOne({ lead_id: document.record_id });

    if (!clientData || !clientData?.record_type) {
      throw new Error(`Client not found or Record type not found`)
    }

    let moduleName = MODULE_VISA_APPLICATION;
    if (clientData.record_type === REQ_MODULE_VISA_APPLICATION) {
      moduleName = MODULE_VISA_APPLICATION;
    } else if (clientData.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
      moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
    } else {
      moduleName = MODULE_VISA_APPLICATION;
    }

    if (username === review.requested_to) {
      // Send Notification to the lead owner once message is added
      const leadOwnerUsername = review.requested_by;

      if (leadOwnerUsername) {
        const user = await ZohoDmsUser.findOne({ username: leadOwnerUsername });

        await addNotificationAndEmit({
          req,
          userId: user._id,
          title: `New message from ${review.requested_to}`,
          message: `${review.requested_to} has sent you a message: ${message}`,
          leadId: document.record_id,
          documentId: document._id,
          documentName: document?.document_name,
          category: 'admin message',
          source: 'requested_reviews',
          applicationType: moduleName,
        });
      }
    } else if (username === review.requested_by) {
      const leadOwnerUsername = review.requested_to;

      if (leadOwnerUsername) {
        const user = await ZohoDmsUser.findOne({ username: leadOwnerUsername });

        await addNotificationAndEmit({
          req,
          userId: user._id,
          title: `New message from ${review.requested_by}`,
          message: `${review.requested_by} has sent you a message: ${message}`,
          leadId: document.record_id,
          documentId: document._id,
          documentName: document?.document_name,
          category: 'admin message',
          source: 'requested_reviews',
          applicationType: moduleName,
        });
      }
    }

    if (document?.record_id) {
      // Update Recent Activity
      await updateRecentActivityInMongo(moduleName, document.record_id)
    }

    const _rmCompany = getCompanyLabel(document.document_category);
    const _rmDocLabel = _rmCompany ? `${_rmCompany} - ${document.document_name}` : document.document_name;
    addActivityLog({
      lead_id:           document.record_id,
      activity_type:     'review_message_added',
      summary:           `${username} added a review message: "${message}" on "${_rmDocLabel}"`,
      actor_type:        'staff',
      actor_name:        username,
      actor_role:        req.user?.role ?? null,
      document_id:       document._id,
      document_name:     document.document_name,
      document_category: document.document_category,
    });

    const plainMessages = (review.messages ?? []).map(toPlainObject);
    const requestedReviewMessages = await enrichEntriesWithProfileImages(plainMessages, 'username');

    res.status(200).json({
      status: 'success',
      data: requestedReviewMessages,
    });
  } catch (error) {
    console.error('Error creating requested review message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create requested review message.',
    });
  }
};

exports.updateRequestedReviewMessage = (req, res) => {
  try {
    const { docId, reviewId } = req.params;
    const { messageId, message } = req.body;

    if (!messageId || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Both messageId and message content are required.',
      });
    }

    dmsZohoDocument.findById(docId)
      .then(document => {
        if (!document) {
          return res.status(404).json({
            status: 'fail',
            message: 'Document not found.',
          });
        }

        const review = document.requested_reviews.find(review => review._id.toString() === reviewId);
        if (!review) {
          return res.status(404).json({
            status: 'fail',
            message: 'Requested review not found.',
          });
        }

        const messageObj = review.messages.find(msg => msg._id.toString() === messageId);
        if (!messageObj) {
          return res.status(404).json({
            status: 'fail',
            message: 'Message not found.',
          });
        }

        messageObj.message = message;
        return document.save();
      })
      .then(() => {
        res.status(200).json({
          status: 'success',
          message: 'Message updated successfully.',
        });
      })
      .catch(error => {
        console.error('Error updating requested review message:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to update requested review message.',
        });
      });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred.',
    });
  }
}

exports.deleteRequestedReviewMessage = (req, res) => {
  try {
    const { docId, reviewId } = req.params;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        status: 'fail',
        message: 'MessageId is required.',
      });
    }

    dmsZohoDocument.findById(docId)
      .then(document => {
        if (!document) {
          return res.status(404).json({
            status: 'fail',
            message: 'Document not found.',
          });
        }

        const review = document.requested_reviews.find(review => review._id.toString() === reviewId);
        if (!review) {
          return res.status(404).json({
            status: 'fail',
            message: 'Requested review not found.',
          });
        }

        const messageIndex = review.messages.findIndex(msg => msg._id.toString() === messageId);
        if (messageIndex === -1) {
          return res.status(404).json({
            status: 'fail',
            message: 'Message not found.',
          });
        }

        review.messages.splice(messageIndex, 1);
        return document.save();
      })
      .then(() => {
        res.status(200).json({
          status: 'success',
          message: 'Message deleted successfully.',
        });
      })
      .catch(error => {
        console.error('Error deleting requested review message:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to delete requested review message.',
        });
      });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred.',
    });
  }
}

// Create async ZIP export job
exports.downloadAllFiles = async (req, res) => {
  try {
    const { record_id } = req.params;
    const user = req.user;

    if (!record_id) {
      return res.status(400).json({
        success: false,
        message: 'Record ID is required.'
      });
    }

    // Quick check if approved documents exist
    const documentCount = await dmsZohoDocument.countDocuments({
      record_id,
      status: 'approved'
    });
    if (documentCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No approved documents found for this record.'
      });
    }

    // Create job record in database
    const job = await ZipExportJob.create({
      record_id,
      status: 'pending',
      requested_by: user?._id,
      progress: {
        current: 0,
        total: documentCount,
      },
    });

    // Start processing in background (no Redis needed)
    setImmediate(() => processWithRetry(job._id.toString(), record_id));

    console.log(`[Download All] Created ZIP export job ${job._id} for record ${record_id}`);

    // Return job ID immediately
    return res.status(202).json({
      success: true,
      job_id: job._id,
      status: 'pending',
      message: 'ZIP export job created. Use the job_id to check status.',
      status_url: `/api/zoho_dms/visa_applications/${record_id}/documents/download/all/status/${job._id}`
    });

  } catch (error) {
    console.error('Error creating ZIP export job:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ZIP export job.'
    });
  }
};

// Check ZIP export job status
exports.getZipExportStatus = async (req, res) => {
  try {
    const { job_id } = req.params;

    const job = await ZipExportJob.findById(job_id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    // Check if job has expired
    if (job.expires_at && new Date() > job.expires_at) {
      return res.status(410).json({
        success: false,
        status: 'expired',
        message: 'Download link has expired (24 hour limit).'
      });
    }

    const response = {
      success: true,
      job_id: job._id,
      status: job.status,
      progress: job.progress,
      created_at: job.created_at,
    };

    if (job.status === 'completed') {
      response.download_url = job.download_url;
      response.expires_at = job.expires_at;
      response.completed_at = job.completed_at;
    }

    if (job.status === 'failed') {
      response.error_message = job.error_message;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching ZIP export status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job status.'
    });
  }
};

// Cancel pending ZIP export job
exports.cancelZipExport = async (req, res) => {
  try {
    const { job_id } = req.params;

    const job = await ZipExportJob.findById(job_id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found.'
      });
    }

    if (job.status !== 'pending' && job.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel job with status: ${job.status}`
      });
    }

    // Update database (setting status to 'failed' signals the running worker to abort)
    await ZipExportJob.findByIdAndUpdate(job_id, {
      status: 'failed',
      error_message: 'Cancelled by user',
      completed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: 'Job cancelled successfully.'
    });

  } catch (error) {
    console.error('Error cancelling ZIP export:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel job.'
    });
  }
};

exports.downloadSampleFile = async (req, res) => {
  try {
    const resourceId = '7pdp3756646c2a5b241d1a02006d10abf5ab9';
    // await refreshAccessToken();
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return res.status(500).json({
        status: 'error',
        message: 'Unable to get Zoho access token.',
      });
    }

    const axios = require('axios');
    const url = `https://download.zoho.in/v1/workdrive/download/${resourceId}`;

    // Stream the file from Zoho to the client
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        responseType: 'stream',
      });

      res.setHeader('Content-Disposition', 'attachment; filename="sample-file"');
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

      response.data.pipe(res);
    } catch (error) {
      console.error('Error in downloadSampleFile:', error);
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred while downloading the file.',
      });
    }
  } catch (error) {
    console.error('Error in downloadSampleFile:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while processing the request.',
    });
  }
};

exports.getAllTimeline = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!docId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Document ID (docId) is required.',
      });
    }

    // Assuming dmsZohoDocument is your Mongoose model
    const document = await dmsZohoDocument.findById(docId).lean();

    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    // Assuming the timeline is stored in a field called 'timeline' in the document
    // If not, adjust the field name accordingly
    const timeline = Array.isArray(document.timeline) ? document.timeline : [];

    const normalizeTimelineSender = (raw) => {
      if (typeof raw !== 'string') return '';
      const trimmed = raw.trim();
      if (!trimmed) return '';

      // Many call sites pass strings like "role: username" or "Client: Name".
      // Prefer the portion after the final ':' to match username/name in DB.
      const lastColon = trimmed.lastIndexOf(':');
      if (lastColon === -1) return trimmed;

      const afterColon = trimmed.slice(lastColon + 1).trim();
      return afterColon || trimmed;
    };

    // Enrich each entry with profile_image_url without changing existing fields.
    const timelineForEnrich = timeline.map((entry) => ({
      ...entry,
      __timeline_sender: normalizeTimelineSender(entry?.triggered_by),
    }));
    const enrichedTimeline = await enrichEntriesWithProfileImages(timelineForEnrich, '__timeline_sender');
    const timelineWithProfileImage = enrichedTimeline.map(({ __timeline_sender, ...rest }) => rest);

    return res.status(200).json({
      status: 'success',
      timeline: timelineWithProfileImage,
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch timeline.',
    });
  }
};

exports.addTimelineEntry = async (req, res) => {
  try {
    const { docId } = req.params;
    const { event, details } = req.body;

    // Prefer req.user.username, fallback to req.body.triggered_by
    let triggered_by = (req.user && req.user.username) ? req.user.username : req.body.triggered_by;

    const timelineEntry = await addToTimeline(docId, event, details, triggered_by);

    return res.status(201).json({
      status: 'success',
      message: 'Timeline entry added successfully.',
      timelineEntry
    });
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add timeline entry.',
    });
  }
};

/**
 * Moved-document audit rows for a given document_id (full_move and reupload_archive).
 */
exports.getAllMovedDocuments = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!docId) {
      return res.status(400).json({
        status: 'fail',
        message: 'docId not provided.'
      });
    }

    if (!mongoose.isValidObjectId(docId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid document id.',
      });
    }

    const movedFiles = await DmsMovedDocuments.find({
      document_id: new mongoose.Types.ObjectId(docId),
    })
      .sort({ moved_at: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      moved_files: movedFiles || [],
    });
  } catch (error) {
    console.error('Error fetching moved_files:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch moved_files.'
    });
  }
};


exports.getAusStage2Documents = async (req, res) => {
  try {
    const { record_id } = req.params;
    const documents = await dmsZohoAusStage2Documents.find({ record_id: record_id });

    if (!documents || documents.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No Australia Stage 2 documents are available for the provided record ID.',
        data: []
      });
    }

    res.status(200).json({
      status: 'success',
      data: documents
    });
  } catch (error) {
    console.error('Error fetching Australia Stage 2 documents:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving Australia Stage 2 documents. Please try again later.',
      data: []
    });
  }
};

exports.uploadAusStage2Document = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { file_name, document_name, document_type, uploaded_by, type, outcome_date, subclass, state, point, deadline, date, outcome, skill_assessing_body, language_assessing_body, expiry_at, invitation_type } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    if (!document_name || !document_type) {
      return res.status(400).json({ success: false, message: 'Document name and type are required.' });
    }

    const stage2ClientData = await DmsZohoClient.findOne({ lead_id: record_id }).select('name').lean();
    const stage2ClientName = stage2ClientData?.name || record_id;

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype } = file;

      const r2Key = buildDocumentKey(stage2ClientName, record_id, type, document_name, originalname);
      await uploadDocument(r2Key, buffer, mimetype);

      const doc = await dmsZohoAusStage2Documents.create({
        record_id,
        storage_type: 'r2',
        r2_key: r2Key,
        file_name: file_name || originalname,
        document_name,
        document_type,
        uploaded_by: uploaded_by || 'Unknown',
        type: type,
        ...(outcome && { outcome }),
        ...(outcome_date && { outcome_date }),
        ...(subclass && { subclass }),
        ...(state && { state }),
        ...(point && { point }),
        ...(deadline && { deadline }),
        ...(date && { date }),
        ...(skill_assessing_body && { skill_assessing_body }),
        ...(language_assessing_body && { language_assessing_body }),
        ...(expiry_at && { expiry_at }),
        ...(invitation_type && { invitation_type })
      });

      return doc;
    });

    const uploadedDocuments = await Promise.all(uploadPromises);

    res.status(201).json({ success: true, data: uploadedDocuments });
  } catch (error) {
    console.error('Error uploading outcome and EOI documents:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload outcome and EOI documents.' });
  }
};

exports.updateAusStage2Document = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, document_name, document_type, uploaded_by, outcome_date, subclass, state, point, deadline, date, outcome, skill_assessing_body, language_assessing_body, expiry_at, invitation_type } = req.body;

    const document = await dmsZohoAusStage2Documents.findById(id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Update document details
    document.file_name = file_name || document.file_name;
    document.document_name = document_name || document.document_name;
    document.document_type = document_type || document.document_type;
    document.uploaded_by = uploaded_by || document.uploaded_by;
    document.outcome = outcome || document.outcome;
    document.outcome_date = outcome_date || document.outcome_date;
    document.subclass = subclass || document.subclass;
    document.state = state || document.state;
    document.point = point || document.point;
    document.deadline = deadline || document.deadline;
    document.date = date || document.date;
    document.skill_assessing_body = skill_assessing_body !== undefined ? skill_assessing_body : document.skill_assessing_body;
    document.language_assessing_body = language_assessing_body !== undefined ? language_assessing_body : document.language_assessing_body;
    document.expiry_at = expiry_at !== undefined ? expiry_at : document.expiry_at;
    document.invitation_type = invitation_type !== undefined ? invitation_type : document.invitation_type;

    await document.save();

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error updating outcome and EOI documents:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update outcome and EOI documents.' });
  }
};


exports.deleteAusStage2Document = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the document to be deleted
    const document = await dmsZohoAusStage2Documents.findById(id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (document.storage_type === 'r2' && document.r2_key) {
      const { deleteFromR2 } = require('../services/r2Client');
      await deleteFromR2(document.r2_key);
    } else if (document.workdrive_file_id) {
      try {
        await deleteFileFromWorkDrive(document.workdrive_file_id);
      } catch (wdErr) {
        console.warn('WorkDrive delete failed (non-fatal):', wdErr.message);
      }
    }

    // Delete the document from MongoDB
    await dmsZohoAusStage2Documents.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Unable to delete the document. Please try again.' });
  }
}

exports.getAllSampleDocuments = async (req, res) => {
  try {
    const { record_id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { lead_id: record_id }; // Assuming lead_id corresponds to record_id

    const sampleDocuments = await dmsZohoSampleDocument.find(query).skip(skip).limit(limit);
    const totalRecords = await dmsZohoSampleDocument.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sampleDocuments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching sample documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sample documents.' });
  }
};


exports.uploadSampleDocuments = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { document_name, file_name, type } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    if (!document_name || !record_id || !type) {
      return res.status(400).json({ success: false, message: 'Document name, lead ID, and type are required.' });
    }

    const workdriveFolderId = await getdmsZohoLeadFolderId(record_id);

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype } = file;

      const workdriveFile = await uploadFileToWorkDrive(workdriveFolderId, originalname, buffer, mimetype);
      const externalLinkData = await createFileLinks(workdriveFile);


      const document = await dmsZohoSampleDocument.create({
        document_name,
        zoho_workdrive_id: workdriveFile,
        zoho_parent_id: workdriveFolderId,
        lead_id: record_id,
        type,
        document_link: externalLinkData.data.attributes.link,
        download_url: externalLinkData.data.attributes.download_url
      });

      return {
        document,
        download_url: externalLinkData.data.attributes.download_url,
        document_link: externalLinkData.data.attributes.link,
      };
    });

    const uploadedDocuments = await Promise.all(uploadPromises);

    res.status(201).json({ success: true, data: uploadedDocuments });
  } catch (error) {
    console.error('Error uploading sample documents:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload sample documents.' });
  }
};

exports.updateSampleDocuments = async (req, res) => {
  try {
    const { document_id } = req.params;
    const { document_name, file_name, type } = req.body;

    if (!document_id) {
      return res.status(400).json({ success: false, message: 'Document ID is required.' });
    }

    // Find the document to update
    const document = await dmsZohoSampleDocument.findById(document_id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Update the fields except for zoho_workdrive_id
    document.document_name = document_name || document.document_name;
    document.file_name = file_name || document.file_name;
    document.type = type || document.type;

    await document.save();

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error updating sample document:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update sample document.' });
  }
};


exports.deleteSampleDocuments = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({ success: false, message: 'Document ID is required.' });
    }

    // Find the document to delete
    const document = await dmsZohoSampleDocument.findById(document_id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Delete from WorkDrive (best-effort, non-fatal)
    try {
      await deleteFileFromWorkDrive(document.zoho_workdrive_id);
    } catch (wdErr) {
      console.warn('WorkDrive delete failed (non-fatal):', wdErr.message);
    }

    // Also delete the document record from the database
    await dmsZohoSampleDocument.findByIdAndDelete(document_id);

    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting sample document:', error);
    res.status(500).json({ success: false, message: 'Unable to delete the document. Please try again.' });
  }
};


