import { Router } from 'express';
import { listChatConversationsHandler } from './chat-conversations.controller';

const router: Router = Router();

router.get('/', listChatConversationsHandler);

export default router;
