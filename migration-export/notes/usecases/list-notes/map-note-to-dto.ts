import { toIsoOrNull } from '../../../shared/iso-date';
import type { RecordType } from '../../../shared/record-type';
import type { NoteResponseDto } from '../../dtos/note-response.dto';

export interface NoteElement {
  _id: { toString(): string };
  note: string;
  addedBy: string;
  addedAt?: Date | string | null;
}

/** One note after `$unwind`, carrying the columns of the application it belongs to. */
export interface NoteRow {
  _id: { toString(): string };
  lead_id: string;
  record_type?: RecordType | null;
  notes: NoteElement;
}

export const mapNoteToDto = ({ _id, lead_id, record_type, notes }: NoteRow): NoteResponseDto => ({
  externalId: notes._id.toString(),
  parentExternalId: _id.toString(),
  leadId: lead_id,
  recordType: record_type ?? null,
  note: notes.note,
  addedBy: notes.addedBy,
  addedAt: toIsoOrNull(notes.addedAt),
});
