import type { NextFunction, Request, Response } from 'express';
import { getFileBaseUrl } from '../shared/file-base-url';
import { sendValidationError } from '../shared/send-validation-error';
import { listStageDocumentsCommand } from './usecases/list-stage-documents/list-stage-documents.command';
import { listStageDocuments } from './usecases/list-stage-documents/list-stage-documents.usecase';

export const listStageDocumentsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listStageDocumentsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listStageDocuments(command.data, getFileBaseUrl(req)));
  } catch (error) {
    next(error);
  }
};
