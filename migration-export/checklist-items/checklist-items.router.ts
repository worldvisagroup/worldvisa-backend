import { Router } from 'express';
import { listChecklistItemsHandler } from './checklist-items.controller';

const router: Router = Router();

router.get('/', listChecklistItemsHandler);

export default router;
