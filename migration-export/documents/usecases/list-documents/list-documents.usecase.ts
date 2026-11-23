import type { FilterQuery, Model } from 'mongoose';
import type { DocumentResponseDto } from '../../dtos/document-response.dto';
import { DOCUMENT_COLUMNS, mapDocumentToDto, type DocumentRow } from './map-document-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListDocumentsCommand } from './list-documents.command';

const DmsZohoDocument = require('../../../../models/dmsZohoDocument');

export const buildDocumentFilter = ({ leadId, status }: ListDocumentsCommand): FilterQuery<DocumentRow> => ({
  ...(leadId && { record_id: leadId }),
  ...(status && { status }),
});

export const listDocuments = async (
  command: ListDocumentsCommand,
  fileBaseUrl: string,
  model: Pick<Model<DocumentRow>, 'find' | 'countDocuments'> = DmsZohoDocument
): Promise<Page<DocumentResponseDto>> => {
  const filter = buildDocumentFilter(command);
  const { page, limit } = command;

  // Documents have no created time; `_id` is the stable order.
  const [rows, total] = await Promise.all([
    model
      .find(filter)
      .select(DOCUMENT_COLUMNS.join(' '))
      .sort({ _id: 1 })
      .skip(toSkip(command))
      .limit(limit)
      .allowDiskUse(true)
      .lean(),
    model.countDocuments(filter),
  ]);

  return { data: rows.map((row) => mapDocumentToDto(fileBaseUrl, row)), total, page, limit };
};
