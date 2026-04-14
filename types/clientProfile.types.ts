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
};
