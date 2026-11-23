import type { FilterQuery, Model } from 'mongoose';
import type { MovedDocumentResponseDto } from '../../dtos/moved-document-response.dto';
import { MOVED_DOCUMENT_COLUMNS, mapMovedDocumentToDto, type MovedDocumentRow } from './map-moved-document-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListMovedDocumentsCommand } from './list-moved-documents.command';

const MovedDocument = require('../../../../models/movedDocuments');

export const buildMovedDocumentFilter = ({ leadId }: ListMovedDocumentsCommand): FilterQuery<MovedDocumentRow> => ({
  ...(leadId && { record_id: leadId }),
});

export const listMovedDocuments = async (
  command: ListMovedDocumentsCommand,
  fileBaseUrl: string,
  model: Pick<Model<MovedDocumentRow>, 'find' | 'countDocuments'> = MovedDocument
): Promise<Page<MovedDocumentResponseDto>> => {
  const filter = buildMovedDocumentFilter(command);
  const { page, limit } = command;

  // `_id` carries the insert time and is the stable order (spec: order by `_id`).
  const [rows, total] = await Promise.all([
    model
      .find(filter)
      .select(MOVED_DOCUMENT_COLUMNS.join(' '))
      .sort({ _id: 1 })
      .skip(toSkip(command))
      .limit(limit)
      .allowDiskUse(true)
      .lean(),
    model.countDocuments(filter),
  ]);

  return { data: rows.map((row) => mapMovedDocumentToDto(fileBaseUrl, row)), total, page, limit };
};
