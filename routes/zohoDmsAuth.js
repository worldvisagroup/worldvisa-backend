const express = require('express');
const zohoDmsAuthController = require('../controllers/zohoDmsAuthController');
const { resetPasswordByLeadId, getAllClients } = require('../controllers/dmsZohoClientController');
const validateSession = require('../middleware/validateSession');

const router = express.Router();

router.post('/signup', zohoDmsAuthController.signup);
router.post('/login', zohoDmsAuthController.login);
router.post('/logout', validateSession, zohoDmsAuthController.logout);
router.get('/validate-session', validateSession, zohoDmsAuthController.validateSessionEndpoint);
router.get("/all", zohoDmsAuthController.getAllUsers);
router.get("/notifications", zohoDmsAuthController.protect, zohoDmsAuthController.getAllNotifications);
router.delete("/remove", zohoDmsAuthController.protect, zohoDmsAuthController.deleteUser);
router.post("/notifications", zohoDmsAuthController.protect, zohoDmsAuthController.addNotification);
router.delete("/notifications", zohoDmsAuthController.protect, zohoDmsAuthController.deleteNotification);

// isRead notification api
router.put("/notifications/read", zohoDmsAuthController.protect, zohoDmsAuthController.updateNotificationIsRead);

// only for master_admin
router.post('/reset', zohoDmsAuthController.protect, zohoDmsAuthController.resetPassword);
router.post('/update_role', zohoDmsAuthController.protect, zohoDmsAuthController.updateUserRole);


// Client Accounts
router.get('/clients', zohoDmsAuthController.protect, getAllClients);
router.put('/clients/reset-password', resetPasswordByLeadId);



module.exports = router;
