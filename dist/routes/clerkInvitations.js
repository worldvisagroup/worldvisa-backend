"use strict";
const express_1 = require("express");
const clerkInvitationController_1 = require("../controllers/clerkInvitationController");
const { protect } = require('../controllers/zohoDmsAuthController');
const router = (0, express_1.Router)();
router.post('/invite', protect, clerkInvitationController_1.inviteUser);
router.delete('/invite', protect, clerkInvitationController_1.revokeInvitation);
// Explicitly block other HTTP methods so /:id wildcard never catches /invite
router.all('/invite', (_req, res) => {
    res.status(405).json({ status: 'fail', message: 'Method Not Allowed' });
});
module.exports = router;
