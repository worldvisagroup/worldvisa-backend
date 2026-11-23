import type { NextFunction, Request, Response } from 'express';
import { getFileBaseUrl } from '../shared/file-base-url';
import { sendValidationError } from '../shared/send-validation-error';
import { listDocumentsCommand } from './usecases/list-documents/list-documents.command';
import { listDocuments } from './usecases/list-documents/list-documents.usecase';

export const listDocumentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listDocumentsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listDocuments(command.data, getFileBaseUrl(req)));
  } catch (error) {
    next(error);
  }
};
