import { Router } from 'express';
import { getFileHandler } from './files.controller';

const router: Router = Router();

router.get('/:source/:externalId', getFileHandler);

export default router;
