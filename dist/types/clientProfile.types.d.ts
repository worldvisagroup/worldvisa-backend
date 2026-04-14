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
