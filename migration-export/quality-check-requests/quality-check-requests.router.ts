import { Router } from 'express';
import { listQualityCheckRequestsHandler } from './quality-check-requests.controller';

const router: Router = Router();

router.get('/', listQualityCheckRequestsHandler);

export default router;
