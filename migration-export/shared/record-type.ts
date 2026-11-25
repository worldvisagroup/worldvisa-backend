export const RECORD_TYPES = ['visa_application', 'spouse_skill_assessment'] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export const ZOHO_MODULE_BY_RECORD_TYPE: Record<RecordType, string> = {
  visa_application: 'Visa_Applications',
  spouse_skill_assessment: 'Spouse_Skill_Assessment',
};
