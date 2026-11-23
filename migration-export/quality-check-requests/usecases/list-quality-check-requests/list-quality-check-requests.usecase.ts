import type { FilterQuery, Model } from 'mongoose';
import type { QualityCheckRequestResponseDto } from '../../dtos/quality-check-request-response.dto';
import {
  QUALITY_CHECK_REQUEST_COLUMNS,
  mapQualityCheckRequestToDto,
  type QualityCheckRequestRow,
} from './map-quality-check-request-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListQualityCheckRequestsCommand } from './list-quality-check-requests.command';

const QualityCheckRequest = require('../../../../models/qualityCheckRequest');

export const buildQualityCheckRequestFilter = ({
  leadId,
  status,
  recordType,
  from,
  to,
}: ListQualityCheckRequestsCommand): FilterQuery<QualityCheckRequestRow> => {
  const filter: FilterQuery<QualityCheckRequestRow> = {
    ...(leadId && { leadId }),
    ...(status && { status }),
    ...(recordType && { recordType }),
  };
  if (from || to) {
    filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  }
  return filter;
};

export const listQualityCheckRequests = async (
  command: ListQualityCheckRequestsCommand,
  model: Pick<Model<QualityCheckRequestRow>, 'find' | 'countDocuments'> = QualityCheckRequest
): Promise<Page<QualityCheckRequestResponseDto>> => {
  const filter = buildQualityCheckRequestFilter(command);
  const { page, limit } = command;

  const [rows, total] = await Promise.all([
    model
      .find(filter)
      .select(QUALITY_CHECK_REQUEST_COLUMNS.join(' '))
      .sort({ createdAt: 1, _id: 1 })
      .skip(toSkip(command))
      .limit(limit)
      .allowDiskUse(true)
      .lean(),
    model.countDocuments(filter),
  ]);

  return { data: rows.map(mapQualityCheckRequestToDto), total, page, limit };
};
