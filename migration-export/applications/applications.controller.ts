import type { NextFunction, Request, Response } from 'express';
import { handleZohoError } from '../shared/handle-zoho-error';
import { sendValidationError } from '../shared/send-validation-error';
import { listApplicationsCommand } from './usecases/list-applications/list-applications.command';
import { listApplications } from './usecases/list-applications/list-applications.usecase';

export const listApplicationsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listApplicationsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listApplications(command.data));
  } catch (error) {
    handleZohoError(error, res, next);
  }
};
