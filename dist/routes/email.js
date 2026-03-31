"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
const express_1 = require("express");
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const multer = require('multer');
const clerkAuth_1 = require("../middleware/clerk/clerkAuth");
const gmail = __importStar(require("../controllers/email/gmailController"));
const crud = __importStar(require("../controllers/email/emailCrudController"));
const { restrictToAdmin } = require('../controllers/zohoDmsAuthController');
const router = (0, express_1.Router)();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});
const listEmailsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id ? `user:${String(req.user.id)}` : (0, express_rate_limit_1.ipKeyGenerator)(req.ip ?? 'unknown'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests', retryAfter: '60 seconds' },
    skip: () => process.env.NODE_ENV !== 'production',
});
router.get('/oauth', gmail.oauthRedirect);
router.get('/oauth/callback', gmail.oauthCallback);
router.post('/sync/gmail', clerkAuth_1.protect, restrictToAdmin, gmail.syncGmailHistory);
router.post('/send', clerkAuth_1.protect, upload.array('attachments', 10), crud.sendEmail);
router.get('/', clerkAuth_1.protect, listEmailsLimiter, crud.listEmails);
router.get('/threads/:threadId', clerkAuth_1.protect, crud.getThreadMessages);
router.patch('/:id/read', clerkAuth_1.protect, crud.markAsRead);
router.get('/:id/with-thread', clerkAuth_1.protect, crud.getEmailWithThread);
router.get('/:id', clerkAuth_1.protect, crud.getEmailById);
module.exports = router;
