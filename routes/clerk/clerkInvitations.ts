import { Router } from 'express';
import { bootstrapInviteUser, inviteUser, revokeInvitation } from '../../controllers/clerk/clerkInvitationController';

import { protect } from '../../middleware/clerk/clerkAuth';

const router = Router();

router.post('/bootstrap-invite', bootstrapInviteUser);

router.post('/invite', protect, inviteUser);

router.delete('/invite', protect, revokeInvitation);

// Explicitly block other HTTP methods so /:id wildcard never catches /invite
router.all('/invite', (_req, res) => {
  res.status(405).json({ status: 'fail', message: 'Method Not Allowed' });
});

router.all('/bootstrap-invite', (_req, res) => {
  res.status(405).json({ status: 'fail', message: 'Method Not Allowed' });
});

export = router;
