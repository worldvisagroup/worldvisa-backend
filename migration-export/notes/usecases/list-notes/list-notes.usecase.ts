import type { Model, PipelineStage } from 'mongoose';
import type { NoteResponseDto } from '../../dtos/note-response.dto';
import { mapNoteToDto, type NoteRow } from './map-note-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListNotesCommand } from './list-notes.command';

const DmsZohoClient = require('../../../../models/dmsZohoClient');

const buildMatch = ({ leadId, recordType }: ListNotesCommand): Record<string, unknown> => ({
  'notes.0': { $exists: true },
  ...(leadId && { lead_id: leadId }),
  ...(recordType && { record_type: recordType }),
});

export const listNotes = async (
  command: ListNotesCommand,
  model: Pick<Model<unknown>, 'aggregate'> = DmsZohoClient
): Promise<Page<NoteResponseDto>> => {
  const match = buildMatch(command);
  const { page, limit } = command;

  // $unwind keeps array order, so sorting the applications first gives: created time, _id, array position.
  const itemsPipeline: PipelineStage[] = [
    { $match: match },
    { $project: { lead_id: 1, record_type: 1, created_at: 1, notes: 1 } },
    { $sort: { created_at: 1, _id: 1 } },
    { $unwind: '$notes' },
    { $skip: toSkip(command) },
    { $limit: limit },
  ];
  const totalPipeline: PipelineStage[] = [
    { $match: match },
    { $group: { _id: null, total: { $sum: { $size: '$notes' } } } },
  ];

  const [rows, [totals]] = await Promise.all([
    model.aggregate<NoteRow>(itemsPipeline).allowDiskUse(true),
    model.aggregate<{ total: number }>(totalPipeline),
  ]);

  return { data: rows.map(mapNoteToDto), total: totals?.total ?? 0, page, limit };
};
