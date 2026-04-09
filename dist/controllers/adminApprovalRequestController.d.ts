import type { Request, Response } from 'express';
export declare function createRequest(req: Request, res: Response): Promise<void>;
export declare function getRequests(req: Request, res: Response): Promise<void>;
/**
 * GET /admin-approval-requests/lead/:leadId
 * Any staff — returns all requests for a given lead with profile enrichment.
 */
export declare function getRequestsByLead(req: Request, res: Response): Promise<void>;
/**
 * PATCH /admin-approval-requests/:requestId/approve
 * master_admin only — pushes the change to Zoho, then marks approved.
 */
export declare function approveRequest(req: Request, res: Response): Promise<void>;
/**
 * PATCH /admin-approval-requests/:requestId/reject
 * master_admin only — rejects the request with an optional reason.
 */
export declare function rejectRequest(req: Request, res: Response): Promise<void>;
