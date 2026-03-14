'use strict';

const express = require('express');
const multer = require('multer');
const { protect, restrictToAdmin } = require('../controllers/zohoDmsAuthController');
const emailController = require('../controllers/emailController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

// Webhook is registered on app before express.json() in app.js at POST /api/email/webhook/resend.

// One-time OAuth flow to obtain GMAIL_REFRESH_TOKEN
router.get('/oauth', emailController.oauthRedirect);
router.get('/oauth/callback', emailController.oauthCallback);

// Gmail sync: admin-only, optional cooldown
router.post('/sync/gmail', protect, restrictToAdmin, emailController.syncGmailHistory);

// Send email from frontend (with optional attachments)
router.post('/send', protect, upload.array('attachments', 10), emailController.sendEmail);

// List (one per thread), thread messages, single email, email + thread (order: more specific first)
router.get('/', protect, emailController.listEmails);
router.get('/threads/:threadId', protect, emailController.getThreadMessages);
router.patch('/:id/read', protect, emailController.markAsRead);
router.get('/:id/with-thread', protect, emailController.getEmailWithThread);
router.get('/:id', protect, emailController.getEmailById);

module.exports = router;
