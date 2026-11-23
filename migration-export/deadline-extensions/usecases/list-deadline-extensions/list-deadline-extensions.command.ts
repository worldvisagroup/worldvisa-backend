import { z } from 'zod';
import { pagingQuery } from '../../../shared/paging';
import { RECORD_TYPES } from '../../../shared/record-type';

export const DEADLINE_EXTENSION_KINDS = ['approved', 'request'] as const;
export const REQUEST_STATUSES = ['pending', 'approved', 'rejected'] as const;

export const listDeadlineExtensionsCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
    recordType: z.enum(RECORD_TYPES).optional(),
    kind: z.enum(DEADLINE_EXTENSION_KINDS).optional(),
    status: z.enum(REQUEST_STATUSES).optional(),
  })
  .strict()
  .refine(({ kind, status }) => !(kind === 'approved' && status), {
    message: 'status only applies to kind=request',
    path: ['status'],
  });

export type ListDeadlineExtensionsCommand = z.infer<typeof listDeadlineExtensionsCommand>;
