"use strict";
const express_1 = require("express");
const clerkInvitationController_1 = require("../../controllers/clerk/clerkInvitationController");
const clerkAuth_1 = require("../../middleware/clerk/clerkAuth");
const router = (0, express_1.Router)();
router.post('/bootstrap-invite', clerkInvitationController_1.bootstrapInviteUser);
router.post('/invite', clerkAuth_1.protect, clerkInvitationController_1.inviteUser);
router.delete('/invite', clerkAuth_1.protect, clerkInvitationController_1.revokeInvitation);
// Explicitly block other HTTP methods so /:id wildcard never catches /invite
router.all('/invite', (_req, res) => {
    res.status(405).json({ status: 'fail', message: 'Method Not Allowed' });
});
router.all('/bootstrap-invite', (_req, res) => {
    res.status(405).json({ status: 'fail', message: 'Method Not Allowed' });
});
module.exports = router;
