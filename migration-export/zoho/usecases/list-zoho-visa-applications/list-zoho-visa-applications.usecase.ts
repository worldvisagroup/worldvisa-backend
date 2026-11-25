import type { VisaApplicationResponseDto } from '../../dtos/visa-application-response.dto';
import { VISA_APPLICATION_FIELDS } from '../../fields/visa-application-fields';
import type { ZohoPage } from '../../../shared/lead-ids-query';
import { ZOHO_MODULE_BY_RECORD_TYPE } from '../../../shared/record-type';
import { zohoReadClient, type ZohoReadClient } from '../../../shared/zoho-read-client';
import type { ListZohoVisaApplicationsCommand } from './list-zoho-visa-applications.command';
import { mapVisaApplicationToDto } from './map-visa-application-to-dto';

export const listZohoVisaApplications = async (
  { leadIds }: ListZohoVisaApplicationsCommand,
  client: ZohoReadClient = zohoReadClient
): Promise<ZohoPage<VisaApplicationResponseDto>> => {
  const records = await client.getRecords(ZOHO_MODULE_BY_RECORD_TYPE.visa_application, leadIds, VISA_APPLICATION_FIELDS);
  const data = records.map(mapVisaApplicationToDto);
  return { data, requested: leadIds.length, found: data.length };
};
