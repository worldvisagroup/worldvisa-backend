import type { FileLinkDto } from '../../shared/to-file-link';
import type { ChatParticipantDto } from '../../chat-conversations/dtos/chat-conversation-response.dto';

export interface ChatAttachmentDto {
  name: string | null;
  contentType: string | null;
  size: number | null;
  file: FileLinkDto | null;
}

export interface ChatMessageResponseDto {
  externalId: string;
  conversationId: string;
  sender: ChatParticipantDto;
  content: string | null;
  attachments: ChatAttachmentDto[];
  forwarded: boolean;
  createdAt: string | null;
  modifiedAt: string | null;
}
