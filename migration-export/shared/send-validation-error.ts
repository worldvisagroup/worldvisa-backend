import type { Response } from 'express';
import type { ZodError } from 'zod';

export const sendValidationError = (res: Response, error: ZodError): void => {
  res.status(400).json({
    status: 'fail',
    message: 'Validation failed',
    errors: error.issues,
  });
};
