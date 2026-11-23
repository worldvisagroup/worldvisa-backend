import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const sha256 = (value: string): Buffer => createHash('sha256').update(value).digest();

export const requireMigrationApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const expected = process.env.MIGRATION_EXPORT_API_KEY;
  if (!expected) {
    res.status(503).json({ status: 'fail', message: 'Migration export is not configured' });
    return;
  }

  const provided = req.header('x-api-key') ?? '';
  if (!timingSafeEqual(sha256(provided), sha256(expected))) {
    res.status(401).json({ status: 'fail', message: 'Invalid or missing API key' });
    return;
  }
  next();
};
