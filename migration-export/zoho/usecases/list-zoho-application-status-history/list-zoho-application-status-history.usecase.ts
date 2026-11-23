import type { ApplicationStatusHistoryResponseDto } from '../../dtos/application-status-history-response.dto';
import { APPLICATION_STATUS_HISTORY_FIELDS } from '../../fields/application-status-history-fields';
import type { ZohoPage } from '../../../shared/lead-ids-query';
import { zohoReadClient, type ZohoRelatedReadClient } from '../../../shared/zoho-read-client';
import type { ListZohoApplicationStatusHistoryCommand } from './list-zoho-application-status-history.command';
import { mapApplicationStatusHistoryToDto } from './map-application-status-history-to-dto';

const VISA_APPLICATIONS_MODULE = 'Visa_Applications';
const STATUS_HISTORY_LIST = 'Application_Status_History';

/** One item per history entry. `found` counts the leads that have at least one entry. */
export const listZohoApplicationStatusHistory = async (
  { leadIds }: ListZohoApplicationStatusHistoryCommand,
  client: ZohoRelatedReadClient = zohoReadClient
): Promise<ZohoPage<ApplicationStatusHistoryResponseDto>> => {
  const histories = await client.getRelatedRecords(VISA_APPLICATIONS_MODULE, leadIds, STATUS_HISTORY_LIST, APPLICATION_STATUS_HISTORY_FIELDS);
  const data = histories.flatMap(({ parentId, records }) => records.map((record) => mapApplicationStatusHistoryToDto(parentId, record)));
  return { data, requested: leadIds.length, found: histories.filter(({ records }) => records.length > 0).length };
};
