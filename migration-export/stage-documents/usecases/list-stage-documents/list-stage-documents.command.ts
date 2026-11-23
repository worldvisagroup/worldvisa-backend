import { z } from 'zod';
import { isoDateQuery } from '../../../shared/iso-date-query';
import { pagingQuery } from '../../../shared/paging';

export const STAGE_DOCUMENT_TYPES = ['outcome', 'eoi', 'roi', 'invitation'] as const;

export const listStageDocumentsCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
    type: z.enum(STAGE_DOCUMENT_TYPES).optional(),
    from: isoDateQuery.optional(),
    to: isoDateQuery.optional(),
  })
  .strict()
  .refine(({ from, to }) => !from || !to || from < to, {
    message: '`from` must be earlier than `to`',
    path: ['from'],
  });

export type ListStageDocumentsCommand = z.infer<typeof listStageDocumentsCommand>;
