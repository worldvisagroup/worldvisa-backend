import { Router, Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const multer = require('multer');
import { protect } from '../middleware/clerk/clerkAuth';
import * as gmail               from '../controllers/email/gmailController';
import * as crud                from '../controllers/email/emailCrudController';

const { restrictToAdmin } = require('../controllers/zohoDmsAuthController');

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
});

const listEmailsLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  keyGenerator:    (req: Request) => req.user?.id ? `user:${String(req.user.id)}` : ipKeyGenerator(req.ip ?? 'unknown'),
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests', retryAfter: '60 seconds' },
  skip:            () => process.env.NODE_ENV !== 'production',
});

router.get('/oauth',          gmail.oauthRedirect);
router.get('/oauth/callback', gmail.oauthCallback);

router.post(
  '/sync/gmail',
  // protect,
  // restrictToAdmin as (req: Request, res: Response, next: NextFunction) => void,
  gmail.syncGmailHistory
);

router.post('/send', protect, upload.array('attachments', 10), crud.sendEmail);


router.get('/',                  protect, listEmailsLimiter, crud.listEmails);
router.get('/threads/:threadId', protect, crud.getThreadMessages);
router.patch('/:id/read',        protect, crud.markAsRead);
router.get('/:id/with-thread',   protect, crud.getEmailWithThread);
router.get('/:id',               protect, crud.getEmailById);

export = router;
