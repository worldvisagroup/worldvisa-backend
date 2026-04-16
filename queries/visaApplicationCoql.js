/**
 * COQL query builders for Visa Applications and Spouse Skill Assessment modules.
 * All functions return a plain query string — no business logic, no side effects.
 */

// ─── Field Lists ──────────────────────────────────────────────────────────────

const VISA_LIST_FIELDS = [
  'Name', 'id', 'Application_Handled_By', 'Created_Time', 'Email', 'Phone',
  'Quality_Check_From', 'DMS_Application_Status', 'Package_Finalize',
  'Checklist_Requested', 'Deadline_For_Lodgment', 'Record_Type',
  'Recent_Activity', 'Application_Stage', 'Application_State',
  'Service_Finalized', 'Qualified_Country',
].join(', ');

const VISA_DETAIL_FIELDS = [
  'Email', 'Name', 'Application_Handled_By', 'Phone', 'id', 'Created_Time',
  'Send_Check_List', 'Assessing_Authority', 'Qualified_Country',
  'Service_Finalized', 'Suggested_Anzsco', 'DMS_Application_Status',
  'Package_Finalize', 'Spouse_Skill_Assessment', 'Spouse_Name',
  'Checklist_Requested', 'Deadline_For_Lodgment', 'Record_Type',
  'Recent_Activity', 'Application_Stage',
].join(', ');

const SPOUSE_LIST_FIELDS = [
  'Name', 'id', 'Application_Handled_By', 'Created_Time', 'Email', 'Phone',
  'DMS_Application_Status', 'Checklist_Requested', 'Record_Type',
  'Recent_Activity', 'Application_Stage', 'Suggested_Anzsco',
  'Assessing_Authority', 'Service_Finalized', 'Main_Applicant',
].join(', ');

const SPOUSE_DETAIL_FIELDS = [
  'Email', 'Name', 'Application_Handled_By', 'Phone', 'id', 'Created_Time',
  'Send_Check_List', 'Assessing_Authority', 'Qualified_Country',
  'Service_Finalized', 'Suggested_Anzsco', 'DMS_Application_Status',
  'Package_Finalize', 'Checklist_Requested', 'Deadline_For_Lodgment',
  'Record_Type', 'Recent_Activity', 'Application_Stage', 'Main_Applicant',
].join(', ');

// Client-facing detail fields (shared between visa_application and spouse_skill_assessment)
const CLIENT_APPLICATION_FIELDS = [
  'Email', 'Name', 'Application_Handled_By', 'Phone', 'id',
  'Send_Check_List', 'Assessing_Authority', 'Qualified_Country',
  'Service_Finalized', 'Suggested_Anzsco', 'DMS_Application_Status',
  'Package_Finalize', 'Checklist_Requested', 'Deadline_For_Lodgment',
  'Created_Time', 'Record_Type', 'Recent_Activity', 'Application_Stage',
].join(', ');

// ─── Visa Application Queries ─────────────────────────────────────────────────

/**
 * Count query for paginated visa application list.
 * Returns a single row: { total: N }
 */
function buildVisaApplicationCountQuery(whereClause, coreFilters) {
  return `select COUNT(id) as total from Visa_Applications${whereClause}${coreFilters}`;
}

/**
 * Paginated list query for visa applications.
 */
function buildVisaApplicationListQuery(whereClause, coreFilters, orderBy, limit, offset) {
  return (
    `select ${VISA_LIST_FIELDS} from Visa_Applications` +
    `${whereClause}${coreFilters}` +
    ` order by ${orderBy} desc limit ${limit} offset ${offset}`
  );
}

/**
 * Single visa application by Zoho record ID.
 */
function buildVisaApplicationDetailQuery(applicationId) {
  return `select ${VISA_DETAIL_FIELDS} from Visa_Applications where id = '${applicationId}'`;
}

// ─── Spouse Skill Assessment Queries ─────────────────────────────────────────

/**
 * Count query for paginated spouse application list.
 * Returns a single row: { total: N }
 */
function buildSpouseApplicationCountQuery(whereClause, additionalFilters) {
  return `select COUNT(id) as total from Spouse_Skill_Assessment${whereClause}${additionalFilters}`;
}

/**
 * Paginated list query for spouse skill assessment applications.
 */
function buildSpouseApplicationListQuery(whereClause, additionalFilters, orderBy, limit, offset) {
  return (
    `select ${SPOUSE_LIST_FIELDS} from Spouse_Skill_Assessment` +
    `${whereClause}${additionalFilters}` +
    ` order by ${orderBy} desc limit ${limit} offset ${offset}`
  );
}

/**
 * Single spouse skill assessment application by Zoho record ID.
 */
function buildSpouseApplicationDetailQuery(applicationId) {
  return `select ${SPOUSE_DETAIL_FIELDS} from Spouse_Skill_Assessment where id = '${applicationId}'`;
}

// ─── Client-Facing Query ──────────────────────────────────────────────────────

/**
 * Client-facing single application query.
 * moduleName is either Visa_Applications or Spouse_Skill_Assessment.
 */
function buildClientApplicationDetailQuery(applicationId, moduleName) {
  return `select ${CLIENT_APPLICATION_FIELDS} from ${moduleName} where id = '${applicationId}'`;
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  VISA_DETAIL_FIELDS,
  SPOUSE_DETAIL_FIELDS,
  buildVisaApplicationCountQuery,
  buildVisaApplicationListQuery,
  buildVisaApplicationDetailQuery,
  buildSpouseApplicationCountQuery,
  buildSpouseApplicationListQuery,
  buildSpouseApplicationDetailQuery,
  buildClientApplicationDetailQuery,
};
