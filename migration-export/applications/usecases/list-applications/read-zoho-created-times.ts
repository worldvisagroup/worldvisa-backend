import { chunk } from '../../../shared/chunk';
import { toIsoOrNull } from '../../../shared/iso-date';
import { ZOHO_ID_PATTERN } from '../../../shared/lead-ids-query';
import { RECORD_TYPES, ZOHO_MODULE_BY_RECORD_TYPE } from '../../../shared/record-type';
import { ZOHO_MAX_IDS, type ZohoReadClient } from '../../../shared/zoho-read-client';
import type { ApplicationRow } from './map-application-to-dto';

const CREATED_TIME_FIELD = 'Created_Time';

/**
 * Zoho's created time, by lead id, for the rows whose own copy of it (`zoho_created_time`) is empty.
 * A lead Zoho does not have is absent. A Zoho failure throws, so an unanswered lookup is never
 * mistaken for a missing date. One request at a time, to stay inside Zoho's rate limit.
 */
export const readZohoCreatedTimes = async (rows: readonly ApplicationRow[], client: ZohoReadClient): Promise<Map<string, string>> => {
  const withoutCreatedTime = rows.filter((row) => !toIsoOrNull(row.zoho_created_time) && ZOHO_ID_PATTERN.test(row.lead_id));
  const createdTimes = new Map<string, string>();

  for (const recordType of RECORD_TYPES) {
    const leadIds = new Set(withoutCreatedTime.filter((row) => row.record_type === recordType).map((row) => row.lead_id));

    for (const ids of chunk([...leadIds], ZOHO_MAX_IDS)) {
      for (const record of await client.getRecords(ZOHO_MODULE_BY_RECORD_TYPE[recordType], ids, [CREATED_TIME_FIELD])) {
        const createdTime = toIsoOrNull(record[CREATED_TIME_FIELD] as string | null | undefined);
        if (createdTime) {
          createdTimes.set(record.id, createdTime);
        }
      }
    }
  }
  return createdTimes;
};
