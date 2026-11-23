import { z } from 'zod';
import { pagingQuery } from '../../../shared/paging';

export const listMovedDocumentsCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
  })
  .strict();

export type ListMovedDocumentsCommand = z.infer<typeof listMovedDocumentsCommand>;
