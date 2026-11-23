import { toIsoOrNull } from '../../../shared/iso-date';
import type { RecordType } from '../../../shared/record-type';
import type {
  DeadlineExtensionKind,
  DeadlineExtensionResponseDto,
  DeadlineExtensionStatus,
} from '../../dtos/deadline-extension-response.dto';

/** One row of either source, already reshaped to the common columns by the pipeline. */
export interface DeadlineExtensionRow {
  _id: { toString(): string };
  parentExternalId?: { toString(): string } | null;
  kind: DeadlineExtensionKind;
  leadId: string;
  recordType?: RecordType | null;
  fieldName: string;
  previousValue?: string | null;
  newValue: string;
  reason: string;
  requestedBy: string;
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  requestId?: { toString(): string } | null;
  status: DeadlineExtensionStatus;
  rejectionReason?: string | null;
  createdAt?: Date | string | null;
}

export const mapDeadlineExtensionToDto = (row: DeadlineExtensionRow): DeadlineExtensionResponseDto => ({
  externalId: row._id.toString(),
  parentExternalId: row.parentExternalId?.toString() ?? null,
  leadId: row.leadId,
  recordType: row.recordType ?? null,
  kind: row.kind,
  fieldName: row.fieldName,
  previousValue: row.previousValue ?? null,
  newValue: row.newValue,
  reason: row.reason,
  requestedBy: row.requestedBy,
  approvedBy: row.approvedBy ?? null,
  approvedAt: toIsoOrNull(row.approvedAt),
  requestId: row.requestId?.toString() ?? null,
  status: row.status,
  rejectionReason: row.rejectionReason ?? null,
  createdAt: toIsoOrNull(row.createdAt),
});
