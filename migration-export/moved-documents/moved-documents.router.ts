import { Router } from 'express';
import { listMovedDocumentsHandler } from './moved-documents.controller';

const router: Router = Router();

router.get('/', listMovedDocumentsHandler);

export default router;
