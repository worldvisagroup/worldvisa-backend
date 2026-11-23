import type { RecordType } from '../../shared/record-type';

export interface ApplicationResponseDto {
  externalId: string;
  leadId: string;
  recordType: RecordType | null;
  name: string;
  fullName: string | null;
  email: string;
  phone: string;
  leadOwner: string;
  applicationState: string | null;
  applicationStage: string | null;
  dmsApplicationStatus: string | null;
  qualifiedCountry: string | null;
  serviceType: string | null;
  deadlineForLodgment: string | null;
  mainApplicant: string | null;
  spouseName: string | null;
  spouseSkillAssessment: string | null;
  packageFinalize: string | null;
  suggestedAnzsco: string | null;
  assessingAuthority: string | null;
  qualityCheckFrom: string | null;
  recentActivity: string | null;
  role: string | null;
  accountStatus: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  dmsCreatedAt: string | null;
}
