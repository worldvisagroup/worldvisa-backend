import type { FilterQuery, Model } from 'mongoose';
import type { StageDocumentResponseDto } from '../../dtos/stage-document-response.dto';
import { STAGE_DOCUMENT_COLUMNS, mapStageDocumentToDto, type StageDocumentRow } from './map-stage-document-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListStageDocumentsCommand } from './list-stage-documents.command';

const DmsZohoAusStage2Document = require('../../../../models/dmsZohoAusStage2Documents');

export const buildStageDocumentFilter = ({ leadId, type, from, to }: ListStageDocumentsCommand): FilterQuery<StageDocumentRow> => {
  const filter: FilterQuery<StageDocumentRow> = {
    ...(leadId && { record_id: leadId }),
    ...(type && { type }),
  };
  if (from || to) {
    filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  }
  return filter;
};

export const listStageDocuments = async (
  command: ListStageDocumentsCommand,
  fileBaseUrl: string,
  model: Pick<Model<StageDocumentRow>, 'find' | 'countDocuments'> = DmsZohoAusStage2Document
): Promise<Page<StageDocumentResponseDto>> => {
  const filter = buildStageDocumentFilter(command);
  const { page, limit } = command;

  const [rows, total] = await Promise.all([
    model
      .find(filter)
      .select(STAGE_DOCUMENT_COLUMNS.join(' '))
      .sort({ createdAt: 1, _id: 1 })
      .skip(toSkip(command))
      .limit(limit)
      .allowDiskUse(true)
      .lean(),
    model.countDocuments(filter),
  ]);

  return { data: rows.map((row) => mapStageDocumentToDto(fileBaseUrl, row)), total, page, limit };
};
