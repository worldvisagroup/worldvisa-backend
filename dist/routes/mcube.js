"use strict";
const express_1 = require("express");
const mcubeWebhookController_1 = require("../controllers/mcube/mcubeWebhookController");
const mcubeOutboundController_1 = require("../controllers/mcube/mcubeOutboundController");
const callLogController_1 = require("../controllers/mcube/callLogController");
const leadOwnersController_1 = require("../controllers/mcube/leadOwnersController");
const validateMcubeWebhook_1 = require("../middleware/mcube/validateMcubeWebhook");
const { protect } = require('../middleware/clerk/clerkAuth');
const router = (0, express_1.Router)();
// ── Webhook (no auth — validated via shared secret header) ─────────────────
router.post('/webhook/inbound', validateMcubeWebhook_1.validateMcubeWebhook, mcubeWebhookController_1.handleInboundWebhook);
// ── Outbound call (staff only) ─────────────────────────────────────────────
router.post('/calls/outbound', protect, mcubeOutboundController_1.handleOutboundCall);
// ── Lead owners (MCube agent list — validated via shared secret) ───────────
router.get('/lead-owners', validateMcubeWebhook_1.validateMcubeWebhook, leadOwnersController_1.listLeadOwners);
router.post('/lead-owner', validateMcubeWebhook_1.validateMcubeWebhook, leadOwnersController_1.getLeadOwnerByPhone);
// ── Call log history (staff only) ─────────────────────────────────────────
router.get('/call-logs', protect, callLogController_1.listCallLogs);
router.get('/call-logs/:callId', protect, callLogController_1.getCallLogDetail);
router.patch('/call-logs/:callId/notes', protect, callLogController_1.updateCallNotes);
module.exports = router;
