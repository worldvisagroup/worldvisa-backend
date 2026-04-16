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

export const ALLOWED_PROFILE_FIELDS: readonly AllowedProfileField[] = [
  'name',
  'email',
  'phone',
  'record_type',
  'profile_image_url',
  'suggested_anzsco',
  'assessing_authority',
  'service_type',
] as const;

export const PROFILE_PROJECTION: Record<string, 1> = {
  _id: 1,
  name: 1,
  email: 1,
  phone: 1,
  lead_id: 1,
  record_type: 1,
  profile_image_url: 1,
  suggested_anzsco: 1,
  assessing_authority: 1,
  service_type: 1,
  lead_owner: 1,
  application_stage: 1,
  dms_application_status: 1,
  qualified_country: 1,
  deadline_for_lodgment: 1,
  recent_activity: 1,
  zoho_created_time: 1,
  checklist_requested: 1,
  send_check_list: 1,
  spouse_skill_assessment: 1,
  spouse_name: 1,
  main_applicant: 1,
  application_state: 1,
  quality_check_from: 1,
};
