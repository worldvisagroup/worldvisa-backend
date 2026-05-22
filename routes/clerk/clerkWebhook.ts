import { Router } from 'express';
import { handleClerkWebhook } from '../../controllers/clerk/clerkWebhookController';

const router: Router = Router();

router.post('/', handleClerkWebhook);

export = router;
