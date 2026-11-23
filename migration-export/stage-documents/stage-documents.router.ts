import { Router } from 'express';
import { listStageDocumentsHandler } from './stage-documents.controller';

const router: Router = Router();

router.get('/', listStageDocumentsHandler);

export default router;
