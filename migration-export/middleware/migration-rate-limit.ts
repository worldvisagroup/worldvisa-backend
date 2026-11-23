import rateLimit from 'express-rate-limit';

export const REQUESTS_PER_MINUTE = 60;

export const migrationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: REQUESTS_PER_MINUTE,
  keyGenerator: () => 'migration-export',
  standardHeaders: false,
  legacyHeaders: true,
  message: { status: 'fail', message: 'Rate limit exceeded, retry after the reset time' },
});
