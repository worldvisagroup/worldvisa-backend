const express = require('express');
const multer = require('multer');
const zohoDmsAuthController = require('../controllers/zohoDmsAuthController');
const { resetPasswordByLeadId, getAllClients } = require('../controllers/dmsZohoClientController');
const { protect } = require('../middleware/clerk/clerkAuth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/signup', zohoDmsAuthController.signup);
router.post('/login', zohoDmsAuthController.login);
router.post('/logout', protect, zohoDmsAuthController.logout);
router.get("/all", zohoDmsAuthController.getAllUsers);
router.get("/notifications", protect, zohoDmsAuthController.getAllNotifications);
router.delete("/remove", protect, zohoDmsAuthController.deleteUser);
router.post("/notifications", protect, zohoDmsAuthController.addNotification);
router.delete("/notifications", protect, zohoDmsAuthController.deleteNotification);

// isRead notification api
router.put("/notifications/read", protect, zohoDmsAuthController.updateNotificationIsRead);

// only for master_admin
router.post('/reset', protect, zohoDmsAuthController.resetPassword);
router.post('/update_role', protect, zohoDmsAuthController.updateUserRole);


// Client Accounts
router.get('/clients', protect, getAllClients);
router.put('/clients/reset-password', resetPasswordByLeadId);



// Profile image upload
router.post('/profile-image', protect, upload.single('image'), zohoDmsAuthController.uploadProfileImage);

// User details by MongoDB _id — must be last to avoid conflicts with named routes
router.get('/:id', protect, zohoDmsAuthController.getUserById);

module.exports = router;
