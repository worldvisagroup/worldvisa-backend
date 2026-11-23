import { Router } from 'express';
import { listRequestedReviewsHandler } from './requested-reviews.controller';

const router: Router = Router();

router.get('/', listRequestedReviewsHandler);

export default router;
