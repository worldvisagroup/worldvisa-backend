import { Request, Response, NextFunction } from 'express';

const AuditLog = require('../models/auditLog');
const logger   = require('../utils/logger');

// Paths to never log (noise / high-frequency probes)
const SKIP_PATHS = new Set(['/health', '/favicon.ico', '/']);

// Body fields to strip before storing
const SENSITIVE_KEYS = new Set([
  'password', 'password_value', 'passwordVal',
  'token', 'access_token', 'refresh_token',
  'HTTP_AUTHORIZATION', 'authorization',
  'secret', 'api_key', 'apiKey',
]);

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    clean[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return clean;
}

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_PATHS.has(req.path)) return next();

  const startedAt = Date.now();

  res.on('finish', () => {
    const duration  = Date.now() - startedAt;
    const user      = (req as any).user;
    const clerkAuth = (req as any).auth;

    setImmediate(async () => {
      try {
        await AuditLog.create({
          method:       req.method,
          path:         req.path,
          status_code:  res.statusCode,
          duration_ms:  duration,
          user_id:      user?._id?.toString()  ?? null,
          user_role:    user?.role             ?? (req as any).clerkRole ?? null,
          clerk_id:     clerkAuth?.userId      ?? user?.clerk_id ?? null,
          ip:           req.ip ?? req.headers['x-forwarded-for'] ?? null,
          user_agent:   req.headers['user-agent'] ?? null,
          request_body: req.method !== 'GET' ? sanitizeBody(req.body) : null,
          error:        res.statusCode >= 400
            ? (res as any).__errorMessage ?? null
            : null,
        });
      } catch (err: any) {
        // Never block the request — audit failure is non-fatal
        logger.warn('[AuditLog] Failed to write entry', { error: err.message });
      }
    });
  });

  next();
}
