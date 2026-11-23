export type ChatParticipantType = 'client' | 'staff';

export interface ChatParticipantDto {
  type: ChatParticipantType;
  id: string;
}

export interface ChatConversationResponseDto {
  externalId: string;
  participants: ChatParticipantDto[];
  clientLeadId: string | null;
  lastMessageAt: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
}
