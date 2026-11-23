export interface QualityCheckMessageDto {
  username: string;
  message: string;
  addedAt: string | null;
}

export interface QualityCheckRequestResponseDto {
  externalId: string;
  leadId: string;
  recordType: string;
  requestedBy: string;
  requestedTo: string;
  status: string;
  requestedAt: string | null;
  messages: QualityCheckMessageDto[];
  migrated: boolean;
  createdAt: string | null;
  modifiedAt: string | null;
}
