"use strict";
/**
 * OpenSearch Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all OpenSearch operations:
 *   - Index bootstrap (ensureIndex)
 *   - Upsert / delete single records
 *   - Bulk upsert from MongoDB full-sync
 *   - Full-text + fuzzy search across all visa applications
 *
 * Index: visa_applications
 *   - Single-shard, 0 replicas (single-node cluster)
 *   - Documents sourced from DmsZohoClient MongoDB collection
 *   - Document _id = MongoDB lead_id
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
exports.ensureIndex = ensureIndex;
exports.upsertApplication = upsertApplication;
exports.bulkUpsertApplications = bulkUpsertApplications;
exports.deleteApplication = deleteApplication;
exports.searchApplications = searchApplications;
exports.ping = ping;
const opensearch_1 = require("@opensearch-project/opensearch");
const logger = require('../utils/logger');
// ─── Constants ────────────────────────────────────────────────────────────────
const INDEX = 'visa_applications';
const INDEX_MAPPING = {
    settings: {
        index: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
                analyzer: {
                    edge_ngram_analyzer: {
                        type: 'custom',
                        tokenizer: 'edge_ngram_tokenizer',
                        filter: ['lowercase'],
                    },
                },
                tokenizer: {
                    edge_ngram_tokenizer: {
                        type: 'edge_ngram',
                        min_gram: 2,
                        max_gram: 20,
                        token_chars: ['letter', 'digit'],
                    },
                },
            },
        },
    },
    mappings: {
        properties: {
            lead_id: { type: 'keyword' },
            name: {
                type: 'text',
                analyzer: 'edge_ngram_analyzer',
                search_analyzer: 'standard',
                fields: { keyword: { type: 'keyword', ignore_above: 256 } },
            },
            full_name: {
                type: 'text',
                analyzer: 'edge_ngram_analyzer',
                search_analyzer: 'standard',
                fields: { keyword: { type: 'keyword', ignore_above: 256 } },
            },
            email: {
                type: 'text',
                analyzer: 'standard',
                fields: { keyword: { type: 'keyword', ignore_above: 256 } },
            },
            phone: { type: 'keyword' },
            country: { type: 'keyword' },
            stage: { type: 'keyword' },
            service_type: { type: 'keyword' },
            application_state: { type: 'keyword' },
            record_type: { type: 'keyword' },
            handled_by: { type: 'keyword' },
            dms_status: { type: 'keyword' },
            checklist_requested: { type: 'boolean' },
            quality_check_from: { type: 'keyword' },
            package_finalize: { type: 'keyword' },
            deadline: { type: 'date', ignore_malformed: true },
            created_time: { type: 'date', ignore_malformed: true },
            modified_time: { type: 'date', ignore_malformed: true },
            main_applicant: { type: 'keyword' },
        },
    },
};
// ─── Client (lazy singleton) ──────────────────────────────────────────────────
let _client = null;
function getClient() {
    if (_client)
        return _client;
    const node = process.env.OPENSEARCH_URL;
    if (!node)
        throw new Error('[OpenSearch] OPENSEARCH_URL environment variable is not set');
    _client = new opensearch_1.Client({
        node,
        auth: {
            username: process.env.OPENSEARCH_USERNAME,
            password: process.env.OPENSEARCH_PASSWORD,
        },
        ssl: { rejectUnauthorized: false },
        requestTimeout: 10000,
        maxRetries: 3,
    });
    return _client;
}
// ─── Index Bootstrap ──────────────────────────────────────────────────────────
/**
 * Idempotent — safe to call on every startup.
 * Auto-migrates from old mapping (zoho_id) to new (lead_id) by deleting + recreating.
 */
