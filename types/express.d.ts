import { AuthUser } from './visaApplication.types';

declare global {
  namespace Express {
    interface Request {
      clerkRole?: string;
      user?: AuthUser;
    }
  }
}

export {};
