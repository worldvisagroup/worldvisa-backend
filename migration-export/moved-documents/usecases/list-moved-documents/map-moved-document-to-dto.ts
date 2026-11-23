import type { MovedDocumentResponseDto } from '../../dtos/moved-document-response.dto';
import { toIsoOrNull } from '../../../shared/iso-date';
import { toFileLink, type StorageKind, type StoredFile } from '../../../shared/to-file-link';

export interface MovedDocumentRow {
  _id: { toString(): string };
  document_id: { toString(): string };
  record_id: string;
  file_name?: string | null;
  file_id?: string | null;
  moved_by?: string | null;
  moved_at?: Date | string | null;
  move_kind?: MovedDocumentResponseDto['moveKind'];
}

/** Explicit allow-list: `file_id` is selected only to build the `file` link and is never returned. */
export const MOVED_DOCUMENT_COLUMNS = ['document_id', 'record_id', 'file_name', 'file_id', 'moved_by', 'moved_at', 'move_kind'] as const;

/**
 * A moved row stores one `file_id` and no storage type. R2 keys are paths ("visa-applications/.../file.pdf");
 * a WorkDrive file id never contains a slash.
 */
export const resolveStorageKind = (fileId: string): StorageKind => (fileId.includes('/') ? 'r2' : 'workdrive');

export const toStoredFile = ({ file_id, file_name }: Pick<MovedDocumentRow, 'file_id' | 'file_name'>): StoredFile => {
  if (!file_id) {
    return { file_name };
  }
  const storage_type = resolveStorageKind(file_id);
  return storage_type === 'r2' ? { storage_type, r2_key: file_id, file_name } : { storage_type, workdrive_file_id: file_id, file_name };
};

export const mapMovedDocumentToDto = (fileBaseUrl: string, row: MovedDocumentRow): MovedDocumentResponseDto => {
  const externalId = row._id.toString();
  return {
    externalId,
    leadId: row.record_id,
    documentExternalId: row.document_id.toString(),
    fileName: row.file_name ?? null,
    movedBy: row.moved_by ?? null,
    movedAt: toIsoOrNull(row.moved_at),
    moveKind: row.move_kind ?? null,
    file: toFileLink(fileBaseUrl, 'moved-documents', externalId, toStoredFile(row)),
  };
};
