export interface RequestedReviewMessageDto {
  username: string | null;
  message: string | null;
  addedAt: string | null;
}

export interface RequestedReviewResponseDto {
  externalId: string;
  parentExternalId: string;
  leadId: string;
  requestedBy: string | null;
  requestedTo: string | null;
  status: string | null;
  requestedAt: string | null;
  messages: RequestedReviewMessageDto[];
  participants: string[];
  documentStatus: string | null;
  rejectMessage: string | null;
}
