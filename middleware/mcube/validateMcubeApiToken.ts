import { Request, Response, NextFunction } from 'express';

const logger = require('../../utils/logger');

function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ? match[1].trim() : null;
}

export function validateMcubeApiToken(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.MCUBE_API_TOKEN;
  if (!expected) {
    logger.error('[MCube] MCUBE_API_TOKEN not set — rejecting');
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const incoming = getBearerToken(req.headers.authorization);
  if (!incoming || incoming !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
