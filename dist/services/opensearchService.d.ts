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
import { Client } from '@opensearch-project/opensearch';
export interface MongoRecord {
    lead_id: string;
    name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    qualified_country?: string;
    application_stage?: string;
    service_type?: string;
    application_state?: string;
    record_type?: string;
    lead_owner?: string;
    dms_application_status?: string;
    checklist_requested?: boolean;
    quality_check_from?: string;
    package_finalize?: string;
    deadline_for_lodgment?: string | null;
    created_at?: Date | string | null;
    zoho_modified_time?: Date | string | null;
    main_applicant?: string;
}
export interface ApplicationDocument {
    lead_id: string;
    name: string | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    stage: string | null;
    service_type: string | null;
    application_state: string | null;
    record_type: string | null;
    handled_by: string | null;
    dms_status: string | null;
    checklist_requested: boolean;
    quality_check_from: string | null;
    package_finalize: string | null;
    deadline: string | null;
    created_time: string | null;
    modified_time: string | null;
    main_applicant: string | null;
}
export interface SearchHit {
    id: string;
    score: number;
    source: ApplicationDocument;
}
export declare function getClient(): Client;
/**
 * Idempotent — safe to call on every startup.
 * Auto-migrates from old mapping (zoho_id) to new (lead_id) by deleting + recreating.
 */
export declare function ensureIndex(): Promise<void>;
export declare function upsertApplication(record: MongoRecord): Promise<void>;
export declare function bulkUpsertApplications(records: MongoRecord[]): Promise<void>;
export declare function deleteApplication(leadId: string): Promise<void>;
export interface SearchOptions {
    size?: number;
}
export declare function searchApplications(query: string, options?: SearchOptions): Promise<SearchHit[]>;
export declare function ping(): Promise<boolean>;
