import { Request, Response, NextFunction } from 'express';
/**
 * Core Clerk auth middleware.
 * Requires clerkMiddleware() mounted globally in app.js upstream.
 * Verifies the session, fetches the matching MongoDB user, and attaches
 * it to req.user for backward compatibility with existing route handlers.
 */
export declare const clerkProtect: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/** Allow any staff role */
export declare const requireStaff: (req: Request, res: Response, next: NextFunction) => void;
/** Allow only the client role */
export declare const requireClient: (req: Request, res: Response, next: NextFunction) => void;
export declare const protect: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const protectClient: ((req: Request, res: Response, next: NextFunction) => void)[];
