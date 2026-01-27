const dmsZohoDocument = require('../models/dmsZohoDocument');
const dmsZohoLeadFolder = require('../models/dmsZohoLeadFolder');
const DmsZohoClient = require('../models/dmsZohoClient');
const dmsZohoAusStage2Documents = require("../models/dmsZohoAusStage2Documents");
const dmsZohoSampleDocument = require("../models/dmsZohoSampleDocument");
const { getdmsZohoLeadFolderId, uploadFileToWorkDrive, deleteFileFromWorkDrive, getFileLinks, createFileLinks, downloadAllFilesInZip, moveFileToSpecificFolder } = require('../utils/dmsZohoWorkDrive');
const multer = require('multer');
const { zohoRequest } = require('./zohoDms/zohoApi');
const { addNotificationAndEmit } = require('./helper/service/notifications');
const ZohoDmsUser = require('../models/zohoDmsUser');
const { MODULE_VISA_APPLICATION, MODULE_SPOUSE_SKILL_ASSESSMENT, REQ_MODULE_VISA_APPLICATION, REQ_MODULE_SPOUSE_SKILL_ASSESSMENT } = require('./helper/constants');
const { updateRecentActivity, addToTimeline, addMovedFiles } = require('./helper/service/functions');
const { getAccessToken, refreshAccessToken } = require('./zohoDms/zohoAuth');
const DmsMovedDocuments = require('../models/movedDocuments');
const { capitalizeFn } = require('../utils/helperFunction');

// Configure Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

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

