import type { RecordType } from '../../shared/record-type';

export interface ChecklistItemResponseDto {
  externalId: string;
  parentExternalId: string;
  leadId: string;
  recordType: RecordType | null;
  documentType: string;
  documentCategory: string;
  required: boolean;
  instructions: string | null;
  description: string | null;
}
