import { Router } from 'express';
import { listChatMessagesHandler } from './chat-messages.controller';

const router: Router = Router();

router.get('/', listChatMessagesHandler);

export default router;
