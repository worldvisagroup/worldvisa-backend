import type { NextFunction, Request, Response } from 'express';
import { getFileBaseUrl } from '../shared/file-base-url';
import { sendValidationError } from '../shared/send-validation-error';
import { listMovedDocumentsCommand } from './usecases/list-moved-documents/list-moved-documents.command';
import { listMovedDocuments } from './usecases/list-moved-documents/list-moved-documents.usecase';

export const listMovedDocumentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listMovedDocumentsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listMovedDocuments(command.data, getFileBaseUrl(req)));
  } catch (error) {
    next(error);
  }
};
