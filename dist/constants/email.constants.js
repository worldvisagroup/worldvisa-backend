"use strict";
// ── Pagination / size limits ──────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_LIST_HEAVY_EXCLUDE = exports.VALID_PROVIDERS = exports.VALID_EMAIL_TYPES = exports.VALID_DIRECTIONS = exports.GMAIL_SYNC_COOLDOWN_SEC = exports.GMAIL_SYNC_REDIS_KEY = exports.GMAIL_SCOPE = exports.UNREAD_CACHE_TTL = exports.UNREAD_CACHE_KEY = exports.MAX_ATTACHMENT_BYTES = exports.MAX_ATTACHMENTS = exports.MAX_THREAD_MESSAGES = exports.MAX_EMAIL_LIMIT = exports.DEFAULT_EMAIL_LIMIT = void 0;
exports.DEFAULT_EMAIL_LIMIT = 20;
exports.MAX_EMAIL_LIMIT = 50;
exports.MAX_THREAD_MESSAGES = 100;
exports.MAX_ATTACHMENTS = 10;
exports.MAX_ATTACHMENT_BYTES = 26214400; // 25 MB
// ── Redis cache ───────────────────────────────────────────────────────────────
exports.UNREAD_CACHE_KEY = 'email:unread:total';
exports.UNREAD_CACHE_TTL = 60; // seconds
// ── Gmail ─────────────────────────────────────────────────────────────────────
exports.GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
exports.GMAIL_SYNC_REDIS_KEY = 'gmail:sync:lock';
exports.GMAIL_SYNC_COOLDOWN_SEC = 300; // 5 minutes
// ── Valid enum values (used in filter validation) ─────────────────────────────
exports.VALID_DIRECTIONS = ['inbound', 'outbound'];
exports.VALID_EMAIL_TYPES = ['system', 'agent', 'client'];
exports.VALID_PROVIDERS = ['resend', 'gmail'];
// ── Mongoose $project stage — strips heavy fields before $group ───────────────
// Prevents html/text (10–50 KB each) from passing through the grouping stage.
exports.EMAIL_LIST_HEAVY_EXCLUDE = { html: 0, text: 0, headers: 0 };
