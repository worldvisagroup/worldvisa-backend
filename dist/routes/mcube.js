"use strict";
const express_1 = require("express");
const mcubeWebhookController_1 = require("../controllers/mcube/mcubeWebhookController");
const mcubeOutboundController_1 = require("../controllers/mcube/mcubeOutboundController");
const callLogController_1 = require("../controllers/mcube/callLogController");
const validateMcubeWebhook_1 = require("../middleware/mcube/validateMcubeWebhook");
const { protect } = require('../middleware/clerk/clerkAuth');
const router = (0, express_1.Router)();
// ── Webhook (no auth — validated via shared secret header) ─────────────────
router.post('/webhook/inbound', validateMcubeWebhook_1.validateMcubeWebhook, mcubeWebhookController_1.handleInboundWebhook);
// ── Outbound call (staff only) ─────────────────────────────────────────────
router.post('/calls/outbound', protect, mcubeOutboundController_1.handleOutboundCall);
// ── Call log history (staff only) ─────────────────────────────────────────
router.get('/call-logs', protect, callLogController_1.listCallLogs);
router.get('/call-logs/:callId', protect, callLogController_1.getCallLogDetail);
module.exports = router;
