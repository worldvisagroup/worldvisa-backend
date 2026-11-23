import type { NextFunction, Request, Response } from 'express';
import { getFileBaseUrl } from '../shared/file-base-url';
import { sendValidationError } from '../shared/send-validation-error';
import { listChatMessagesCommand } from './usecases/list-chat-messages/list-chat-messages.command';
import { listChatMessages } from './usecases/list-chat-messages/list-chat-messages.usecase';

export const listChatMessagesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listChatMessagesCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listChatMessages(command.data, getFileBaseUrl(req)));
  } catch (error) {
    next(error);
  }
};
