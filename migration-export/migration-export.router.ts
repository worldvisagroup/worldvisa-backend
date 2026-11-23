import { Router } from 'express';
import applicationsRouter from './applications/applications.router';
import chatConversationsRouter from './chat-conversations/chat-conversations.router';
import chatMessagesRouter from './chat-messages/chat-messages.router';
import checklistItemsRouter from './checklist-items/checklist-items.router';
import deadlineExtensionsRouter from './deadline-extensions/deadline-extensions.router';
import documentsRouter from './documents/documents.router';
import filesRouter from './files/files.router';
import { migrationRateLimit } from './middleware/migration-rate-limit';
import { requireMigrationApiKey } from './middleware/require-migration-api-key';
import movedDocumentsRouter from './moved-documents/moved-documents.router';
import notesRouter from './notes/notes.router';
import qualityCheckRequestsRouter from './quality-check-requests/quality-check-requests.router';
import requestedReviewsRouter from './requested-reviews/requested-reviews.router';
import stageDocumentsRouter from './stage-documents/stage-documents.router';
import zohoRouter from './zoho/zoho.router';

const router: Router = Router();

router.use(requireMigrationApiKey, migrationRateLimit);

router.use('/applications', applicationsRouter);
router.use('/chat-conversations', chatConversationsRouter);
router.use('/chat-messages', chatMessagesRouter);
router.use('/checklist-items', checklistItemsRouter);
router.use('/deadline-extensions', deadlineExtensionsRouter);
router.use('/documents', documentsRouter);
router.use('/files', filesRouter);
router.use('/moved-documents', movedDocumentsRouter);
router.use('/notes', notesRouter);
router.use('/quality-check-requests', qualityCheckRequestsRouter);
router.use('/requested-reviews', requestedReviewsRouter);
router.use('/stage-documents', stageDocumentsRouter);
router.use('/zoho', zohoRouter);

export default router;
