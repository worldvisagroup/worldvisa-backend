import type { QualityCheckRequestResponseDto } from '../../dtos/quality-check-request-response.dto';
import { toIsoOrNull } from '../../../shared/iso-date';

export interface QualityCheckMessageRow {
  username: string;
  message: string;
  added_at?: Date | string | null;
}

export interface QualityCheckRequestRow {
  _id: { toString(): string };
  leadId: string;
  recordType: string;
  requested_by: string;
  requested_to: string;
  status?: string | null;
  requested_at?: Date | string | null;
  messages?: QualityCheckMessageRow[] | null;
  migrated?: boolean | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export const QUALITY_CHECK_REQUEST_COLUMNS = [
  'leadId',
  'recordType',
  'requested_by',
  'requested_to',
  'status',
  'requested_at',
  'messages',
  'migrated',
  'createdAt',
  'updatedAt',
] as const;

export const mapQualityCheckRequestToDto = (row: QualityCheckRequestRow): QualityCheckRequestResponseDto => ({
  externalId: row._id.toString(),
  leadId: row.leadId,
  recordType: row.recordType,
  requestedBy: row.requested_by,
  requestedTo: row.requested_to,
  status: row.status ?? 'pending',
  requestedAt: toIsoOrNull(row.requested_at),
  messages: (row.messages ?? []).map(({ username, message, added_at }) => ({
    username,
    message,
    addedAt: toIsoOrNull(added_at),
  })),
  migrated: row.migrated ?? false,
  createdAt: toIsoOrNull(row.createdAt),
  modifiedAt: toIsoOrNull(row.updatedAt),
});
