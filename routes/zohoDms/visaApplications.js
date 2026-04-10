const express = require("express");
const { restrictToAdmin } = require("../../controllers/zohoDmsAuthController.js");
const { protect, clerkProtect } = require("../../middleware/clerk/clerkAuth");
const {
  getApplicationsWithAttachments,
  getVisaApplicationById,
  getSpouseApplicationsWithAttachments,
  getSpouseVisaApplicationById,
  getApplicationNotes,
  addApplicationNote,
  updateApplicationNote,
  deleteApplicationNote,
} = require("../../controllers/visaApplicationController");
const { downloadVisaActivityLogPdf, downloadSpouseActivityLogPdf } = require("../../controllers/activityLogPdfController");
const { getDeadlineStats } = require('../../controllers/applicationStatsController');
const { getActivityLog } = require('../../controllers/applicationActivityLogController');
const { getAdminDashboardStats } = require('../../controllers/adminDashboardController');
const { getAnalyticsDashboard } = require('../../controllers/zohoDms/analyticsDashboardController');
const dmsZohoDocumentsController = require('../../controllers/dmsZohoDocumentsController');
const adminApprovalRequestController = require('../../controllers/adminApprovalRequestController');
const { requireRole } = require('../../middleware/clerk/clerkAuth');
const multer = require('multer');

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protect, getApplicationsWithAttachments);
router.get('/deadline-stats', protect, getDeadlineStats);
router.get('/search', protect, dmsZohoDocumentsController.searchZohoApplications);
router.get('/global-search', protect, dmsZohoDocumentsController.globalSearch);
// Request Application for Quality Check
router.get('/quality_check', protect, dmsZohoDocumentsController.getQualityCheckApplications);
router.post('/quality_check', protect, dmsZohoDocumentsController.requestQualityCheck);
router.delete('/quality_check/:leadId', protect, dmsZohoDocumentsController.removeRequestQualityCheck);

// Quality Check - MongoDB backed (messages & status)
router.get('/quality_check/:leadId/details', protect, dmsZohoDocumentsController.getQualityCheckByLeadId);
router.patch('/quality_check/:qcId/status', protect, dmsZohoDocumentsController.updateQualityCheckStatus);
router.get('/quality_check/:qcId/messages', protect, dmsZohoDocumentsController.getQualityCheckMessages);
router.post('/quality_check/:qcId/messages', protect, dmsZohoDocumentsController.addQualityCheckMessage);
router.put('/quality_check/:qcId/messages', protect, dmsZohoDocumentsController.updateQualityCheckMessage);
router.delete('/quality_check/:qcId/messages', protect, dmsZohoDocumentsController.deleteQualityCheckMessage);

// Admin Approval Requests
router.post('/admin-approval-requests', protect, adminApprovalRequestController.createRequest);
router.get('/admin-approval-requests', protect, requireRole('master_admin'), adminApprovalRequestController.getRequests);
router.get('/admin-approval-requests/lead/:leadId', protect, adminApprovalRequestController.getRequestsByLead);
router.patch('/admin-approval-requests/:requestId/approve', protect, requireRole('master_admin'), adminApprovalRequestController.approveRequest);
router.patch('/admin-approval-requests/:requestId/reject', protect, requireRole('master_admin'), adminApprovalRequestController.rejectRequest);

router.put('/update_fields', protect, dmsZohoDocumentsController.updateZohoFields);

// Request Checklist
// Get all requested checklist
router.get('/checklist/requested', protect, dmsZohoDocumentsController.getChecklistRequestedApplications);

// Spouse Skill Assessment Applications
router.get('/spouse/applications', protect, getSpouseApplicationsWithAttachments);
router.get('/spouse/applications/search', protect, dmsZohoDocumentsController.searchSpouseZohoApplications);
router.get('/spouse/applications/:id/notes', protect, restrictToAdmin, getApplicationNotes);
router.post('/spouse/applications/:id/notes', protect, restrictToAdmin, addApplicationNote);
router.patch('/spouse/applications/:id/notes/:noteId', protect, restrictToAdmin, updateApplicationNote);
router.delete('/spouse/applications/:id/notes/:noteId', protect, restrictToAdmin, deleteApplicationNote);
router.get('/spouse/applications/:id/activity/download', protect, downloadSpouseActivityLogPdf);
router.get('/spouse/applications/:id', protect, getSpouseVisaApplicationById);

// Admin dashboard stats (must be before /:id)
router.get('/admin/dashboard', protect, getAdminDashboardStats);
router.get('/admin/analytics', protect, getAnalyticsDashboard);

// Admin-only: application notes (must be before /:id)
router.get('/:id/notes', protect, restrictToAdmin, getApplicationNotes);
router.post('/:id/notes', protect, restrictToAdmin, addApplicationNote);
router.patch('/:id/notes/:noteId', protect, restrictToAdmin, updateApplicationNote);
router.delete('/:id/notes/:noteId', protect, restrictToAdmin, deleteApplicationNote);

// Application activity log (must be before /:id)
router.get('/:id/activity', protect, getActivityLog);
router.get('/:id/activity/download', protect, downloadVisaActivityLogPdf);

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
router.get('/documents/:docId/comment', clerkProtect, dmsZohoDocumentsController.getComments);
router.post('/documents/:docId/comment', clerkProtect, dmsZohoDocumentsController.addComment);
router.put('/documents/:docId/comment', clerkProtect, dmsZohoDocumentsController.editComment);
router.delete('/documents/:docId/comment', clerkProtect, dmsZohoDocumentsController.deleteComment);

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

router.get('/documents/:docId/requested_reviews/:reviewId/messages', protect, dmsZohoDocumentsController.allRequestedReviewMessages);

router.post('/documents/:docId/requested_reviews/:reviewId/messages', protect, dmsZohoDocumentsController.addRequestedReviewMessage);

router.put('/documents/:docId/requested_reviews/:reviewId/messages', protect, dmsZohoDocumentsController.updateRequestedReviewMessage);

router.delete('/documents/:docId/requested_reviews/:reviewId/messages', protect, dmsZohoDocumentsController.deleteRequestedReviewMessage);

// Timeline
router.get('/documents/:docId/timeline', dmsZohoDocumentsController.getAllTimeline);

router.post('/documents/:docId/timeline', protect, dmsZohoDocumentsController.addTimelineEntry);


// Delete Document
router.delete('/documents/:docId', dmsZohoDocumentsController.deleteDocument);

// Move Document
router.patch('/documents/:docId/move', protect, dmsZohoDocumentsController.moveFile);
// Document's Moved files
router.get('/documents/:docId/move/all', protect, dmsZohoDocumentsController.getAllMovedDocuments);

// Delete Folder by Record ID
router.delete('/:record_id/folders', dmsZohoDocumentsController.deleteFolderByRecordId);

// Create document exxternal link for file/folder
router.post('/documents/:resource_id/links', protect, dmsZohoDocumentsController.createExternalFileLinks); // Use protectClient and new route for file info

router.get('/documents/:resource_id/links', protect, dmsZohoDocumentsController.getFileLinks); // Use protectClient and new route for file info

module.exports = router;