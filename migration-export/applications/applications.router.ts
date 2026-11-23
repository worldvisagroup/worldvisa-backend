import { Router } from 'express';
import { listApplicationsHandler } from './applications.controller';

const router: Router = Router();

router.get('/', listApplicationsHandler);

export default router;