// list documents by


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

    const workdriveFolderId = await getdmsZohoLeadFolderId(record_id);

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype } = file;
      const workdriveFile = await uploadFileToWorkDrive(workdriveFolderId, originalname, buffer, mimetype);
      const externalLinkData = await createFileLinks(workdriveFile);

      const doc = await dmsZohoDocument.create({
        record_id,
        workdrive_file_id: workdriveFile,
        workdrive_parent_id: workdriveFolderId,
        file_name: file_name || originalname,
        document_name,
        document_category,
        uploaded_by: uploaded_by || 'Unknown',
        status: 'pending',
        history: [{ status: 'pending', changed_by: uploaded_by || 'Unknown' }],
        document_link: externalLinkData.data.attributes.link,
        download_url: externalLinkData.data.attributes.download_url,
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

      const clientData = await DmsZohoClient.findOne({ lead_id: record_id });

      if (!clientData && !clientData?.record_type) {
        throw new Error("clientData not found");
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
      // await updateRecentActivity(zohoRequest, moduleName, clientData.lead_id)
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
            message: `${user.name} uploaded ${document_name}`,
            category: "document",
            applicationType: moduleName
          });
        }
      };

      return doc;
    });

    const uploadedDocuments = await Promise.all(uploadPromises);

    res.status(201).json({ success: true, data: uploadedDocuments });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload documents.' });
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

    // Delete existing document from WorkDrive
    await moveFileToSpecificFolder(document.workdrive_file_id);

    // Add the document to dmsMovedDocuments collection
    await DmsMovedDocuments.create({
      document_id: document._id,
      record_id: document.record_id,
      file_name: document.file_name,
      file_id: document.workdrive_file_id,
      moved_by: user && user?.name ? user.name : user.username || 'Unknown'
    });
    const workdriveFolderId = document.workdrive_parent_id;

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype } = file;
      const workdriveFile = await uploadFileToWorkDrive(workdriveFolderId, originalname, buffer, mimetype);
      const externalLinkData = await createFileLinks(workdriveFile);

      // Update document details
      document.workdrive_file_id = workdriveFile;
      document.file_name = file_name || originalname;
      document.document_name = document_name;
      document.document_category = document_category;
      document.uploaded_by = uploaded_by || 'Unknown';
      document.status = 'pending';
      document.history.push({ status: 'pending', changed_by: uploaded_by || 'Unknown' });
      document.document_link = externalLinkData.data.attributes.link;
      document.download_url = externalLinkData.data.attributes.download_url;
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

      const clientData = await DmsZohoClient.findOne({ lead_id: document.record_id });

      let moduleName = MODULE_VISA_APPLICATION;

      if (document?.record_id) {
        if (clientData.record_type === REQ_MODULE_VISA_APPLICATION) {
          moduleName = MODULE_VISA_APPLICATION;
        } else if (clientData.record_type === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
          moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
        } else {
          moduleName = MODULE_VISA_APPLICATION;
        }
      }

      await updateRecentActivity(zohoRequest, moduleName, clientData.lead_id);

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
            message: `${user.name} re uploaded ${document.document_name}`,
            category: "document",
            applicationType: moduleName
          });
        }
      }
    });

    await Promise.all(uploadPromises);

    res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update document.' });
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

    res.status(200).json({ success: true, data: document });
  } catch (error) {

    res.status(500).json({ success: false, message: 'Failed to update document status.' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await dmsZohoDocument.findById(docId).select('comments').lean();
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.status(200).json({ success: true, data: document.comments ?? [] });
  } catch (error) {
    console.error('Error retrieving comments from document:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve comments.' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { docId } = req.params;
    const { comment, added_by } = req.body;

    const document = await dmsZohoDocument.findOneAndUpdate(
      { _id: docId },
      { $push: { comments: { comment, added_by: added_by || 'Unknown' } } },
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
      await updateRecentActivity(zohoRequest, moduleName, document?.record_id);
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

    // Delete from Zoho WorkDrive
    await deleteFileFromWorkDrive(document.workdrive_file_id);

    // Delete from MongoDB
    await dmsZohoDocument.findByIdAndDelete(docId);

    res.status(204).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
};

/**
 * Move a file in Zoho WorkDrive to a specific folder and update the document in MongoDB.
 * Expects: req.params.docId (document id), req.body.destinationFolderId (WorkDrive folder id)
 */
exports.moveFile = async (req, res) => {
  try {
    const user = req.user;
    const { docId } = req.params;
    // Find the document in MongoDB
    const document = await dmsZohoDocument.findById(docId);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Move the file in Zoho WorkDrive
    await moveFileToSpecificFolder(document.workdrive_file_id);

    // Add the document to dmsMovedDocuments collection
    await DmsMovedDocuments.create({
      document_id: document._id,
      record_id: document.record_id,
      file_name: document.file_name,
      file_id: document.workdrive_file_id,
      moved_by: user && user?.name ? user.name : user.username || 'Unknown'
    });

    // Delete from MongoDB
    await dmsZohoDocument.findByIdAndDelete(docId);

    res.status(204).json({ success: true, message: 'Document moved and deleted successfully.' });
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to move file.' });
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

    // 2. Delete all associated files from Zoho WorkDrive
    const documentsToDelete = await dmsZohoDocument.find({ record_id });
    for (const doc of documentsToDelete) {
      await deleteFileFromWorkDrive(doc.workdrive_file_id);
    }

    // 3. Delete the corresponding entry from dmsZohoLeadFolder collection
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

    if (!username) {
      return res.status(400).json({
        code: 'INVALID_QUERY',
        details: { expected_data_type: 'bigint', column_name: 'id' },
        message: 'value given seems to be invalid for the column',
        status: 'error'
      });
    }

    const selectQuery = `select Name, Email, Phone, Created_Time, Application_Handled_By, Quality_Check_From, DMS_Application_Status, Record_Type from Visa_Applications where Quality_Check_From like ${username} `;

    const response = await zohoRequest('coql', 'POST', { select_query: selectQuery });

    const selectSpouseQuery = `select Name, Email, Phone, Created_Time, Application_Handled_By, Quality_Check_From, DMS_Application_Status, Main_Applicant, Record_Type from Spouse_Skill_Assessment where Quality_Check_From like ${username} `

    const spouseResponse = await zohoRequest('coql', 'POST', { select_query: selectSpouseQuery });

    const data = [
      ...(response.data || []),
      ...(spouseResponse.data || [])
    ];

    if (data.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({ success: true, data: data });

  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({ success: false, message: 'Failed to get applications of quality check.' });
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
      await addNotificationAndEmit({ req, leadId: leadId, userId: userDetails._id, message: `Application Requested for Quality Check by ${user.username} `, category: "quality check", applicationType: moduleName })

      // Update recent activity with current date
      await updateRecentActivity(zohoRequest, moduleName, leadId);
    }

    if (!userDetails) {
      return res.status(404).json({ success: false, message: 'User not found in dmsUserTable.' });
    }

    if (response.data) {
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
      return res.status(200).json({ success: true, message: 'Quality check removed successfully.' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to remove quality check.' });
    }
  } catch (error) {
    console.error('Error in requestQualityCheck controller');
    return res.status(500).json({ success: false, message: 'An error occurred while requesting quality check.' });
  }
};

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
        // send the Notification to the lead owner
        await addNotificationAndEmit({
          req,
          leadId: req.user.lead_id,
          userId: leadOwnerUser._id,
          message: `${req.user.name || "Unknown"} has requested Checklist`,
          category: "requested checklist",
          applicationType: moduleName
        })
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
        await updateRecentActivity(zohoRequest, moduleName, user.lead_id)
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
    await updateRecentActivity(zohoRequest, moduleName, leadId);

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
    let whereClause =
      whereParts.length > 0
        ? `where(${whereParts.join(' and ')})`
        : '';

    // Filters by Application_State, Qualified_Country, Application_Stage and Service_Finalized
    const filterByActiveApplications = ` and((((Application_State = 'Active')`;
    const filterByCountryFinalised = ` and(Qualified_Country = 'Australia'))`;
    const filterByApplicationApprovedStage = `and(Application_Stage in ('Stage 1 Documentation: Approved', 'Stage 1 Documentation: Rejected', 'Stage 1 Milestone Completed', 'Stage 1 Documentation Reviewed', 'Skill Assessment Stage', 'Language Test', 'Lodge Application 1', 'Lodge Application 2', 'Lodge Application 3', 'Lodge Application 4','INIVITATION TO APPLY', 'Invitation to Apply', 'Invitation to Apply 2', 'VA Application Lodge', 'Stage 3 Documentation: Approved', 'Stage 3 Visa Application')))`;
    const filterByServiceFinalised = ` and(Service_Finalized = 'Permanent Residency'))`

    // Active Applications
    whereClause += filterByActiveApplications;

    // Qualified Country
    whereClause += filterByCountryFinalised;

    // Service Finalised
    whereClause += filterByServiceFinalised;

    // Application Approved Stage
    whereClause += filterByApplicationApprovedStage;

    // Build full COQL query
    const selectQuery = `select Name, Email, Phone, Created_Time, Application_Handled_By, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Application_Stage from Visa_Applications ${whereClause} `;

    // Make COQL API request (POST)
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

exports.searchSpouseZohoApplications = async (req, res) => {
  try {
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
      await updateRecentActivity(zohoRequest, moduleName, user.lead_id);
    }

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

    user.checklist.splice(checklistIndex, 1);
    await user.save();

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
    const { page = 1, limit = 10, requested_by, requested_to, status } = req.query;
    const skip = (page - 1) * limit;

    // Build match conditions for filtering
    const matchConditions = { 'requested_reviews.requested_to': username };
    if (requested_by) matchConditions['requested_reviews.requested_by'] = requested_by;
    if (requested_to) matchConditions['requested_reviews.requested_to'] = requested_to;
    if (status) matchConditions['requested_reviews.status'] = status;

    // Use aggregation pipeline with $facet to get both data and count in single query
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
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
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
    const { page = 1, limit = 10, requested_to, status } = req.query;
    const skip = (page - 1) * limit;

    // Use aggregation pipeline with $facet to get both data and count in single query
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
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
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
    const { page = 1, limit = 10, requested_by, requested_to, status } = req.query;
    const skip = (page - 1) * limit;

    // Build match conditions for filtering
    const matchConditions = { 'requested_reviews.0': { $exists: true } };

    // Use aggregation pipeline with $facet to get both data and count in single query
    const result = await dmsZohoDocument.aggregate([
      { $match: matchConditions },
      { $unwind: '$requested_reviews' },
      { 
        $match: {
          ...(requested_by && { 'requested_reviews.requested_by': requested_by }),
          ...(requested_to && { 'requested_reviews.requested_to': requested_to }),
          ...(status && { 'requested_reviews.status': status })
        }
      },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
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
    console.error('Error fetching all requested reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching all requested reviews.'
    });
  }
};


exports.searchRequestedReviewDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, document_name, document_category } = req.query;
    const skip = (page - 1) * limit;

    // Build match conditions for document search
    const matchConditions = {};
    if (document_name) {
      matchConditions.document_name = { $regex: document_name, $options: 'i' };
    }
    if (document_category) {
      matchConditions.document_category = { $regex: document_category, $options: 'i' };
    }
    // Only include documents that have requested reviews
    matchConditions['requested_reviews.0'] = { $exists: true };

    // Use aggregation pipeline with $facet to get both data and count in single query
    const result = await dmsZohoDocument.aggregate([
      { $match: matchConditions },
      { $unwind: '$requested_reviews' },
      {
        $facet: {
          data: [
            {
              $project: {
                _id: 1,
                record_id: 1,
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

    document.requested_reviews.push({ requested_by, requested_to, messages, status: 'pending', requested_at: new Date() });

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
        await addNotificationAndEmit({
          req,
          leadId: document?.record_id,
          userId: requestedToUser._id,
          message: `${requested_by} has requested to review ${document.document_name} document`,
          category: "request review",
          applicationType: moduleName
        })
      }

      try {
        if (document?.record_id) {
          // Update Recent Activity
          await updateRecentActivity(zohoRequest, moduleName, document?.record_id)
        }
      } catch (error) {
        // throw new Error(`Error Occured while updating recent activity: ${ error } `);
        return res.status(500).json({
          status: 'error',
          message: `Error Occured while updating recent activity: ${error} `,
        });
      }
    }

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

    if (requested_by !== undefined) review.requested_by = requested_by;
    if (requested_to !== undefined) review.requested_to = requested_to;
    if (messages !== undefined) review.messages = messages;
    if (status !== undefined) review.status = status;

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

    res.status(200).json({
      status: 'success',
      data: review.messages,
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
          message: `${review.requested_to} has sent you a message: ${message} `,
          leadId: document.record_id,
          documentId: document._id,
          documentName: document?.document_name,
          category: "admin message",
          applicationType: moduleName
        })
      }
    } else if (username === review.requested_by) {
      // Send Notification to the lead owner once message is added
      const leadOwnerUsername = review.requested_to;

      if (leadOwnerUsername) {
        const user = await ZohoDmsUser.findOne({ username: leadOwnerUsername });

        await addNotificationAndEmit({
          req,
          userId: user._id,
          message: `${review.requested_by} has sent you a message: ${message} `,
          leadId: document.record_id,
          documentId: document._id,
          documentName: document?.document_name,
          category: "admin message",
          applicationType: moduleName
        })
      }
    }

    if (document?.record_id) {
      // Update Recent Activity
      await updateRecentActivity(zohoRequest, moduleName, document.record_id)
    }

    res.status(200).json({
      status: 'success',
      data: review.messages,
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

exports.downloadAllFiles = async (req, res) => {
  try {
    const { record_id } = req.params;

    if (!record_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'record_id not provided.',
      });
    }

    const document = await dmsZohoDocument.findOne({ record_id });

    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    if (!document.workdrive_parent_id) {
      return res.status(404).json({
        status: 'fail',
        message: "No documents or folder doesn't exist in WorkDrive.",
      });
    }

    // Get the download link for all files in a zip
    let downloadedZip;
    try {
      downloadedZip = await downloadAllFilesInZip(document.workdrive_parent_id);
      if (!downloadedZip || !downloadedZip.download_link) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to get download link from WorkDrive.',
        });
      }
    } catch (err) {
      console.error('Error getting download link from WorkDrive:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to get download link from WorkDrive.',
      });
    }

    // Get Zoho access token
    let accessToken;
    try {
      accessToken = await getAccessToken();
      if (!accessToken) {
        return res.status(500).json({
          status: 'error',
          message: 'Unable to get Zoho access token.',
        });
      }
    } catch (err) {
      console.error('Error getting Zoho access token:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Unable to get Zoho access token.',
      });
    }

    // Stream the file from Zoho to the client
    try {
      const axios = require('axios');
      const response = await axios.get(downloadedZip.download_link, {
        headers: {
          Authorization: `Zoho - oauthtoken ${accessToken} `,
        },
        responseType: 'stream',
      });

      // Try to extract filename from headers or fallback
      let filename = 'documents.zip';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      res.setHeader('Content-Disposition', `attachment; filename = "${filename}"`);
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');

      response.data.pipe(res);
    } catch (error) {
      console.error('Error streaming file from Zoho:', error);
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred while downloading the file.',
      });
    }
  } catch (error) {
    console.error('Unexpected error in downloadAllFiles:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred.',
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
    const timeline = document.timeline || [];

    return res.status(200).json({
      status: 'success',
      timeline,
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
 * Get a document that has been moved (i.e., has a non-empty moved_files array) by document_id.
 * Returns the document's document_id and moved_files info.
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

    // Get moved files from the MovedDocument collection for the given document_id
    const movedFiles = await DmsMovedDocuments.find({ document_id: docId });

    res.status(200).json({
      status: 'success',
      moved_files: movedFiles || []
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
    const { file_name, document_name, document_type, uploaded_by, type, outcome_date, subclass, state, point, deadline, date, outcome, skill_assessing_body } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    if (!document_name || !document_type) {
      return res.status(400).json({ success: false, message: 'Document name and type are required.' });
    }

    const workdriveFolderId = await getdmsZohoLeadFolderId(record_id);

    const uploadPromises = req.files.map(async (file) => {
      const { originalname, buffer, mimetype } = file;

      const workdriveFile = await uploadFileToWorkDrive(workdriveFolderId, originalname, buffer, mimetype);
      const externalLinkData = await createFileLinks(workdriveFile);

      const doc = await dmsZohoAusStage2Documents.create({
        record_id,
        workdrive_file_id: workdriveFile,
        workdrive_parent_id: workdriveFolderId,
        file_name: file_name || originalname,
        document_name,
        document_type,
        uploaded_by: uploaded_by || 'Unknown',
        download_url: externalLinkData.data.attributes.download_url,
        document_link: externalLinkData.data.attributes.link,
        type: type,
        ...(outcome && { outcome }),
        ...(outcome_date && { outcome_date }),
        ...(subclass && { subclass }),
        ...(state && { state }),
        ...(point && { point }),
        ...(deadline && { deadline }),
        ...(date && { date }),
        ...(skill_assessing_body && { skill_assessing_body })
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
    const { file_name, document_name, document_type, uploaded_by, outcome_date, subclass, state, point, deadline, date, outcome, skill_assessing_body } = req.body;

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

    // Delete from Zoho WorkDrive
    await deleteFileFromWorkDrive(document.workdrive_file_id);

    // Delete the document from MongoDB
    await dmsZohoAusStage2Documents.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete document.' });
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

    // Delete from WorkDrive
    await deleteFileFromWorkDrive(document.zoho_workdrive_id);

    // Also delete the document record from the database
    await dmsZohoSampleDocument.findByIdAndDelete(document_id);

    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error deleting sample document:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete sample document.' });
  }
};


