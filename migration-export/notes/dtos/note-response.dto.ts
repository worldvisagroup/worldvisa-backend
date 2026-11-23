import type { RecordType } from '../../shared/record-type';

export interface NoteResponseDto {
  externalId: string;
  parentExternalId: string;
  leadId: string;
  recordType: RecordType | null;
  note: string;
  addedBy: string;
  addedAt: string | null;
}
