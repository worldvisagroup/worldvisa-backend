"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectClient = exports.protect = exports.requireClient = exports.requireStaff = exports.requireRole = exports.clerkProtect = void 0;
const express_1 = require("@clerk/express");
const roles_1 = require("../../constants/roles");
const user_status_1 = require("../../constants/user_status");
const ZohoDmsUser = require('../../models/zohoDmsUser');
const DmsZohoClient = require('../../models/dmsZohoClient');
/** Test bypass via X-Test-Clerk-* headers — only when ENABLE_TEST_BYPASS=true */
function getTestAuth(req) {
    if (process.env.ENABLE_TEST_BYPASS !== 'true')
        return null;
    const userId = req.headers['x-test-clerk-user-id'];
    const role = req.headers['x-test-clerk-role'];
    return userId && role ? { userId, role } : null;
}
/**
 * Core Clerk auth middleware.
 * Requires clerkMiddleware() mounted globally in app.js upstream.
 * Verifies the session, fetches the matching MongoDB user, and attaches
 * it to req.user for backward compatibility with existing route handlers.
 */
const clerkProtect = async (req, res, next) => {
    try {
        const testAuth = getTestAuth(req);
        if (testAuth) {
            req.clerkRole = testAuth.role;
            const dbUser = await ZohoDmsUser.findOne({ clerk_id: testAuth.userId }) ??
                await DmsZohoClient.findOne({ clerk_id: testAuth.userId });
            if (dbUser)
                req.user = dbUser;
            return next();
        }
        const auth = (0, express_1.getAuth)(req);
        if (!auth.userId) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const role = auth.sessionClaims?.metadata?.role;
        req.clerkRole = role;
        // Fetch MongoDB user by clerk_id — keeps req.user populated for all existing route handlers
        const dbUser = await ZohoDmsUser.findOne({ clerk_id: auth.userId }) ??
            await DmsZohoClient.findOne({ clerk_id: auth.userId });
        if (!dbUser) {
            res.status(401).json({ status: 'fail', message: 'User not found in database' });
            return;
        }
        // Block suspended / inactive / deleted accounts
        if (dbUser.account_status &&
            ![user_status_1.USER_STATUS.ACTIVE, user_status_1.USER_STATUS.INVITED].includes(dbUser.account_status)) {
            res.status(403).json({ status: 'fail', message: 'Account is not active' });
            return;
        }
        req.user = dbUser;
        next();
    }
    catch {
        res.status(401).json({ status: 'fail', message: 'Authentication error' });
    }
};
exports.clerkProtect = clerkProtect;
const requireRole = (...roles) => (req, res, next) => {
    const role = req.clerkRole ?? req.user?.role;
    if (!role || !roles.includes(role)) {
        res.status(403).json({ status: 'fail', message: 'Insufficient permissions' });
        return;
    }
    next();
};
exports.requireRole = requireRole;
/** Allow any staff role */
exports.requireStaff = (0, exports.requireRole)(...roles_1.STAFF_ROLES);
/** Allow only the client role */
exports.requireClient = (0, exports.requireRole)(roles_1.CLIENT_ROLE);
exports.protect = [exports.clerkProtect, exports.requireStaff];
exports.protectClient = [exports.clerkProtect, exports.requireClient];
