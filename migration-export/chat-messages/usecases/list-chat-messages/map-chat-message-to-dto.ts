import { toIsoOrNull } from '../../../shared/iso-date';
import { toFileLink, type StoredFile } from '../../../shared/to-file-link';
import type { ChatParticipantType } from '../../../chat-conversations/dtos/chat-conversation-response.dto';
import type { ChatAttachmentDto, ChatMessageResponseDto } from '../../dtos/chat-message-response.dto';

export interface ChatAttachmentRow {
  url?: string | null;
  name?: string | null;
  contentType?: string | null;
  size?: number | null;
}

export interface ChatMessageRow {
  _id: { toString(): string };
  conversationId: { toString(): string };
  sender: { type: ChatParticipantType; id: { toString(): string } };
  content?: string | null;
  attachments?: ChatAttachmentRow[] | null;
  forwardedFromMessageId?: { toString(): string } | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

/** Explicit allow-list: `deletedAt` is filtered on, never selected; `forwardedFromMessageId` only feeds the `forwarded` flag. */
export const CHAT_MESSAGE_COLUMNS = ['conversationId', 'sender', 'content', 'attachments', 'forwardedFromMessageId', 'createdAt', 'updatedAt'] as const;

/**
 * The old chat stores the public R2 URL of an attachment (`<R2_PUBLIC_URL>/<key>`), or the bare key when no public URL was set.
 * The key is the URL path; the stored URL itself is never returned.
 */
export const toAttachmentKey = (url: string): string => {
  let path = url;
  try {
    path = new URL(url).pathname;
  } catch {
    // not an absolute URL: the value is already the bare key
  }
  const key = path.replace(/^\/+/, '');
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
};

/** An attachment is always an R2 object in the old chat; one without a URL has no file to serve. */
export const toAttachmentStoredFile = ({ url, name }: ChatAttachmentRow): StoredFile =>
  url ? { storage_type: 'r2', r2_key: toAttachmentKey(url), file_name: name || null } : { storage_type: 'r2', file_name: name || null };

const mapAttachment = (fileBaseUrl: string, messageId: string, attachment: ChatAttachmentRow, index: number): ChatAttachmentDto => ({
  name: attachment.name || null,
  contentType: attachment.contentType ?? null,
  size: attachment.size && attachment.size > 0 ? attachment.size : null,
  file: toFileLink(fileBaseUrl, 'chat-messages', messageId, toAttachmentStoredFile(attachment), index),
});

export const mapChatMessageToDto = (fileBaseUrl: string, row: ChatMessageRow): ChatMessageResponseDto => {
  const externalId = row._id.toString();
  return {
    externalId,
    conversationId: row.conversationId.toString(),
    sender: { type: row.sender.type, id: row.sender.id.toString() },
    content: row.content ?? null,
    attachments: (row.attachments ?? []).map((attachment, index) => mapAttachment(fileBaseUrl, externalId, attachment, index)),
    forwarded: Boolean(row.forwardedFromMessageId),
    createdAt: toIsoOrNull(row.createdAt),
    modifiedAt: toIsoOrNull(row.updatedAt),
  };
};
