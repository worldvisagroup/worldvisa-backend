const express = require('express');
const dmsZohoClientController = require('../controllers/dmsZohoClientController');
const { protectClient } = require('../controllers/dmsZohoClientController'); // Import protectClient
const dmsZohoDocumentsController = require("../controllers/dmsZohoDocumentsController");
const { getVisaApplication } = require('../controllers/visaApplicationController');
const { protect, addNotificationByClient } = require('../controllers/zohoDmsAuthController');
const validateSession = require('../middleware/validateSession');
const multer = require('multer');
const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });
// only admin can access this
router.get('/all', protect, dmsZohoClientController.getAllClients);

router.post('/signup', protect, dmsZohoClientController.signup);
router.post('/login', dmsZohoClientController.login);
router.post('/logout', validateSession, dmsZohoClientController.logout);
router.get('/validate-session', validateSession, dmsZohoClientController.validateSessionEndpoint);

router.get('/user-exists/:lead_id', dmsZohoClientController.userExistsWithLeadId);

router.put('/update_record_type', dmsZohoClientController.updateRecordType);

router.post('/reset_password', protectClient, dmsZohoClientController.resetPassword);

router.get('/update_psk', protect, dmsZohoClientController.updateAllPasswordsToPhone);

router.get("/application", protectClient, getVisaApplication);

// Upload Document
// The client must send the file with the field name 'file'
router.post('/:record_id/documents', protectClient, upload.array('files'), dmsZohoDocumentsController.uploadDocument);

// Update the Document
router.patch('/:record_id/documents/:document_id', protectClient, upload.array('files'), dmsZohoDocumentsController.updateDocument);

router.get('/documents', protectClient, dmsZohoClientController.getClientDocuments); // Use protectClient
router.get('/documents/:docId', protectClient, dmsZohoDocumentsController.getDocumentDetails); // Use protectClient and new route for file info
router.patch('/documents/:docId/move', protectClient, dmsZohoDocumentsController.moveFile);

router.post('/documents/:docId/rename', protectClient, dmsZohoClientController.renameClientDocument); // New rename route
router.delete('/documents/:docId', protectClient, dmsZohoClientController.deleteClientDocument); // New delete route


// checklist api's
router.get('/checklist', protectClient, dmsZohoClientController.getChecklist) // Get all Cliens Documents

// Update to request the checklist
router.put('/checklist/requested', protectClient, dmsZohoDocumentsController.updateChecklistRequestStatus);

router.post('/notifications', protectClient, addNotificationByClient);

// Admin: Check client account by record_id
router.get('/admin/check/:record_id', protect, dmsZohoClientController.getClientAccountByRecordId);

// Admin: Update client account by record_id
router.patch('/admin/update/:record_id', protect, dmsZohoClientController.updateClientAccountByRecordId);

module.exports = router;

