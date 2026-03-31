import { Request, Response } from 'express';
export declare const inviteUser: (req: Request, res: Response) => Promise<void>;
export declare const bootstrapInviteUser: (req: Request, res: Response) => Promise<void>;
export declare const inviteClient: (req: Request, res: Response) => Promise<void>;
export declare const revokeInvitation: (req: Request, res: Response) => Promise<void>;
