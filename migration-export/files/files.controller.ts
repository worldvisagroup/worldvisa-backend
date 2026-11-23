import type { NextFunction, Request, Response } from 'express';
import { pipeline } from 'node:stream';
import { sendValidationError } from '../shared/send-validation-error';
import { FileStorageUnavailableError } from './usecases/get-file/file-storage';
import { getFileCommand } from './usecases/get-file/get-file.command';
import { getFile } from './usecases/get-file/get-file.usecase';

export const getFileHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = getFileCommand.safeParse({ ...req.params, ...req.query });
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    const file = await getFile(command.data);
    if (!file) {
      res.status(404).json({ error: 'file_gone' });
      return;
    }
    // `attachment()` sets Content-Disposition and the Content-Type from the file extension (octet-stream when unknown).
    res.attachment(file.name ?? 'file');
    if (file.size !== null) {
      res.setHeader('Content-Length', file.size);
    }
    if (file.checksum) {
      res.setHeader('X-Checksum-Sha256', file.checksum);
    }
    pipeline(file.stream, res, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    if (error instanceof FileStorageUnavailableError) {
      res.status(503).json({ status: 'fail', message: error.message });
      return;
    }
    next(error);
  }
};
