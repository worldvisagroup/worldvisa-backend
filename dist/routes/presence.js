"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clerkAuth_1 = require("../middleware/clerk/clerkAuth");
const presenceService_1 = require("../services/presenceService");
const router = (0, express_1.Router)();
/**
 * POST /api/zoho_dms/presence/bulk
 *
 * Fetch current presence for a list of user IDs in a single request.
 * Intended for initial page loads before the WebSocket connection is established.
 *
 * Body:  { userIds: string[] }
 * Returns: { status: 'success', data: { presences: Record<userId, { status, lastSeen }> } }
 */
router.post('/bulk', clerkAuth_1.clerkProtect, async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ status: 'fail', message: 'userIds must be a non-empty array' });
            return;
        }
        const capped = userIds.slice(0, 100);
        const presences = await (0, presenceService_1.getBulkPresence)(capped);
        res.status(200).json({ status: 'success', data: { presences } });
    }
    catch (err) {
        res.status(500).json({ status: 'fail', message: err.message || 'Failed to fetch presence' });
    }
});
exports.default = router;
