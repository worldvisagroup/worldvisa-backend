const express = require("express");
const { protect } = require("../../controllers/zohoDmsAuthController.js");
const {
  getApplicationsWithAttachments,
  getVisaApplicationById,
  getSpouseApplicationsWithAttachments,
  getSpouseVisaApplicationById,
} = require("../../controllers/visaApplicationController.js");
const { getDeadlineStats } = require('../../controllers/applicationStatsController');
const dmsZohoDocumentsController = require('../../controllers/dmsZohoDocumentsController');
const multer = require('multer');

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protect, getApplicationsWithAttachments);
router.get('/deadline-stats', protect, getDeadlineStats);
router.get('/search', protect, dmsZohoDocumentsController.searchZohoApplications);
// Request Application for Quality Check
router.get('/quality_check', protect, dmsZohoDocumentsController.getQualityCheckApplications);
router.post('/quality_check', protect, dmsZohoDocumentsController.requestQualityCheck);
router.delete('/quality_check/:leadId', protect, dmsZohoDocumentsController.removeRequestQualityCheck);
router.put('/update_fields', protect, dmsZohoDocumentsController.updateZohoFields);

// Request Checklist
// Get all requested checklist
router.get('/checklist/requested', protect, dmsZohoDocumentsController.getChecklistRequestedApplications);

// Spouse Skill Assessment Applications
router.get('/spouse/applications', protect, getSpouseApplicationsWithAttachments);
router.get('/spouse/applications/search', protect, dmsZohoDocumentsController.searchSpouseZohoApplications);
router.get('/spouse/applications/:id', protect, getSpouseVisaApplicationById);

// Application Field Update:Patch route
router.get("/:id", protect, getVisaApplicationById);

// DMS Zoho Documents Routes

// Get all Moved Documents
router.get('/:record_id/moved', protect, dmsZohoDocumentsController.allMovedFiles);

// ------------------ Sample Documents --------------------------------------
router.get('/:record_id/sample', dmsZohoDocumentsController.getAllSampleDocuments);

router.post('/:record_id/sample', protect, upload.array('files'), dmsZohoDocumentsController.uploadSampleDocuments);

router.put('/:record_id/sample/:document_id', protect, dmsZohoDocumentsController.updateSampleDocuments);

router.delete('/:record_id', protect, upload.array('files'), dmsZohoDocumentsController.deleteSampleDocuments);

// ---------------- Australia Stage 2 Documents ------------------------------
router.get('/:record_id/aus-stage2-documents', dmsZohoDocumentsController.getAusStage2Documents);

router.post('/:record_id/aus-stage2-documents', protect, upload.array('files'), dmsZohoDocumentsController.uploadAusStage2Document);

router.patch('/:record_id/aus-stage2-documents/:id', protect, dmsZohoDocumentsController.updateAusStage2Document);

router.delete('/:record_id/aus-stage2-documents/:id', protect, dmsZohoDocumentsController.deleteAusStage2Document);

// List Documents
router.get('/:record_id/documents', dmsZohoDocumentsController.listDocuments);

// ZIP Export endpoints
router.post('/:record_id/documents/download/all', protect, dmsZohoDocumentsController.downloadAllFiles); // Create ZIP export job
router.get('/:record_id/documents/download/all/status/:job_id', protect, dmsZohoDocumentsController.getZipExportStatus); // Get job status
router.delete('/:record_id/documents/download/all/:job_id', protect, dmsZohoDocumentsController.cancelZipExport); // Cancel job

router.get('/:record_id/documents/download/test', protect, dmsZohoDocumentsController.downloadSampleFile);

router.get('/:record_id/documents/reviewed', protect, dmsZohoDocumentsController.getDocumentByReviewUsername);

// Upload Document
// The client must send the file with the field name 'file'
router.post('/:record_id/documents', protect, upload.array('files'), dmsZohoDocumentsController.uploadDocument);

// Update the Document
router.patch('/:record_id/documents/:document_id', protect, upload.array('files'), dmsZohoDocumentsController.updateDocument);

// Checklist
router.get('/checklist/:record_id', protect, dmsZohoDocumentsController.getChecklist);

router.post('/checklist/:record_id', protect, dmsZohoDocumentsController.addChecklist);

router.put('/checklist/:record_id', protect, dmsZohoDocumentsController.editChecklist);

router.delete('/checklist/:record_id', protect, dmsZohoDocumentsController.deleteChecklist);

// Get Document details
router.get('/documents/:docId', dmsZohoDocumentsController.getDocumentDetails);

// Update Status
router.patch('/documents/:docId/status', dmsZohoDocumentsController.updateStatus);

// Get all Comments
router.get('/documents/:docId/comment', dmsZohoDocumentsController.getComments);

// Add Comment
router.post('/documents/:docId/comment', dmsZohoDocumentsController.addComment);

// Edit Comment
router.put('/documents/:docId/comment', dmsZohoDocumentsController.editComment);

// Delete Comment
router.delete('/documents/:docId/comment', dmsZohoDocumentsController.deleteComment);

// Requested Reviews
router.get('/documents/requested_reviews/all_to', protect, dmsZohoDocumentsController.getAllRequestedToReview);

router.get('/documents/requested_reviews/all_me', protect, dmsZohoDocumentsController.getAllRequestedFromReview);

router.get('/documents/requested_reviews/all', protect, dmsZohoDocumentsController.getAllRequestedReview);

router.get('/documents/requested_reviews/search', protect, dmsZohoDocumentsController.searchRequestedReviewDocuments);

// Requested Revviews
router.get('/documents/:docId/requested_reviews', dmsZohoDocumentsController.getRequestedReviewsByDocId);

router.post('/documents/:docId/requested_reviews', dmsZohoDocumentsController.addRequestedReviews);

router.put('/documents/:docId/requested_reviews', dmsZohoDocumentsController.editRequestedReview);

router.delete('/documents/:docId/requested_reviews', dmsZohoDocumentsController.deleteRequestedReview);

// Requested Review Messages

router.get('/documents/:docId/requested_reviews/:reviewId/messages', dmsZohoDocumentsController.allRequestedReviewMessages);

router.post('/documents/:docId/requested_reviews/:reviewId/messages', protect, dmsZohoDocumentsController.addRequestedReviewMessage);

router.put('/documents/:docId/requested_reviews/:reviewId/messages', protect, dmsZohoDocumentsController.updateRequestedReviewMessage);

router.delete('/documents/:docId/requested_reviews/:reviewId/messages', protect, dmsZohoDocumentsController.deleteRequestedReviewMessage);

// Timeline
router.get('/documents/:docId/timeline', protect, dmsZohoDocumentsController.getAllTimeline);

router.post('/documents/:docId/timeline', protect, dmsZohoDocumentsController.addTimelineEntry);


// Delete Document
router.delete('/documents/:docId', dmsZohoDocumentsController.deleteDocument);

// Move Document
router.patch('/documents/:docId/move', protect, dmsZohoDocumentsController.moveFile);
// Document's Moved files
router.get('/documents/:docId/move/all', dmsZohoDocumentsController.getAllMovedDocuments);

// Delete Folder by Record ID
router.delete('/:record_id/folders', dmsZohoDocumentsController.deleteFolderByRecordId);

// Create document exxternal link for file/folder
router.post('/documents/:resource_id/links', protect, dmsZohoDocumentsController.createExternalFileLinks); // Use protectClient and new route for file info

router.get('/documents/:resource_id/links', protect, dmsZohoDocumentsController.getFileLinks); // Use protectClient and new route for file info

module.exports = router;