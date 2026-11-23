import type { NextFunction, Request, Response } from 'express';
import { sendValidationError } from '../shared/send-validation-error';
import { listQualityCheckRequestsCommand } from './usecases/list-quality-check-requests/list-quality-check-requests.command';
import { listQualityCheckRequests } from './usecases/list-quality-check-requests/list-quality-check-requests.usecase';

export const listQualityCheckRequestsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listQualityCheckRequestsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listQualityCheckRequests(command.data));
  } catch (error) {
    next(error);
  }
};
