import type { NextFunction, Response } from 'express';
import { ZohoUnavailableError } from './zoho-read-client';

/** Zoho being unreachable or rate limited is a retry (503); anything else goes to the app's error handler. */
export const handleZohoError = (error: unknown, res: Response, next: NextFunction): void => {
  if (error instanceof ZohoUnavailableError) {
    res.status(503).json({ status: 'fail', message: error.message });
    return;
  }
  next(error);
};
