import type { RecordType } from '../../shared/record-type';

export type DeadlineExtensionKind = 'approved' | 'request';
export type DeadlineExtensionStatus = 'pending' | 'approved' | 'rejected';

export interface DeadlineExtensionResponseDto {
  externalId: string;
  parentExternalId: string | null;
  leadId: string;
  recordType: RecordType | null;
  kind: DeadlineExtensionKind;
  fieldName: string;
  previousValue: string | null;
  newValue: string;
  reason: string;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  requestId: string | null;
  status: DeadlineExtensionStatus;
  rejectionReason: string | null;
  createdAt: string | null;
}
