import { Router } from 'express';
import { handleInboundWebhook } from '../controllers/mcube/mcubeWebhookController';
import { handleOutboundCall }   from '../controllers/mcube/mcubeOutboundController';

const { mcubeApiKeyMiddleware }    = require('../utils/helperFunction');
const { protect }                  = require('../middleware/clerk/clerkAuth');

const router = Router();

/**
 * MCube Telecom inbound webhook.
 * MCube POSTs here on both "On Call" and "On Hangup" events.
 * Authenticated by API key header (api-key / x-api-key = API_KEY_MCUBE).
 * Responds 200 immediately — processing is async to not block MCube's delivery.
 */
router.post('/webhook/inbound', mcubeApiKeyMiddleware, handleInboundWebhook);

/**
 * Internal endpoint to initiate an outbound call via MCube API.
 * Staff only — requires a valid Clerk session.
 */
router.post('/calls/outbound', protect, handleOutboundCall);

export = router;
