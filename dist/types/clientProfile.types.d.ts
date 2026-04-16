export interface ClientProfileData {
    _id: string;
    name: string;
    email: string;
    phone: string;
    lead_id: string;
    record_type: string;
    profile_image_url: string | null;
    suggested_anzsco: string | null;
    assessing_authority: string | null;
    service_type: string | null;
    /** Zoho CRM snapshot (read-only; synced on detail fetches) */
    lead_owner: string;
    application_stage: string | null;
    dms_application_status: string | null;
    qualified_country: string | null;
    deadline_for_lodgment: string | null;
    recent_activity: Date | null;
    zoho_created_time: Date | null;
    checklist_requested: boolean;
    send_check_list: string | null;
    spouse_skill_assessment: string | null;
    spouse_name: string | null;
    main_applicant: string | null;
    application_state: string | null;
    quality_check_from: string | null;
}
export interface UpdateClientProfileBody {
    name?: string;
    email?: string;
    phone?: string;
    record_type?: string;
    profile_image_url?: string;
    suggested_anzsco?: string;
    assessing_authority?: string;
    service_type?: string;
}
export type AllowedProfileField = keyof UpdateClientProfileBody;
export declare const ALLOWED_PROFILE_FIELDS: readonly AllowedProfileField[];
export declare const PROFILE_PROJECTION: Record<string, 1>;
