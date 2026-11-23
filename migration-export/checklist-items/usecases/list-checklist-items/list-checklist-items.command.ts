import { z } from 'zod';
import { pagingQuery } from '../../../shared/paging';
import { RECORD_TYPES } from '../../../shared/record-type';

export const listChecklistItemsCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
    recordType: z.enum(RECORD_TYPES).optional(),
  })
  .strict();

export type ListChecklistItemsCommand = z.infer<typeof listChecklistItemsCommand>;
