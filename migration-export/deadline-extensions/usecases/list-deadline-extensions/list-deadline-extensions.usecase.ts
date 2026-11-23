import type { Model, PipelineStage } from 'mongoose';
import type { DeadlineExtensionResponseDto } from '../../dtos/deadline-extension-response.dto';
import { mapDeadlineExtensionToDto, type DeadlineExtensionRow } from './map-deadline-extension-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import type { ListDeadlineExtensionsCommand } from './list-deadline-extensions.command';

const DmsZohoClient = require('../../../../models/dmsZohoClient');

/** Mongoose's collection name for the `AdminApprovalRequest` model. */
export const APPROVAL_REQUESTS_COLLECTION = 'adminapprovalrequests';

const NULL = { $literal: null };

const wantsApproved = ({ kind, status }: ListDeadlineExtensionsCommand): boolean => kind !== 'request' && !status;
const wantsRequests = ({ kind }: ListDeadlineExtensionsCommand): boolean => kind !== 'approved';

const approvedPipeline = ({ leadId, recordType }: ListDeadlineExtensionsCommand): PipelineStage[] => [
  {
    $match: {
      'deadline_extensions.0': { $exists: true },
      ...(leadId && { lead_id: leadId }),
      ...(recordType && { record_type: recordType }),
    },
  },
  { $project: { lead_id: 1, record_type: 1, deadline_extensions: 1 } },
  { $unwind: '$deadline_extensions' },
  {
    $project: {
      _id: '$deadline_extensions._id',
      kind: { $literal: 'approved' },
      parentExternalId: '$_id',
      leadId: '$lead_id',
      recordType: '$record_type',
      fieldName: '$deadline_extensions.fieldName',
      previousValue: '$deadline_extensions.previousValue',
      newValue: '$deadline_extensions.newValue',
      reason: '$deadline_extensions.reason',
      requestedBy: '$deadline_extensions.requestedBy',
      approvedBy: '$deadline_extensions.approvedBy',
      approvedAt: '$deadline_extensions.approvedAt',
      requestId: '$deadline_extensions.requestId',
      status: { $literal: 'approved' },
      rejectionReason: NULL,
      createdAt: '$deadline_extensions.approvedAt',
    },
  },
];

const requestsPipeline = ({ leadId, recordType, status }: ListDeadlineExtensionsCommand): PipelineStage.UnionWith['$unionWith'] => ({
  coll: APPROVAL_REQUESTS_COLLECTION,
  pipeline: [
    {
      $match: {
        requestType: 'field_change',
        ...(leadId && { leadId }),
        ...(recordType && { recordType }),
        ...(status && { status }),
      },
    },
    {
      $project: {
        kind: { $literal: 'request' },
        parentExternalId: NULL,
        leadId: 1,
        recordType: 1,
        fieldName: 1,
        previousValue: '$currentValue',
        newValue: '$requestedValue',
        reason: 1,
        requestedBy: 1,
        approvedBy: '$reviewedBy',
        approvedAt: '$reviewedAt',
        requestId: NULL,
        status: 1,
        rejectionReason: 1,
        createdAt: 1,
      },
    },
  ],
});

/**
 * Both sources reshaped to one set of columns. The embedded rows come from `dmszohoclients`; when they are not
 * wanted the primary collection is matched to nothing, so the pipeline still starts from a collection.
 */
const buildSourcePipeline = (command: ListDeadlineExtensionsCommand): PipelineStage[] => [
  ...(wantsApproved(command) ? approvedPipeline(command) : [{ $match: { _id: { $in: [] } } }]),
  ...(wantsRequests(command) ? [{ $unionWith: requestsPipeline(command) }] : []),
];

export const listDeadlineExtensions = async (
  command: ListDeadlineExtensionsCommand,
  model: Pick<Model<unknown>, 'aggregate'> = DmsZohoClient
): Promise<Page<DeadlineExtensionResponseDto>> => {
  const { page, limit } = command;
  const source = buildSourcePipeline(command);

  // Approved rows first, then requests; inside each kind by creation time, with the row id breaking ties.
  const itemsPipeline: PipelineStage[] = [
    ...source,
    { $sort: { kind: 1, createdAt: 1, _id: 1 } },
    { $skip: toSkip(command) },
    { $limit: limit },
  ];
  const totalPipeline: PipelineStage[] = [...source, { $group: { _id: null, total: { $sum: 1 } } }];

  const [rows, [totals]] = await Promise.all([
    model.aggregate<DeadlineExtensionRow>(itemsPipeline).allowDiskUse(true),
    model.aggregate<{ total: number }>(totalPipeline),
  ]);

  return { data: rows.map(mapDeadlineExtensionToDto), total: totals?.total ?? 0, page, limit };
};
