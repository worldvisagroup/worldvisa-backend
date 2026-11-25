import type { FilterQuery, Model } from 'mongoose';
import type { ApplicationResponseDto } from '../../dtos/application-response.dto';
import { APPLICATION_COLUMNS, mapApplicationToDto, type ApplicationRow } from './map-application-to-dto';
import { toSkip, type Page } from '../../../shared/paging';
import { zohoReadClient, type ZohoReadClient } from '../../../shared/zoho-read-client';
import type { ListApplicationsCommand } from './list-applications.command';
import { readZohoCreatedTimes } from './read-zoho-created-times';

const DmsZohoClient = require('../../../../models/dmsZohoClient');

export const buildApplicationFilter = ({ recordType, from, to }: ListApplicationsCommand): FilterQuery<ApplicationRow> => {
  const filter: FilterQuery<ApplicationRow> = {};
  if (recordType) {
    filter.record_type = recordType;
  }
  if (from || to) {
    filter.created_at = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  }
  return filter;
};

export const listApplications = async (
  command: ListApplicationsCommand,
  model: Pick<Model<ApplicationRow>, 'find' | 'countDocuments'> = DmsZohoClient,
  client: ZohoReadClient = zohoReadClient
): Promise<Page<ApplicationResponseDto>> => {
  const filter = buildApplicationFilter(command);
  const { page, limit } = command;

  const [rows, total] = await Promise.all([
    model
      .find(filter)
      .select(APPLICATION_COLUMNS.join(' '))
      .sort({ created_at: 1, _id: 1 })
      .skip(toSkip(command))
      .limit(limit)
      .allowDiskUse(true)
      .lean(),
    model.countDocuments(filter),
  ]);

  const zohoCreatedTimes = await readZohoCreatedTimes(rows, client);
  const data = rows.map((row) => mapApplicationToDto(row, zohoCreatedTimes.get(row.lead_id)));

  return { data, total, page, limit };
};
