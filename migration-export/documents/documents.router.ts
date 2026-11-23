import { Router } from 'express';
import { listDocumentsHandler } from './documents.controller';

const router: Router = Router();

router.get('/', listDocumentsHandler);

export default router;
