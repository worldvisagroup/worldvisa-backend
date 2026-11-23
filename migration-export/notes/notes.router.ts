import { Router } from 'express';
import { listNotesHandler } from './notes.controller';

const router: Router = Router();

router.get('/', listNotesHandler);

export default router;
