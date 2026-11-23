import { toIsoOrNull } from '../../../shared/iso-date';
import type { RecordType } from '../../../shared/record-type';
import type { ApplicationResponseDto } from '../../dtos/application-response.dto';

export interface ApplicationRow {
  _id: { toString(): string };
  lead_id: string;
  record_type?: RecordType | null;
  name: string;
  full_name?: string | null;
  email: string;
  phone: string;
  lead_owner: string;
  application_state?: string | null;
  application_stage?: string | null;
  dms_application_status?: string | null;
  qualified_country?: string | null;
  service_type?: string | null;
  deadline_for_lodgment?: string | null;
  main_applicant?: string | null;
  spouse_name?: string | null;
  spouse_skill_assessment?: string | null;
  package_finalize?: string | null;
  suggested_anzsco?: string | null;
  assessing_authority?: string | null;
  quality_check_from?: string | null;
  recent_activity?: Date | null;
  role?: string | null;
  account_status?: string | null;
  zoho_created_time?: Date | null;
  zoho_modified_time?: Date | null;
  created_at?: Date | null;
}

export const APPLICATION_COLUMNS = [
  'lead_id',
  'record_type',
  'name',
  'full_name',
  'email',
  'phone',
  'lead_owner',
  'application_state',
  'application_stage',
  'dms_application_status',
  'qualified_country',
  'service_type',
  'deadline_for_lodgment',
  'main_applicant',
  'spouse_name',
  'spouse_skill_assessment',
  'package_finalize',
  'suggested_anzsco',
  'assessing_authority',
  'quality_check_from',
  'recent_activity',
  'role',
  'account_status',
  'zoho_created_time',
  'zoho_modified_time',
  'created_at',
] as const satisfies ReadonlyArray<keyof ApplicationRow>;

export const mapApplicationToDto = (row: ApplicationRow): ApplicationResponseDto => ({
  externalId: row._id.toString(),
  leadId: row.lead_id,
  recordType: row.record_type ?? null,
  name: row.name,
  fullName: row.full_name ?? null,
  email: row.email,
  phone: row.phone,
  leadOwner: row.lead_owner,
  applicationState: row.application_state ?? null,
  applicationStage: row.application_stage ?? null,
  dmsApplicationStatus: row.dms_application_status ?? null,
  qualifiedCountry: row.qualified_country ?? null,
  serviceType: row.service_type ?? null,
  deadlineForLodgment: row.deadline_for_lodgment ?? null,
  mainApplicant: row.main_applicant ?? null,
  spouseName: row.spouse_name ?? null,
  spouseSkillAssessment: row.spouse_skill_assessment ?? null,
  packageFinalize: row.package_finalize ?? null,
  suggestedAnzsco: row.suggested_anzsco ?? null,
  assessingAuthority: row.assessing_authority ?? null,
  qualityCheckFrom: row.quality_check_from ?? null,
  recentActivity: toIsoOrNull(row.recent_activity),
  role: row.role ?? null,
  accountStatus: row.account_status ?? null,
  createdAt: toIsoOrNull(row.zoho_created_time),
  modifiedAt: toIsoOrNull(row.zoho_modified_time),
  dmsCreatedAt: toIsoOrNull(row.created_at),
});
