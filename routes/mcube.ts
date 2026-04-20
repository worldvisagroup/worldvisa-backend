import { Router } from 'express';
import { handleInboundWebhook } from '../controllers/mcube/mcubeWebhookController';
import { handleOutboundCall }   from '../controllers/mcube/mcubeOutboundController';
import { listCallLogs, getCallLogDetail, updateCallNotes } from '../controllers/mcube/callLogController';
import { listLeadOwners } from '../controllers/mcube/leadOwnersController';
import { validateMcubeWebhook } from '../middleware/mcube/validateMcubeWebhook';

const { protect } = require('../middleware/clerk/clerkAuth');

const router = Router();

// ── Webhook (no auth — validated via shared secret header) ─────────────────
router.post('/webhook/inbound', validateMcubeWebhook, handleInboundWebhook);

// ── Outbound call (staff only) ─────────────────────────────────────────────
router.post('/calls/outbound', protect, handleOutboundCall);

// ── Lead owners (MCube agent list — validated via shared secret) ───────────
router.get('/lead-owners', validateMcubeWebhook, listLeadOwners);

// ── Call log history (staff only) ─────────────────────────────────────────
router.get('/call-logs',                  protect, listCallLogs);
router.get('/call-logs/:callId',          protect, getCallLogDetail);
router.patch('/call-logs/:callId/notes',  protect, updateCallNotes);

export = router;
