import { z } from 'zod';
import { isoDateQuery } from '../../../shared/iso-date-query';
import { pagingQuery } from '../../../shared/paging';

export const listChatMessagesCommand = z
  .object({
    ...pagingQuery,
    conversationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'conversationId must be a 24-character ObjectId').optional(),
    from: isoDateQuery.optional(),
    to: isoDateQuery.optional(),
  })
  .strict()
  .refine(({ from, to }) => !from || !to || from < to, {
    message: '`from` must be earlier than `to`',
    path: ['from'],
  });

export type ListChatMessagesCommand = z.infer<typeof listChatMessagesCommand>;
