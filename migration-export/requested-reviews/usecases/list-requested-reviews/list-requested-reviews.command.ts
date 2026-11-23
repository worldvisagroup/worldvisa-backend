import { z } from 'zod';
import { pagingQuery } from '../../../shared/paging';

export const listRequestedReviewsCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
  })
  .strict();

export type ListRequestedReviewsCommand = z.infer<typeof listRequestedReviewsCommand>;
