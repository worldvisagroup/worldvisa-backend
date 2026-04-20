/**
 * OpenSearch client + application search/index helpers.
 *
 * Env:
 *   OPENSEARCH_NODE          — cluster URL (e.g. https://search-...amazonaws.com)
 *   OPENSEARCH_USERNAME      — optional basic auth
 *   OPENSEARCH_PASSWORD
 *   OPENSEARCH_APPLICATIONS_INDEX — index name (default: dms_applications)
 *   OPENSEARCH_SSL_VERIFY    — set to "false" to skip TLS verify (dev only)
 *
 * If OPENSEARCH_NODE is unset, searchApplications returns [] and indexing no-ops.
 */

import { Client } from '@opensearch-project/opensearch';

// ── types (match globalSearch mapping in dmsZohoDocumentsController) ───────

export interface ApplicationSearchSource {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  created_time?: string | null;
  handled_by?: string | null;
  dms_status?: string | null;
  package_finalize?: string | null;
  checklist_requested?: boolean | null;
  deadline?: string | null;
  record_type?: string | null;
  stage?: string | null;
  quality_check_from?: string | null;
  country?: string | null;
  main_applicant?: string | null;
  module?: string | null;
}

export interface SearchHit {
  id: string;
  source: ApplicationSearchSource;
}

export interface SearchOptions {
  size?: number;
}

export type ApplicationIndexDocument = ApplicationSearchSource & {
  /** Zoho / Mongo lead id — stored for retrieval; document _id can match */
  lead_id?: string | null;
};

let cachedClient: Client | null | undefined;

function applicationsIndex(): string {
  return process.env.OPENSEARCH_APPLICATIONS_INDEX?.trim() || 'dms_applications';
}

export function isOpenSearchConfigured(): boolean {
  return Boolean(process.env.OPENSEARCH_NODE?.trim());
}

export function getOpenSearchClient(): Client | null {
  if (cachedClient === undefined) {
    const node = process.env.OPENSEARCH_NODE?.trim();
    if (!node) {
      cachedClient = null;
      return null;
    }
    const username = process.env.OPENSEARCH_USERNAME;
    const password = process.env.OPENSEARCH_PASSWORD;
    cachedClient = new Client({
      node,
      ssl: {
        rejectUnauthorized: process.env.OPENSEARCH_SSL_VERIFY !== 'false',
      },
      ...(username && password
        ? {
            auth: { username, password },
          }
        : {}),
    });
  }
  return cachedClient;
}

function unwrapSearchBody(response: unknown): { hits?: { hits?: unknown[] } } {
  if (response && typeof response === 'object' && 'body' in response) {
    return (response as { body: { hits?: { hits?: unknown[] } } }).body;
  }
  return response as { hits?: { hits?: unknown[] } };
}

const INDEX_SETTINGS = {
  settings: {
    index: {
      number_of_shards: 1,
      number_of_replicas: 0,
    },
  },
  mappings: {
    properties: {
      lead_id: { type: 'keyword' },
      name: {
        type: 'text',
        fields: { keyword: { type: 'keyword', ignore_above: 256 } },
      },
      email: { type: 'keyword' },
      phone: { type: 'keyword' },
      created_time: { type: 'date' },
      handled_by: { type: 'keyword' },
      dms_status: { type: 'keyword' },
      package_finalize: { type: 'keyword' },
      checklist_requested: { type: 'boolean' },
      deadline: { type: 'keyword' },
      record_type: { type: 'keyword' },
      stage: { type: 'keyword' },
      quality_check_from: { type: 'keyword' },
      country: { type: 'keyword' },
      main_applicant: { type: 'keyword' },
      module: { type: 'keyword' },
    },
  },
};

/**
 * Create the applications index with mappings if it does not exist.
 */
export async function ensureIndex(): Promise<void> {
  const client = getOpenSearchClient();
  if (!client) {
    return;
  }
  const index = applicationsIndex();
  try {
    await client.indices.create({
      index,
      // OpenSearch typings expect literal union `type` fields; runtime shape is valid.
      body: INDEX_SETTINGS as Record<string, unknown>,
    });
  } catch (err: unknown) {
    const type = (err as { body?: { error?: { type?: string } } })?.body?.error?.type;
    const status =
      (err as { meta?: { statusCode?: number } })?.meta?.statusCode ??
      (err as { statusCode?: number })?.statusCode;
    if (status === 400 && type === 'resource_already_exists_exception') {
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('resource_already_exists_exception') || msg.includes('already exists')) {
      return;
    }
    throw err;
  }
}

/**
 * Index or replace one application document. Uses lead_id as _id when present.
 */
export async function indexApplication(
  doc: ApplicationIndexDocument,
  idOverride?: string
): Promise<void> {
  const client = getOpenSearchClient();
  if (!client) return;

  const index = applicationsIndex();
  const id = idOverride ?? doc.lead_id ?? undefined;
  if (!id) {
    console.warn('[opensearchService] indexApplication: no id or lead_id, skip');
    return;
  }

  const { lead_id: _omit, ...source } = doc;
  await client.index({
    index,
    id: String(id),
    body: source,
    refresh: false,
  });
}

export async function removeApplication(leadId: string): Promise<void> {
  const client = getOpenSearchClient();
  if (!client) return;
  try {
    await client.delete({
      index: applicationsIndex(),
      id: String(leadId),
      refresh: false,
    });
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404) return;
    throw err;
  }
}

/**
 * Full-text search across indexed applications (global admin search).
 */
export async function searchApplications(
  query: string,
  options: SearchOptions = {}
): Promise<SearchHit[]> {
  const trimmed = query?.trim();
  if (!trimmed) return [];

  const client = getOpenSearchClient();
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[opensearchService] OPENSEARCH_NODE not set; searchApplications returns [].');
    }
    return [];
  }

  const index = applicationsIndex();
  const size = Math.min(Math.max(options.size ?? 10, 1), 100);

  const response = await client.search({
    index,
    body: {
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: trimmed,
                fields: ['name^3', 'email^2', 'phone', 'lead_id', 'main_applicant'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
            {
              simple_query_string: {
                query: trimmed,
                fields: ['name', 'email', 'phone', 'lead_id'],
                default_operator: 'and',
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      size,
      sort: [{ created_time: { order: 'desc', missing: '_last' } }],
    },
  });

  const body = unwrapSearchBody(response);
  const rawHits = body.hits?.hits ?? [];

  return (rawHits as Array<{ _id?: string; _source?: ApplicationSearchSource }>)
    .map((h) => ({
      id: String(h._id ?? ''),
      source: h._source ?? {},
    }))
    .filter((h) => h.id);
}
