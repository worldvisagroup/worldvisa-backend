import axios, { isAxiosError } from 'axios';
import { chunk } from './chunk';

const { getAccessToken } = require('../../controllers/zohoDms/zohoAuth');

export const ZOHO_MAX_IDS = 100;
export const ZOHO_MAX_FIELDS = 50;

const ZOHO_TIMEOUT_MS = 30_000;
const RATE_LIMIT_WAIT_MS = 2_000;
const TOO_MANY_REQUESTS = 429;
const BAD_REQUEST = 400;
const NO_CONTENT = 204;
const RELATED_PAGE_SIZE = 200;
const RELATED_CONCURRENCY = 5;

export type ZohoRecord = { id: string } & Record<string, unknown>;

export interface ZohoReadClient {
  getRecords(module: string, ids: string[], fields: readonly string[]): Promise<ZohoRecord[]>;
}

export interface ZohoRelatedRecords {
  parentId: string;
  records: ZohoRecord[];
}

export interface ZohoRelatedReadClient {
  getRelatedRecords(module: string, parentIds: string[], relatedList: string, fields: readonly string[]): Promise<ZohoRelatedRecords[]>;
}

export class ZohoUnavailableError extends Error {
  constructor(message = 'Zoho CRM is not reachable right now, retry shortly') {
    super(message);
    this.name = 'ZohoUnavailableError';
  }
}

const baseUrl = (): string => `https://www.zohoapis.${process.env.ZOHO_DC || 'in'}/crm/v5`;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const get = async (path: string, params: Record<string, string | number>, retry = true): Promise<{ status: number; data: any }> => {
  const token: string = await getAccessToken();
  const response = await axios
    .get(`${baseUrl()}${path}`, {
      params,
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
      timeout: ZOHO_TIMEOUT_MS,
      validateStatus: (status) => status < 300 || status === TOO_MANY_REQUESTS,
    })
    .catch((error: unknown) => {
      // No answer (timeout, reset) or a Zoho 5xx is transient; anything else is a bug and surfaces as a 500.
      if (isAxiosError(error) && (!error.response || error.response.status >= 500)) {
        throw new ZohoUnavailableError();
      }
      throw error;
    });

  if (response.status === TOO_MANY_REQUESTS) {
    if (!retry) {
      throw new ZohoUnavailableError('Zoho CRM rate limit reached, retry shortly');
    }
    await wait(RATE_LIMIT_WAIT_MS);
    return get(path, params, false);
  }
  return response;
};

const readChunk = async (module: string, ids: string[], fields: readonly string[]): Promise<ZohoRecord[]> => {
  const response = await get(`/${module}`, { ids: ids.join(','), fields: fields.join(',') });
  return response.status === NO_CONTENT ? [] : (response.data?.data ?? []);
};

// Zoho answers 400 INVALID_DATA on the parent id (path index 1) when the record does not exist.
const isUnknownParent = (error: unknown): boolean =>
  isAxiosError(error) &&
  error.response?.status === BAD_REQUEST &&
  error.response.data?.code === 'INVALID_DATA' &&
  error.response.data?.details?.resource_path_index === 1;

const readRelatedRecords = async (module: string, parentId: string, relatedList: string, fields: readonly string[]): Promise<ZohoRecord[]> => {
  const records: ZohoRecord[] = [];
  for (let page = 1; ; page++) {
    const response = await get(`/${module}/${parentId}/${relatedList}`, {
      fields: fields.join(','),
      per_page: RELATED_PAGE_SIZE,
      page,
      sort_by: 'id',
      sort_order: 'asc',
    }).catch((error: unknown) => {
      if (isUnknownParent(error)) {
        return null;
      }
      throw error;
    });
    if (!response || response.status === NO_CONTENT) {
      break;
    }
    records.push(...(response.data?.data ?? []));
    if (!response.data?.info?.more_records) {
      break;
    }
  }
  return records;
};

/**
 * Reads records by id. Zoho caps one request at 50 `fields`, so a long allow list is fetched in
 * sequential field chunks and merged by `id`. A record Zoho does not have is simply absent.
 */
export const zohoReadClient: ZohoReadClient & ZohoRelatedReadClient = {
  async getRecords(module, ids, fields) {
    const merged = new Map<string, ZohoRecord>();
    for (const fieldChunk of chunk(fields, ZOHO_MAX_FIELDS)) {
      for (const record of await readChunk(module, ids, fieldChunk)) {
        merged.set(record.id, { ...merged.get(record.id), ...record });
      }
    }
    return [...merged.values()];
  },
  /**
   * Reads one related list per parent, a few parents at a time to stay inside Zoho's rate limit, paging each
   * at 200 rows. A parent Zoho does not have comes back with no records.
   */
  async getRelatedRecords(module, parentIds, relatedList, fields) {
    const results: ZohoRelatedRecords[] = [];
    for (const group of chunk(parentIds, RELATED_CONCURRENCY)) {
      results.push(
        ...(await Promise.all(
          group.map(async (parentId) => ({ parentId, records: await readRelatedRecords(module, parentId, relatedList, fields) }))
        ))
      );
    }
    return results;
  },
};
