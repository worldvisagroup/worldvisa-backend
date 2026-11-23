import type { FileLinkDto } from '../../shared/to-file-link';

export interface StageDocumentResponseDto {
  externalId: string;
  leadId: string;
  type: string | null;
  invitationType: string | null;
  fileName: string | null;
  documentName: string | null;
  documentType: string | null;
  outcome: string | null;
  outcomeDate: string | null;
  skillAssessingBody: string | null;
  languageAssessingBody: string | null;
  subclass: string | null;
  state: string | null;
  point: number | null;
  date: string | null;
  deadline: string | null;
  expiryAt: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  file: FileLinkDto | null;
}
