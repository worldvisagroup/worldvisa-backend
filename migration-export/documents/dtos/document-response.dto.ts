import type { FileLinkDto } from '../../shared/to-file-link';

export interface DocumentHistoryEntryDto {
  status: string | null;
  changedBy: string | null;
  changedAt: string | null;
}

export interface DocumentCommentDto {
  comment: string | null;
  addedBy: string | null;
  documentLink: string | null;
  addedAt: string | null;
}

export interface DocumentResponseDto {
  externalId: string;
  leadId: string;
  fileName: string | null;
  documentName: string | null;
  documentType: string | null;
  documentCategory: string | null;
  description: string | null;
  status: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
  history: DocumentHistoryEntryDto[];
  comments: DocumentCommentDto[];
  file: FileLinkDto | null;
}
