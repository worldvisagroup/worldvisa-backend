const express = require('express');
const dmsZohoClientController = require('../controllers/dmsZohoClientController');
const dmsZohoDocumentsController = require("../controllers/dmsZohoDocumentsController");
const { getVisaApplication } = require('../controllers/visaApplicationController');
const { addNotificationByClient } = require('../controllers/zohoDmsAuthController');
const { apiKeyMiddleware } = require('../utils/helperFunction');
const { inviteClient } = require('../controllers/clerk/clerkInvitationController');
const {
  getClientProfile,
  updateClientProfile,
  presignClientProfileImageUpload,
  commitClientProfileImage,
} = require('../controllers/clientProfileController');
const { protect, protectClient } = require('../middleware/clerk/clerkAuth');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get('/all', protect, dmsZohoClientController.getAllClients);

router.post('/signup', apiKeyMiddleware, dmsZohoClientController.signup);
router.post('/invite', protect, inviteClient);
router.post('/login', dmsZohoClientController.login);
router.post('/logout', protectClient, dmsZohoClientController.logout);
router.post('/reset_password', protectClient, dmsZohoClientController.resetPassword);

router.get('/user-exists/:lead_id', dmsZohoClientController.userExistsWithLeadId);
router.put('/update_record_type', dmsZohoClientController.updateRecordType);
router.get('/update_psk', protect, dmsZohoClientController.updateAllPasswordsToPhone);

router.get("/application", protectClient, getVisaApplication);

router.post('/:record_id/documents', protectClient, upload.array('files'), dmsZohoDocumentsController.uploadDocument);
router.patch('/:record_id/documents/:document_id', protectClient, upload.array('files'), dmsZohoDocumentsController.updateDocument);

router.get('/documents', protectClient, dmsZohoClientController.getClientDocuments);
router.get('/documents/:docId', protectClient, dmsZohoDocumentsController.getDocumentDetails);
router.patch('/documents/:docId/move', protectClient, dmsZohoDocumentsController.moveFile);

router.post('/documents/:docId/rename', protectClient, dmsZohoClientController.renameClientDocument);
router.delete('/documents/:docId', protectClient, dmsZohoClientController.deleteClientDocument);

router.get('/checklist', protectClient, dmsZohoClientController.getChecklist)
router.put('/checklist/requested', protectClient, dmsZohoDocumentsController.updateChecklistRequestStatus);

router.post('/notifications', protectClient, addNotificationByClient);

router.get('/admin/check/:record_id', protect, dmsZohoClientController.getClientAccountByRecordId);
router.patch('/admin/update/:record_id', protect, dmsZohoClientController.updateClientAccountByRecordId);

router.get('/sync/lead-owner', protect, dmsZohoClientController.checkAndSyncLeadOwner);

router.post('/webhook/update-lead-owner', apiKeyMiddleware, dmsZohoClientController.updateLeadOwnerFromZoho);

router.get('/profile/:lead_id',   protect, getClientProfile);
router.patch('/profile/:lead_id', protect, updateClientProfile);
router.post('/profile/:lead_id/profile-image/presign', protect, presignClientProfileImageUpload);
router.post('/profile/:lead_id/profile-image/commit', protect, commitClientProfileImage);

router.get('/:id', protect, dmsZohoClientController.getClientById);


module.exports = router;

