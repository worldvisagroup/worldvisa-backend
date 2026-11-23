import type { StageDocumentResponseDto } from '../../dtos/stage-document-response.dto';
import { toIsoOrNull } from '../../../shared/iso-date';
import { toFileLink, type StoredFile } from '../../../shared/to-file-link';

export interface StageDocumentRow extends StoredFile {
  _id: { toString(): string };
  record_id: string;
  type?: string | null;
  invitation_type?: string | null;
  document_name?: string | null;
  document_type?: string | null;
  outcome?: string | null;
  outcome_date?: Date | string | null;
  skill_assessing_body?: string | null;
  language_assessing_body?: string | null;
  subclass?: string | null;
  state?: string | null;
  point?: number | null;
  date?: Date | string | null;
  deadline?: Date | string | null;
  expiry_at?: Date | string | null;
  uploaded_by?: string | null;
  uploaded_at?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

/** Explicit allow-list: storage ids are selected only to build the `file` link and are never returned. */
export const STAGE_DOCUMENT_COLUMNS = [
  'record_id',
  'storage_type',
  'r2_key',
  'workdrive_file_id',
  'file_name',
  'document_name',
  'document_type',
  'type',
  'invitation_type',
  'outcome',
  'outcome_date',
  'skill_assessing_body',
  'language_assessing_body',
  'subclass',
  'state',
  'point',
  'date',
  'deadline',
  'expiry_at',
  'uploaded_by',
  'uploaded_at',
  'createdAt',
  'updatedAt',
] as const;

export const mapStageDocumentToDto = (fileBaseUrl: string, row: StageDocumentRow): StageDocumentResponseDto => {
  const externalId = row._id.toString();
  return {
    externalId,
    leadId: row.record_id,
    type: row.type ?? null,
    invitationType: row.invitation_type ?? null,
    fileName: row.file_name ?? null,
    documentName: row.document_name ?? null,
    documentType: row.document_type ?? null,
    outcome: row.outcome ?? null,
    outcomeDate: toIsoOrNull(row.outcome_date),
    skillAssessingBody: row.skill_assessing_body ?? null,
    languageAssessingBody: row.language_assessing_body ?? null,
    subclass: row.subclass ?? null,
    state: row.state ?? null,
    point: row.point ?? null,
    date: toIsoOrNull(row.date),
    deadline: toIsoOrNull(row.deadline),
    expiryAt: toIsoOrNull(row.expiry_at),
    uploadedBy: row.uploaded_by ?? null,
    uploadedAt: toIsoOrNull(row.uploaded_at),
    createdAt: toIsoOrNull(row.createdAt),
    modifiedAt: toIsoOrNull(row.updatedAt),
    file: toFileLink(fileBaseUrl, 'stage-documents', externalId, row),
  };
};
