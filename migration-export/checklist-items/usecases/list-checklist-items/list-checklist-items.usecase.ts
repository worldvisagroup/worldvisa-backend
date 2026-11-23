import type { Model, PipelineStage } from 'mongoose';
import type { ChecklistItemResponseDto } from '../../dtos/checklist-item-response.dto';
import { mapChecklistItemToDto, type ChecklistItemRow } from './map-checklist-item-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListChecklistItemsCommand } from './list-checklist-items.command';

const DmsZohoClient = require('../../../../models/dmsZohoClient');

const buildMatch = ({ leadId, recordType }: ListChecklistItemsCommand): Record<string, unknown> => ({
  'checklist.0': { $exists: true },
  ...(leadId && { lead_id: leadId }),
  ...(recordType && { record_type: recordType }),
});

export const listChecklistItems = async (
  command: ListChecklistItemsCommand,
  model: Pick<Model<unknown>, 'aggregate'> = DmsZohoClient
): Promise<Page<ChecklistItemResponseDto>> => {
  const match = buildMatch(command);
  const { page, limit } = command;

  // $unwind keeps array order, so sorting the applications first gives: created time, _id, array position.
  const itemsPipeline: PipelineStage[] = [
    { $match: match },
    { $project: { lead_id: 1, record_type: 1, created_at: 1, checklist: 1 } },
    { $sort: { created_at: 1, _id: 1 } },
    { $unwind: '$checklist' },
    { $skip: toSkip(command) },
    { $limit: limit },
  ];
  const totalPipeline: PipelineStage[] = [
    { $match: match },
    { $group: { _id: null, total: { $sum: { $size: '$checklist' } } } },
  ];

  const [rows, [totals]] = await Promise.all([
    model.aggregate<ChecklistItemRow>(itemsPipeline).allowDiskUse(true),
    model.aggregate<{ total: number }>(totalPipeline),
  ]);

  return { data: rows.map(mapChecklistItemToDto), total: totals?.total ?? 0, page, limit };
};
