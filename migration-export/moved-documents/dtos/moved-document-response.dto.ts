import type { FileLinkDto } from '../../shared/to-file-link';

export interface MovedDocumentResponseDto {
  externalId: string;
  leadId: string;
  documentExternalId: string;
  fileName: string | null;
  movedBy: string | null;
  movedAt: string | null;
  moveKind: 'full_move' | 'reupload_archive' | null;
  file: FileLinkDto | null;
}
