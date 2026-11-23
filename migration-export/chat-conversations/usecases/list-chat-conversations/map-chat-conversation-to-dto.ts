import { toIsoOrNull } from '../../../shared/iso-date';
import type { ChatConversationResponseDto, ChatParticipantType } from '../../dtos/chat-conversation-response.dto';

export interface ChatParticipantRow {
  type: ChatParticipantType;
  id: { toString(): string };
}

export interface ChatConversationRow {
  _id: { toString(): string };
  participants: ChatParticipantRow[];
  lastMessageAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

/** Explicit allow-list: name, description, image, creator and archive flags are never selected. */
export const CHAT_CONVERSATION_COLUMNS = ['participants', 'lastMessageAt', 'createdAt', 'updatedAt'] as const;

/** `leadIdByClientId` maps a client record id to its `lead_id`; a client record that no longer exists is simply absent. */
export const mapChatConversationToDto = (
  row: ChatConversationRow,
  leadIdByClientId: ReadonlyMap<string, string>
): ChatConversationResponseDto => {
  const participants = row.participants.map(({ type, id }) => ({ type, id: id.toString() }));
  const client = participants.find(({ type }) => type === 'client');

  return {
    externalId: row._id.toString(),
    participants,
    clientLeadId: client ? (leadIdByClientId.get(client.id) ?? null) : null,
    lastMessageAt: toIsoOrNull(row.lastMessageAt),
    createdAt: toIsoOrNull(row.createdAt),
    modifiedAt: toIsoOrNull(row.updatedAt),
  };
};
