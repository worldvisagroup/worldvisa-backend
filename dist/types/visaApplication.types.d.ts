export interface AuthUser {
    username?: string;
    role?: string;
    lead_id?: string;
    record_type?: string;
    [key: string]: unknown;
}
export interface OnboardingStatus {
    client_record_exists: boolean;
    clerk_id: string | null;
    clerk_invitation_id: string | null;
    account_status: string | null;
    email_verified: boolean | null;
}
/** Loose shape for records returned by the Zoho COQL API. */
export type ZohoRecord = Record<string, unknown> & {
    id: string;
};
export interface ZohoApiResponse {
    data?: ZohoRecord[];
}
export interface ApplicationFilterResult {
    data: ZohoRecord[];
    info: {
        count: number;
    };
}
export interface ApplicationNote {
    _id: unknown;
    note: string;
    addedBy: string;
    addedAt: Date;
}
export interface QcRequestInfo {
    qcId: unknown;
    status: string;
    requested_at: Date;
    requested_by: string;
    requested_to: string;
}
export type ActivityType = 'application_created' | 'document_uploaded' | 'document_reuploaded' | 'document_status_changed' | 'comment_added' | 'comment_edited' | 'comment_deleted' | 'review_requested' | 'review_status_updated' | 'review_cancelled' | 'review_message_added' | 'quality_check_requested' | 'quality_check_removed' | 'checklist_created' | 'checklist_updated' | 'checklist_deleted' | 'note_added' | 'note_updated' | 'note_deleted' | 'email_sent' | 'email_received';
export interface ActivityLogEntry {
    _id: unknown;
    lead_id: string;
    activity_type: ActivityType;
    summary: string;
    actor_type: 'staff' | 'client' | 'system';
    actor_name: string;
    actor_role: string | null;
    document_id: unknown | null;
    document_name: string | null;
    document_category: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface DayGroup {
    /** Human-readable label: "Monday, March 30, 2026" */
    label: string;
    /** ISO date string used for sorting: "2026-03-30" */
    dateKey: string;
    entries: ActivityLogEntry[];
}
export type RecordType = 'visa_application' | 'spouse_skill_assessment';
export interface ActivityLogPdfParams {
    clientName: string;
    recordType: RecordType;
    generatedAt: Date;
    dayGroups: DayGroup[];
    logoDataUri: string | null;
    totalEntries: number;
}
