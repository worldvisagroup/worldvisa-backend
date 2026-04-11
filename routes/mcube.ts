import { Router } from 'express';
import { handleInboundWebhook } from '../controllers/mcube/mcubeWebhookController';
import { handleOutboundCall }   from '../controllers/mcube/mcubeOutboundController';
import { listCallLogs, getCallLogDetail } from '../controllers/mcube/callLogController';
import { validateMcubeWebhook } from '../middleware/mcube/validateMcubeWebhook';

const { protect } = require('../middleware/clerk/clerkAuth');

const router = Router();

// ── Webhook (no auth — validated via shared secret header) ─────────────────
router.post('/webhook/inbound', validateMcubeWebhook, handleInboundWebhook);

// ── Outbound call (staff only) ─────────────────────────────────────────────
router.post('/calls/outbound', protect, handleOutboundCall);

// ── Call log history (staff only) ─────────────────────────────────────────
router.get('/call-logs',           protect, listCallLogs);
router.get('/call-logs/:callId',   protect, getCallLogDetail);

export = router;
