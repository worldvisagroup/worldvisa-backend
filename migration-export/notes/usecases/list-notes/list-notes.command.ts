import { z } from 'zod';
import { pagingQuery } from '../../../shared/paging';
import { RECORD_TYPES } from '../../../shared/record-type';

export const listNotesCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
    recordType: z.enum(RECORD_TYPES).optional(),
  })
  .strict();

export type ListNotesCommand = z.infer<typeof listNotesCommand>;
