import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { STAFF_ROLES, CLIENT_ROLE } from '../../constants/roles';
import { USER_STATUS } from '../../constants/user_status';

const ZohoDmsUser = require('../../models/zohoDmsUser');
const DmsZohoClient = require('../../models/dmsZohoClient');

/** Test bypass via X-Test-Clerk-* headers — only when ENABLE_TEST_BYPASS=true */
function getTestAuth(req: Request): { userId: string; role: string } | null {
  if (process.env.ENABLE_TEST_BYPASS !== 'true') return null;
  const userId = req.headers['x-test-clerk-user-id'] as string | undefined;
  const role   = req.headers['x-test-clerk-role']    as string | undefined;
  return userId && role ? { userId, role } : null;
}

/**
 * Core Clerk auth middleware.
 * Requires clerkMiddleware() mounted globally in app.js upstream.
 * Verifies the session, fetches the matching MongoDB user, and attaches
 * it to req.user for backward compatibility with existing route handlers.
 */
export const clerkProtect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testAuth = getTestAuth(req);
    if (testAuth) {
      req.clerkRole = testAuth.role;
      const dbUser =
        await ZohoDmsUser.findOne({ clerk_id: testAuth.userId }) ??
        await DmsZohoClient.findOne({ clerk_id: testAuth.userId });
      if (dbUser) req.user = dbUser;
      return next();
    }

    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const role = (auth.sessionClaims?.metadata as Record<string, unknown>)?.role as string | undefined;
    req.clerkRole = role;

    // Fetch MongoDB user by clerk_id — keeps req.user populated for all existing route handlers
    const dbUser =
      await ZohoDmsUser.findOne({ clerk_id: auth.userId }) ??
      await DmsZohoClient.findOne({ clerk_id: auth.userId });

    if (!dbUser) {
      res.status(401).json({ status: 'fail', message: 'User not found in database' });
      return;
    }

    // Block suspended / inactive / deleted accounts
    if (
      dbUser.account_status &&
      ![USER_STATUS.ACTIVE, USER_STATUS.INVITED].includes(dbUser.account_status)
    ) {
      res.status(403).json({ status: 'fail', message: 'Account is not active' });
      return;
    }

    req.user = dbUser;
    next();
  } catch {
    res.status(401).json({ status: 'fail', message: 'Authentication error' });
  }
};
export const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = req.clerkRole ?? (req.user as any)?.role;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ status: 'fail', message: 'Insufficient permissions' });
      return;
    }
    next();
  };

/** Allow any staff role */
export const requireStaff = requireRole(...STAFF_ROLES);

/** Allow only the client role */
export const requireClient = requireRole(CLIENT_ROLE);


export const protect       = [clerkProtect, requireStaff];
export const protectClient = [clerkProtect, requireClient];
