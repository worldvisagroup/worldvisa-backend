import { Router } from 'express';
import { handleInboundWebhook }  from '../controllers/mcube/mcubeWebhookController';
import { handleOutboundCall }    from '../controllers/mcube/mcubeOutboundController';
import { validateMcubeWebhook }  from '../middleware/mcube/validateMcubeWebhook';

const { protect } = require('../middleware/clerk/clerkAuth');

const router = Router();


router.post('/webhook/inbound', validateMcubeWebhook, handleInboundWebhook);

router.post('/calls/outbound', protect, handleOutboundCall);

export = router;
