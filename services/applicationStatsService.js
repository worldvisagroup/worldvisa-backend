const moment = require('moment');
const { zohoRequest } = require('../controllers/zohoDms/zohoApi.js');
const CoqlQueryBuilder = require('../utils/coqlQueryBuilder');
const {
  MODULE_VISA_APPLICATION,
  MODULE_SPOUSE_SKILL_ASSESSMENT,
  APPLICATION_STATE_ACTIVE,
  QUALIFIED_COUNTRY_AUSTRALIA,
  SERVICE_FINALIZED_PERMANENT_RESIDENCY,
  STAGE_1_STAGES
} = require('../controllers/helper/constants.js');

/**
 * Validates and parses a deadline date string
 * @param {string} deadlineStr - ISO 8601 date string
 * @returns {moment.Moment|null} - Parsed moment object or null if invalid
 */
const validateAndParseDeadline = (deadlineStr) => {
  if (!deadlineStr) return null;

  const deadline = moment.utc(deadlineStr);

  if (!deadline.isValid()) {
    console.warn(`Invalid deadline format: ${deadlineStr}`);
    return null;
  }

  return deadline;
};

/**
 * Categorizes applications based on their deadline status
 * @param {Array} applications - Array of applications with deadline field
 * @returns {Object} - Categorized applications
 */
const categorizeApplications = (applications) => {
  const now = moment();
  const categories = {
    approaching: [],
    overdue: [],
    noDeadline: [],
    future: []
  };

  applications.forEach(app => {
    const deadline = validateAndParseDeadline(app.Deadline_For_Lodgment);

    if (!deadline) {
      categories.noDeadline.push({
        id: app.id,
        name: app.Name,
        stage: app.Application_Stage,
        type: app._source
      });
      return;
    }

    const daysUntil = deadline.diff(now, 'days');

    if (daysUntil < 0) {
      categories.overdue.push({
        id: app.id,
        name: app.Name,
        deadline: app.Deadline_For_Lodgment,
        daysOverdue: Math.abs(daysUntil),
        stage: app.Application_Stage,
        type: app._source
      });
    } else if (daysUntil >= 0 && daysUntil <= 30) {
      categories.approaching.push({
        id: app.id,
        name: app.Name,
        deadline: app.Deadline_For_Lodgment,
        daysUntil: daysUntil,
        stage: app.Application_Stage,
        type: app._source
      });
    } else {
      categories.future.push({
        id: app.id,
        name: app.Name,
        deadline: app.Deadline_For_Lodgment,
        daysUntil: daysUntil,
        stage: app.Application_Stage,
        type: app._source
      });
    }
  });

  return categories;
};

/**
 * Builds a COQL query for Stage 1 Visa Applications
 * @returns {string} - COQL query string
 */
const buildVisaStage1Query = () => {
  // Build query manually (matching EXACT pattern from visaApplicationController.js lines 54-93)
  const stagesStr = STAGE_1_STAGES.map(s => `'${s}'`).join(', ');

  // IMPORTANT: Match the exact pattern - start with basic WHERE, then add filters with 'and'
  const query = `select id, Name, Deadline_For_Lodgment, Application_Stage from ${MODULE_VISA_APPLICATION} where id is not null and ((((Application_State = '${APPLICATION_STATE_ACTIVE}') and (Qualified_Country = '${QUALIFIED_COUNTRY_AUSTRALIA}')) and (Service_Finalized = '${SERVICE_FINALIZED_PERMANENT_RESIDENCY}')) and (Application_Stage in (${stagesStr})))`;

  return query;
};

/**
 * Builds a COQL query for Stage 1 Spouse Applications
 * Note: Spouse module doesn't use Application_State, Qualified_Country, or Service_Finalized filters
 * @returns {string} - COQL query string
 */
const buildSpouseStage1Query = () => {
  // Build query manually - Spouse applications only filter by Stage (matching existing pattern)
  const stagesStr = STAGE_1_STAGES.map(s => `'${s}'`).join(', ');

  // Match the same pattern - start with basic WHERE condition
  const query = `select id, Name, Deadline_For_Lodgment, Application_Stage from ${MODULE_SPOUSE_SKILL_ASSESSMENT} where id is not null and Application_Stage in (${stagesStr})`;

  return query;
};

/**
 * Fetches and calculates deadline statistics for Stage 1 applications
 * @param {string} type - Optional filter: 'visa', 'spouse', or undefined (both)
 * @returns {Promise<Object>} - Deadline statistics with summary and details
 */
const getDeadlineStatistics = async (type = null) => {
  try {
    console.log(`Fetching deadline statistics (type: ${type || 'all'})...`);

    let visaApps = [];
    let spouseApps = [];

    // Execute queries based on type filter
    if (!type || type === 'visa') {
      const visaQuery = buildVisaStage1Query();
      console.log('Visa Query:', visaQuery);
      console.log('Executing Visa query...');

      try {
        const visaResponse = await zohoRequest("coql", "POST", { select_query: visaQuery });
        visaApps = (visaResponse?.data || []).map(app => ({ ...app, _source: 'visa' }));
        console.log('✅ Visa query succeeded, got', visaApps.length, 'results');
      } catch (visaError) {
        console.error('❌ Visa query failed:', visaError.response?.data || visaError.message);
        throw visaError;
      }
    }

    if (!type || type === 'spouse') {
      const spouseQuery = buildSpouseStage1Query();
      console.log('Spouse Query:', spouseQuery);
      console.log('Executing Spouse query...');

      try {
        const spouseResponse = await zohoRequest("coql", "POST", { select_query: spouseQuery });
        spouseApps = (spouseResponse?.data || []).map(app => ({ ...app, _source: 'spouse' }));
        console.log('✅ Spouse query succeeded, got', spouseApps.length, 'results');
      } catch (spouseError) {
        console.error('❌ Spouse query failed:', spouseError.response?.data || spouseError.message);
        throw spouseError;
      }
    }

    console.log(`Fetched ${visaApps.length} visa applications, ${spouseApps.length} spouse applications`);

    // Merge all applications
    const allApplications = [...visaApps, ...spouseApps];

    // Categorize applications by deadline status
    const categories = categorizeApplications(allApplications);

    console.log(`Categorized: ${categories.approaching.length} approaching, ${categories.overdue.length} overdue, ${categories.noDeadline.length} no deadline`);

    // Build response object
    const statistics = {
      summary: {
        total: allApplications.length,
        approaching: categories.approaching.length,
        overdue: categories.overdue.length,
        noDeadline: categories.noDeadline.length
      },
      details: {
        approaching: categories.approaching,
        overdue: categories.overdue,
        noDeadline: categories.noDeadline
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheExpiry: 300 // 5 minutes in seconds
      }
    };

    return statistics;
  } catch (error) {
    console.error('Error in getDeadlineStatistics:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    throw new Error(`Failed to fetch deadline statistics: ${error.message}`);
  }
};

module.exports = {
  getDeadlineStatistics,
  categorizeApplications,
  validateAndParseDeadline,
  buildVisaStage1Query,
  buildSpouseStage1Query
};
