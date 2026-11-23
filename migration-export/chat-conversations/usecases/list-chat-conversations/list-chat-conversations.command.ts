import { z } from 'zod';
import { isoDateQuery } from '../../../shared/iso-date-query';
import { pagingQuery } from '../../../shared/paging';

export const listChatConversationsCommand = z
  .object({
    ...pagingQuery,
    from: isoDateQuery.optional(),
    to: isoDateQuery.optional(),
  })
  .strict()
  .refine(({ from, to }) => !from || !to || from < to, {
    message: '`from` must be earlier than `to`',
    path: ['from'],
  });

export type ListChatConversationsCommand = z.infer<typeof listChatConversationsCommand>;
