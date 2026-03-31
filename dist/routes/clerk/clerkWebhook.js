"use strict";
const express_1 = require("express");
const clerkWebhookController_1 = require("../../controllers/clerk/clerkWebhookController");
const router = (0, express_1.Router)();
router.post('/', clerkWebhookController_1.handleClerkWebhook);
module.exports = router;
