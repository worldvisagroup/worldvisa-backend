const REQ_MODULE_VISA_APPLICATION = 'visa_application';
const REQ_MODULE_SPOUSE_SKILL_ASSESSMENT = 'spouse_skill_assessment';

const MODULE_VISA_APPLICATION = 'Visa_Applications';
const MODULE_SPOUSE_SKILL_ASSESSMENT = 'Spouse_Skill_Assessment';

// Filter constants for visa applications
const APPLICATION_STATE_ACTIVE = 'Active';
const QUALIFIED_COUNTRY_AUSTRALIA = 'Australia';
const SERVICE_FINALIZED_PERMANENT_RESIDENCY = 'Permanent Residency';

const APPLICATION_STAGES = [
  'Stage 1 Documentation: Approved',
  'Stage 1 Documentation: Rejected',
  'Stage 1 Milestone Completed',
  'Stage 1 Documentation Reviewed',
  'Skill Assessment Stage',
  'Language Test',
  'Lodge Application 1',
  'Lodge Application 2',
  'Lodge Application 3',
  'Lodge Application 4',
  'INIVITATION TO APPLY',
  'Invitation to Apply',
  'Invitation to Apply 2',
  'VA Application Lodge',
  'Stage 3 Documentation: Approved',
  'Stage 3 Visa Application',
  'SEND CHECKLIST'
];

// Stage 1 specific stages for deadline tracking
const STAGE_1_STAGES = [
  'Stage 1 Documentation: Approved',
  'Stage 1 Documentation: Rejected',
  'Stage 1 Milestone Completed',
  'Stage 1 Documentation Reviewed',
  'Skill Assessment Stage'
];

// Pagination limits
const MIN_PAGE = 1;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;


module.exports = {
  MODULE_VISA_APPLICATION,
  MODULE_SPOUSE_SKILL_ASSESSMENT,
  REQ_MODULE_VISA_APPLICATION,
  REQ_MODULE_SPOUSE_SKILL_ASSESSMENT,
  APPLICATION_STATE_ACTIVE,
  QUALIFIED_COUNTRY_AUSTRALIA,
  SERVICE_FINALIZED_PERMANENT_RESIDENCY,
  APPLICATION_STAGES,
  STAGE_1_STAGES,
  MIN_PAGE,
  MIN_LIMIT,
  MAX_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
};
