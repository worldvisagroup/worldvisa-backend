import type { NextFunction, Request, Response } from 'express';
import { sendValidationError } from '../shared/send-validation-error';
import { listRequestedReviewsCommand } from './usecases/list-requested-reviews/list-requested-reviews.command';
import { listRequestedReviews } from './usecases/list-requested-reviews/list-requested-reviews.usecase';

export const listRequestedReviewsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const command = listRequestedReviewsCommand.safeParse(req.query);
  if (!command.success) {
    sendValidationError(res, command.error);
    return;
  }

  try {
    res.json(await listRequestedReviews(command.data));
  } catch (error) {
    next(error);
  }
};
