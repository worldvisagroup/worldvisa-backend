import type { Request } from 'express';

/** Matches `app.use('/api/migration', ...)`; `trust proxy` is set, so protocol and host follow the public URL. */
export const getFileBaseUrl = (req: Request): string => `${req.protocol}://${req.get('host')}/api/migration`;
