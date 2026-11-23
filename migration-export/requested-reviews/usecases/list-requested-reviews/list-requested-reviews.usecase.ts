import type { Model, PipelineStage } from 'mongoose';
import type { RequestedReviewResponseDto } from '../../dtos/requested-review-response.dto';
import { mapRequestedReviewToDto, type RequestedReviewRow } from './map-requested-review-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListRequestedReviewsCommand } from './list-requested-reviews.command';

const DmsZohoDocument = require('../../../../models/dmsZohoDocument');

const buildMatch = ({ leadId }: ListRequestedReviewsCommand): Record<string, unknown> => ({
  'requested_reviews.0': { $exists: true },
  ...(leadId && { record_id: leadId }),
});

export const listRequestedReviews = async (
  command: ListRequestedReviewsCommand,
  model: Pick<Model<unknown>, 'aggregate'> = DmsZohoDocument
): Promise<Page<RequestedReviewResponseDto>> => {
  const match = buildMatch(command);
  const { page, limit } = command;

  // Documents have no created time; `$unwind` keeps array order, so the order is the document `_id`, then the hop position.
  const itemsPipeline: PipelineStage[] = [
    { $match: match },
    { $project: { record_id: 1, status: 1, reject_message: 1, requested_reviews: 1 } },
    { $sort: { _id: 1 } },
    { $unwind: '$requested_reviews' },
    { $skip: toSkip(command) },
    { $limit: limit },
  ];
  const totalPipeline: PipelineStage[] = [
    { $match: match },
    { $group: { _id: null, total: { $sum: { $size: '$requested_reviews' } } } },
  ];

  const [rows, [totals]] = await Promise.all([
    model.aggregate<RequestedReviewRow>(itemsPipeline).allowDiskUse(true),
    model.aggregate<{ total: number }>(totalPipeline),
  ]);

  return { data: rows.map(mapRequestedReviewToDto), total: totals?.total ?? 0, page, limit };
};
