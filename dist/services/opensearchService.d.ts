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
export declare function isOpenSearchConfigured(): boolean;
export declare function getOpenSearchClient(): Client | null;
/**
 * Create the applications index with mappings if it does not exist.
 */
export declare function ensureIndex(): Promise<void>;
/**
 * Index or replace one application document. Uses lead_id as _id when present.
 */
export declare function indexApplication(doc: ApplicationIndexDocument, idOverride?: string): Promise<void>;
export declare function removeApplication(leadId: string): Promise<void>;
/**
 * Full-text search across indexed applications (global admin search).
 */
export declare function searchApplications(query: string, options?: SearchOptions): Promise<SearchHit[]>;
