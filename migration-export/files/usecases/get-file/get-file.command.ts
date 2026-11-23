import { z } from 'zod';

export const FILE_SOURCES = ['documents', 'moved-documents', 'stage-documents', 'chat-messages'] as const;

/** A chat message can hold several attachments, so its link carries the attachment position; no other source takes one. */
const INDEXED_SOURCE = 'chat-messages';

export const getFileCommand = z
  .object({
    source: z.enum(FILE_SOURCES),
    externalId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'externalId must be a 24-character ObjectId'),
    index: z.coerce.number().int().min(0).optional(),
    checksum: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
  })
  .strict()
  .superRefine(({ source, index }, context) => {
    if (source === INDEXED_SOURCE && index === undefined) {
      context.addIssue({ code: 'custom', path: ['index'], message: '`index` is required for chat-messages' });
    }
    if (source !== INDEXED_SOURCE && index !== undefined) {
      context.addIssue({ code: 'custom', path: ['index'], message: '`index` is only allowed for chat-messages' });
    }
  });

export type GetFileCommand = z.infer<typeof getFileCommand>;
