import { z } from 'zod';
import { isoDateQuery } from '../../../shared/iso-date-query';
import { pagingQuery } from '../../../shared/paging';

export const QUALITY_CHECK_STATUSES = ['pending', 'reviewed'] as const;

// This collection stores the Zoho module names, not the `record_type` values of the other endpoints.
export const QUALITY_CHECK_RECORD_TYPES = ['Visa_Applications', 'Spouse_Skill_Assessment'] as const;

export const listQualityCheckRequestsCommand = z
  .object({
    ...pagingQuery,
    leadId: z.string().min(1).optional(),
    status: z.enum(QUALITY_CHECK_STATUSES).optional(),
    recordType: z.enum(QUALITY_CHECK_RECORD_TYPES).optional(),
    from: isoDateQuery.optional(),
    to: isoDateQuery.optional(),
  })
  .strict()
  .refine(({ from, to }) => !from || !to || from < to, {
    message: '`from` must be earlier than `to`',
    path: ['from'],
  });

export type ListQualityCheckRequestsCommand = z.infer<typeof listQualityCheckRequestsCommand>;
