import type { NextFunction, Request, Response } from 'express';
import { sendValidationError } from '../shared/send-validation-error';
import { listChatConversationsCommand } from './usecases/list-chat-conversations/list-chat-conversations.command';
import { listChatConversations } from './usecases/list-chat-conversations/list-chat-conversations.usecase';

export const listChatConversationsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listChatConversationsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listChatConversations(command.data));
  } catch (error) {
    next(error);
  }
};
