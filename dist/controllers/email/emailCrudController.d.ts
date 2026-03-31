import { Request, Response } from 'express';
export declare function listEmails(req: Request, res: Response): Promise<void>;
export declare function getThreadMessages(req: Request, res: Response): Promise<void>;
export declare function getEmailById(req: Request, res: Response): Promise<void>;
export declare function getEmailWithThread(req: Request, res: Response): Promise<void>;
export declare function sendEmail(req: Request, res: Response): Promise<void>;
export declare function markAsRead(req: Request, res: Response): Promise<void>;
