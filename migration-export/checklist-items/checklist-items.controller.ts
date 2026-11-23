import type { NextFunction, Request, Response } from 'express';
import { sendValidationError } from '../shared/send-validation-error';
import { listChecklistItemsCommand } from './usecases/list-checklist-items/list-checklist-items.command';
import { listChecklistItems } from './usecases/list-checklist-items/list-checklist-items.usecase';

export const listChecklistItemsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listChecklistItemsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listChecklistItems(command.data));
  } catch (error) {
    next(error);
  }
};
