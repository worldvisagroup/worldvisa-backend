import { Request, Response } from 'express';
export declare function oauthRedirect(req: Request, res: Response): void;
export declare function oauthCallback(req: Request, res: Response): Promise<void>;
export declare function syncGmailHistory(req: Request, res: Response): Promise<void>;