async function ensureIndex() {
    const client = getClient();
    try {
        const exists = await client.indices.exists({ index: INDEX });
        if (exists.body) {
            const mapping = await client.indices.getMapping({ index: INDEX });
            const props = mapping.body?.[INDEX]?.mappings?.properties ?? {};
            if (props['zoho_id']) {
                logger.info(`[OpenSearch] Old mapping detected (zoho_id) — deleting and recreating index`);
                await client.indices.delete({ index: INDEX });
            }
            else {
                logger.info(`[OpenSearch] Index "${INDEX}" already exists — skipping creation`);
                return;
            }
        }
        await client.indices.create({ index: INDEX, body: INDEX_MAPPING });
        logger.info(`[OpenSearch] Index "${INDEX}" created successfully`);
    }
    catch (err) {
        if (err?.meta?.body?.error?.type === 'resource_already_exists_exception') {
            logger.info(`[OpenSearch] Index "${INDEX}" already exists (race condition — harmless)`);
            return;
        }
        logger.error('[OpenSearch] Failed to ensure index', { error: err.message });
        throw err;
    }
}
// ─── Document Mapping ─────────────────────────────────────────────────────────
function toDate(val) {
    if (!val)
        return null;
    if (val instanceof Date)
        return val.toISOString();
    return String(val);
}
function toDocument(record) {
    return {
        lead_id: record.lead_id,
        name: record.name ?? null,
        full_name: record.full_name ?? null,
        email: record.email ?? null,
        phone: record.phone ?? null,
        country: record.qualified_country ?? null,
        stage: record.application_stage ?? null,
        service_type: record.service_type ?? null,
        application_state: record.application_state ?? null,
        record_type: record.record_type ?? null,
        handled_by: record.lead_owner ?? null,
        dms_status: record.dms_application_status ?? null,
        checklist_requested: record.checklist_requested ?? false,
        quality_check_from: record.quality_check_from ?? null,
        package_finalize: record.package_finalize ?? null,
        deadline: record.deadline_for_lodgment ?? null,
        created_time: toDate(record.created_at),
        modified_time: toDate(record.zoho_modified_time),
        main_applicant: record.main_applicant ?? null,
    };
}
// ─── Upsert ───────────────────────────────────────────────────────────────────
async function upsertApplication(record) {
    if (!record.lead_id) {
        logger.warn('[OpenSearch] upsertApplication called with record missing lead_id — skipping');
        return;
    }
    const client = getClient();
    await client.index({
        index: INDEX,
        id: record.lead_id,
        body: toDocument(record),
        refresh: false,
    });
}
async function bulkUpsertApplications(records) {
    if (records.length === 0)
        return;
    const client = getClient();
    const body = [];
    for (const record of records) {
        if (!record.lead_id)
            continue;
        body.push({ index: { _index: INDEX, _id: record.lead_id } });
        body.push(toDocument(record));
    }
    if (body.length === 0)
        return;
    const { body: result } = await client.bulk({ body, refresh: false });
    if (result.errors) {
        const failed = result.items
            .filter(item => item.index?.error)
            .map(item => ({ id: item.index?._id, error: item.index?.error?.reason }));
        logger.error('[OpenSearch] Bulk upsert had errors', { count: failed.length, sample: failed.slice(0, 3) });
    }
    else {
        logger.info(`[OpenSearch] Bulk upsert completed`, { count: records.length });
    }
}
// ─── Delete ───────────────────────────────────────────────────────────────────
async function deleteApplication(leadId) {
    if (!leadId)
        return;
    const client = getClient();
    try {
        await client.delete({ index: INDEX, id: leadId, refresh: false });
    }
    catch (err) {
        if (err?.meta?.statusCode !== 404) {
            logger.error('[OpenSearch] Failed to delete document', { leadId, error: err.message });
        }
    }
}
async function searchApplications(query, options = {}) {
    const trimmed = query?.trim();
    if (!trimmed)
        return [];
    const { size = 20 } = options;
    const client = getClient();
    const isLeadId = /^\d{4,}$/.test(trimmed);
    const searchBody = isLeadId
        ? { query: { term: { lead_id: trimmed } } }
        : {
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: trimmed,
                                fields: ['name^3', 'full_name^2', 'email^2', 'phone'],
                                fuzziness: 'AUTO',
                                prefix_length: 1,
                                operator: 'or',
                            },
                        },
                        { match: { name: { query: trimmed, analyzer: 'standard', boost: 1.5 } } },
                        { match_phrase_prefix: { name: { query: trimmed, boost: 2 } } },
                        { match_phrase_prefix: { full_name: { query: trimmed, boost: 1.5 } } },
                    ],
                    minimum_should_match: 1,
                },
            },
        };
    const { body } = await client.search({
        index: INDEX,
        body: {
            ...searchBody,
            size,
            sort: [{ _score: 'desc' }, { created_time: { order: 'desc', unmapped_type: 'date' } }],
            _source: true,
        },
    });
    return (body.hits?.hits ?? []).map((hit) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
    }));
}
// ─── Health ───────────────────────────────────────────────────────────────────
async function ping() {
    try {
        const client = getClient();
        await client.ping();
        return true;
    }
    catch {
        return false;
    }
}
