import type { RecordType } from '../../../shared/record-type';
import type { ChecklistItemResponseDto } from '../../dtos/checklist-item-response.dto';

export interface ChecklistElement {
  _id: { toString(): string };
  document_type: string;
  document_category: string;
  required: boolean;
  instructions?: string | null;
  description?: string | null;
}

/** One checklist element after `$unwind`, carrying the columns of the application it belongs to. */
export interface ChecklistItemRow {
  _id: { toString(): string };
  lead_id: string;
  record_type?: RecordType | null;
  checklist: ChecklistElement;
}

export const mapChecklistItemToDto = ({ _id, lead_id, record_type, checklist }: ChecklistItemRow): ChecklistItemResponseDto => ({
  externalId: checklist._id.toString(),
  parentExternalId: _id.toString(),
  leadId: lead_id,
  recordType: record_type ?? null,
  documentType: checklist.document_type,
  documentCategory: checklist.document_category,
  required: checklist.required,
  instructions: checklist.instructions ?? null,
  description: checklist.description ?? null,
});
