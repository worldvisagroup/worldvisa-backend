'use strict';

const express = require('express');
const { protect, restrictToAdmin } = require('../controllers/zohoDmsAuthController');
const emailController = require('../controllers/emailController');

const router = express.Router();

// Webhook is registered on app before express.json() in app.js at POST /api/email/webhook/resend.

// One-time OAuth flow to obtain GMAIL_REFRESH_TOKEN
router.get('/oauth', emailController.oauthRedirect);
router.get('/oauth/callback', emailController.oauthCallback);

// Gmail sync: admin-only, optional cooldown
router.post('/sync/gmail', protect, restrictToAdmin, emailController.syncGmailHistory);

module.exports = router;
