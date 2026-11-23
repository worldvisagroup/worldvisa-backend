import { Router } from 'express';
import { listDeadlineExtensionsHandler } from './deadline-extensions.controller';

const router: Router = Router();

router.get('/', listDeadlineExtensionsHandler);

export default router;
