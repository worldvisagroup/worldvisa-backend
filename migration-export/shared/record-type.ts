export const RECORD_TYPES = ['visa_application', 'spouse_skill_assessment'] as const;

export type RecordType = (typeof RECORD_TYPES)[number];
