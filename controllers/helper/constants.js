const REQ_MODULE_VISA_APPLICATION = 'visa_application';
const REQ_MODULE_SPOUSE_SKILL_ASSESSMENT = 'spouse_skill_assessment';

const MODULE_VISA_APPLICATION = 'Visa_Applications';
const MODULE_SPOUSE_SKILL_ASSESSMENT = 'Spouse_Skill_Assessment';

// Filter constants for visa applications
const APPLICATION_STATE_ACTIVE = 'Active';
const QUALIFIED_COUNTRY_AUSTRALIA = 'Australia';
const QUALIFIED_COUNTRY_CANADA = 'Canada';
const SUPPORTED_COUNTRIES = ['Australia', 'Canada'];
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

const APPLICATION_STAGES_CANADA = [
  'Skill Assessment stage',
  'Stage 1 Documentation: Approved',
  'SA Application Lodge',
  'Stage 1 Milestone Completed',
  'Language Test',
  'Lodge Application 1',
  'Application Lodged',
  'Lodge Application 2',
  'Lodge Application 3',
  'INIVITATION TO APPLY',
  'Inivitation to Apply',
  'Stage 3 Documentation: Approved',
  'VA Application Lodge',
  'Stage 3 Visa Application',
  'LODGE APPLICATION',
  'Visa Grant'
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

const SEARCH_TERM_MAX_LENGTH = 100;
const VISA_LIST_SEARCH_COQL_MAX = 200;

// Simplified field list for deadline statistics
const DEADLINE_STATS_FIELDS = [
  'id',
  'Record_Type',
  'Name',
  'Phone',
  'Email',
  'Application_Handled_By',
  'Created_Time',
  'Recent_Activity',
  'Deadline_For_Lodgment'
];

// Role-based access control - these roles can see ALL applications
const ADMIN_ROLES = ['master_admin', 'team_leader', 'supervisor'];

// Notification source enum for Zoho DMS notifications (origin/context for frontend)
const NOTIFICATION_SOURCES = ['document_review', 'requested_reviews', 'quality_check', 'requested_checklist', 'general', 'chat'];

module.exports = {
  MODULE_VISA_APPLICATION,
  MODULE_SPOUSE_SKILL_ASSESSMENT,
  REQ_MODULE_VISA_APPLICATION,
  REQ_MODULE_SPOUSE_SKILL_ASSESSMENT,
  APPLICATION_STATE_ACTIVE,
  QUALIFIED_COUNTRY_AUSTRALIA,
  QUALIFIED_COUNTRY_CANADA,
  SUPPORTED_COUNTRIES,
  SERVICE_FINALIZED_PERMANENT_RESIDENCY,
  APPLICATION_STAGES,
  APPLICATION_STAGES_CANADA,
  STAGE_1_STAGES,
  MIN_PAGE,
  MIN_LIMIT,
  MAX_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  SEARCH_TERM_MAX_LENGTH,
  VISA_LIST_SEARCH_COQL_MAX,
  DEADLINE_STATS_FIELDS,
  ADMIN_ROLES,
  NOTIFICATION_SOURCES,
};
