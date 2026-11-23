import type { DocumentResponseDto } from '../../dtos/document-response.dto';
import { toIsoOrNull } from '../../../shared/iso-date';
import { toFileLink, type StoredFile } from '../../../shared/to-file-link';

export interface DocumentRow extends StoredFile {
  _id: { toString(): string };
  record_id: string;
  document_name?: string | null;
  document_type?: string | null;
  document_category?: string | null;
  description?: string | null;
  status?: string | null;
  uploaded_by?: string | null;
  uploaded_at?: Date | string | null;
  history?: { status?: string | null; changed_by?: string | null; changed_at?: Date | string | null }[];
  comments?: {
    comment?: string | null;
    added_by?: string | null;
    document_link?: string | null;
    added_at?: Date | string | null;
  }[];
}

/** Explicit allow-list: storage ids are selected only to build the `file` link and are never returned. */
export const DOCUMENT_COLUMNS = [
  'record_id',
  'storage_type',
  'r2_key',
  'workdrive_file_id',
  'file_name',
  'document_name',
  'document_type',
  'document_category',
  'description',
  'status',
  'uploaded_by',
  'uploaded_at',
  'history',
  'comments',
] as const;

export const mapDocumentToDto = (fileBaseUrl: string, row: DocumentRow): DocumentResponseDto => {
  const externalId = row._id.toString();
  return {
    externalId,
    leadId: row.record_id,
    fileName: row.file_name ?? null,
    documentName: row.document_name ?? null,
    documentType: row.document_type ?? null,
    documentCategory: row.document_category ?? null,
    description: row.description ?? null,
    status: row.status ?? null,
    uploadedBy: row.uploaded_by ?? null,
    uploadedAt: toIsoOrNull(row.uploaded_at),
    history: (row.history ?? []).map((entry) => ({
      status: entry.status ?? null,
      changedBy: entry.changed_by ?? null,
      changedAt: toIsoOrNull(entry.changed_at),
    })),
    comments: (row.comments ?? []).map((entry) => ({
      comment: entry.comment ?? null,
      addedBy: entry.added_by ?? null,
      documentLink: entry.document_link ?? null,
      addedAt: toIsoOrNull(entry.added_at),
    })),
    file: toFileLink(fileBaseUrl, 'documents', externalId, row),
  };
};
