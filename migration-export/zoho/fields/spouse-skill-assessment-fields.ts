/**
 * Allow list for the Zoho `Spouse_Skill_Assessment` module (D24), `output name -> Zoho API name`.
 * Output names follow the layout labels of the "Spouse Skill Assessment Information" section.
 * Left out on purpose: email, phone, stage, reminder, automation, system and portal fields (`DMS_*`).
 */
export const SPOUSE_SKILL_ASSESSMENT = {
  assessingAuthority: 'Spouse_s_Skill_Assessing_Authority',
  anzsco: 'Spouse_ANZSCO',
  outcomeDate: 'Spouse_Date_of_OutCome',
  validUpto: 'Spouse_Out_Come_Validity',
  experienceConsidered: 'Spouse_Experience_Considered',
  education: 'Spouse_Education',
} as const;

// Lookup to the main applicant's `Visa_Applications` record; read through `lookupId`, never through `pickFields`.
export const MAIN_APPLICATION_LOOKUP = 'Visa_Applications';

export const SPOUSE_SKILL_ASSESSMENT_FIELDS: readonly string[] = [MAIN_APPLICATION_LOOKUP, ...Object.values(SPOUSE_SKILL_ASSESSMENT)];
