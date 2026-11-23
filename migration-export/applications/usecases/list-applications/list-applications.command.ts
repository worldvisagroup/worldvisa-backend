import { z } from 'zod';
import { isoDateQuery } from '../../../shared/iso-date-query';
import { pagingQuery } from '../../../shared/paging';
import { RECORD_TYPES } from '../../../shared/record-type';

export const listApplicationsCommand = z
  .object({
    ...pagingQuery,
    recordType: z.enum(RECORD_TYPES).optional(),
    from: isoDateQuery.optional(),
    to: isoDateQuery.optional(),
  })
  .strict()
  .refine(({ from, to }) => !from || !to || from < to, {
    message: '`from` must be earlier than `to`',
    path: ['from'],
  });

export type ListApplicationsCommand = z.infer<typeof listApplicationsCommand>;
