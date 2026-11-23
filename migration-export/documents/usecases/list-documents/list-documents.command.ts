import { z } from 'zod';
import { pagingQuery } from '../../../shared/paging';

export const DOCUMENT_STATUSES = ['pending', 'reviewed', 'request_review', 'approved', 'rejected'] as const;

export const listDocumentsCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
    status: z.enum(DOCUMENT_STATUSES).optional(),
  })
  .strict();

export type ListDocumentsCommand = z.infer<typeof listDocumentsCommand>;
