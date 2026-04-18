import type { Request, Response } from 'express';
export declare function createRequest(req: Request, res: Response): Promise<void>;
export declare function getRequests(req: Request, res: Response): Promise<void>;
export declare function getRequestsByLead(req: Request, res: Response): Promise<void>;
export declare function approveRequest(req: Request, res: Response): Promise<void>;
export declare function rejectRequest(req: Request, res: Response): Promise<void>;
