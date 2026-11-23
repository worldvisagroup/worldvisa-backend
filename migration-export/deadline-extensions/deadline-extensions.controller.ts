import type { NextFunction, Request, Response } from 'express';
import { sendValidationError } from '../shared/send-validation-error';
import { listDeadlineExtensionsCommand } from './usecases/list-deadline-extensions/list-deadline-extensions.command';
import { listDeadlineExtensions } from './usecases/list-deadline-extensions/list-deadline-extensions.usecase';

export const listDeadlineExtensionsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listDeadlineExtensionsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listDeadlineExtensions(command.data));
  } catch (error) {
    next(error);
  }
};
