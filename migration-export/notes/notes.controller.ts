import type { NextFunction, Request, Response } from 'express';
import { sendValidationError } from '../shared/send-validation-error';
import { listNotesCommand } from './usecases/list-notes/list-notes.command';
import { listNotes } from './usecases/list-notes/list-notes.usecase';

export const listNotesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listNotesCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listNotes(command.data));
  } catch (error) {
    next(error);
  }
};
