const moment = require('moment');
const { zohoRequest } = require('../controllers/zohoDms/zohoApi.js');
const CoqlQueryBuilder = require('../utils/coqlQueryBuilder');
const dmsZohoDocument = require('../models/dmsZohoDocument');
const {
  MODULE_VISA_APPLICATION,
  MODULE_SPOUSE_SKILL_ASSESSMENT,
  APPLICATION_STATE_ACTIVE,
  QUALIFIED_COUNTRY_AUSTRALIA,
  SERVICE_FINALIZED_PERMANENT_RESIDENCY,
  STAGE_1_STAGES,
  DEADLINE_STATS_FIELDS,
  ADMIN_ROLES
} = require('../controllers/helper/constants.js');


const validateAndParseDeadline = (deadlineStr) => {
  if (!deadlineStr) return null;

  const deadline = moment.utc(deadlineStr);

  if (!deadline.isValid()) {
    console.warn(`Invalid deadline format: ${deadlineStr}`);
    return null;
  }

  return deadline;
};


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


// Enhanced categorization that tracks IDs for paginated fetching
const categorizeApplicationsWithIds = (applications) => {
  const now = moment();
  const categories = {
    approaching: { ids: [], applications: [], daysMap: new Map() },
    overdue: { ids: [], applications: [], daysMap: new Map() },
    noDeadline: { ids: [], applications: [] }
  };

  applications.forEach(app => {
    const deadline = validateAndParseDeadline(app.Deadline_For_Lodgment);

    if (!deadline) {
      categories.noDeadline.ids.push(app.id);
      categories.noDeadline.applications.push(app);
      return;
    }

    const daysUntil = deadline.diff(now, 'days');

    if (daysUntil < 0) {
      categories.overdue.ids.push(app.id);
      categories.overdue.applications.push(app);
      categories.overdue.daysMap.set(app.id, Math.abs(daysUntil));
    } else if (daysUntil >= 0 && daysUntil <= 30) {
      categories.approaching.ids.push(app.id);
      categories.approaching.applications.push(app);
      categories.approaching.daysMap.set(app.id, daysUntil);
    }
  });

  return categories;
};


// Fetch detailed application data for a specific category with pagination
const getDetailedCategoryApplications = async (categoryData, visaApps, spouseApps, page, limit) => {
  if (!categoryData.ids || categoryData.ids.length === 0) {
    return { data: [], total: 0 };
  }

  const offset = (page - 1) * limit;
  const paginatedIds = categoryData.ids.slice(offset, offset + limit);

  if (paginatedIds.length === 0) {
    return { data: [], total: categoryData.ids.length };
  }

  // Separate IDs by type (visa or spouse)
  const visaIds = [];
  const spouseIds = [];

  paginatedIds.forEach(id => {
    if (visaApps.find(app => app.id === id)) {
      visaIds.push(id);
    } else if (spouseApps.find(app => app.id === id)) {
      spouseIds.push(id);
    }
  });

  // Query both modules in parallel if we have mixed types
  const queries = [];

  if (visaIds.length > 0) {
    const visaBuilder = new CoqlQueryBuilder(MODULE_VISA_APPLICATION);
    visaBuilder
      .select(DEADLINE_STATS_FIELDS)
      .whereIn('id', visaIds)
      .orderBy('Deadline_For_Lodgment', 'asc');
    queries.push(zohoRequest("coql", "POST", { select_query: visaBuilder.build() }));
  } else {
    queries.push(Promise.resolve({ data: [] }));
  }

  if (spouseIds.length > 0) {
    const spouseBuilder = new CoqlQueryBuilder(MODULE_SPOUSE_SKILL_ASSESSMENT);
    spouseBuilder
      .select(DEADLINE_STATS_FIELDS)
      .whereIn('id', spouseIds)
      .orderBy('Deadline_For_Lodgment', 'asc');
    queries.push(zohoRequest("coql", "POST", { select_query: spouseBuilder.build() }));
  } else {
    queries.push(Promise.resolve({ data: [] }));
  }

  const [visaResponse, spouseResponse] = await Promise.all(queries);

  // Merge results from both queries
  const mergedData = [
    ...(visaResponse?.data || []),
    ...(spouseResponse?.data || [])
  ];

  return {
    data: mergedData,
    total: categoryData.ids.length
  };
};


// Attach attachment counts to all applications across categories
const attachAttachmentCountsToCategories = async (categoriesData) => {
  // Collect all IDs from all categories
  const allIds = [];
  categoriesData.forEach(categoryData => {
    if (categoryData.data && Array.isArray(categoryData.data)) {
      allIds.push(...categoryData.data.map(app => app.id));
    }
  });

  if (allIds.length === 0) return;

  // Single MongoDB aggregation query for all IDs
  const attachmentCounts = await dmsZohoDocument.aggregate([
    { $match: { record_id: { $in: allIds } } },
    { $group: { _id: '$record_id', count: { $sum: 1 } } }
  ]);

  // Create lookup map
  const countMap = new Map(
    attachmentCounts.map(item => [item._id, item.count])
  );

  // Attach counts to each category's data
  categoriesData.forEach(categoryData => {
    if (categoryData.data && Array.isArray(categoryData.data)) {
      categoryData.data = categoryData.data.map(app => ({
        ...app,
        AttachmentCount: countMap.get(app.id) || 0
      }));
    }
  });
};


const buildVisaStage1Query = (role, username) => {
  const stagesStr = STAGE_1_STAGES.map(s => `'${s}'`).join(', ');

  // Build WHERE clause with Zoho-required parentheses grouping
  let whereClause = `where id is not null and ((((Application_State = '${APPLICATION_STATE_ACTIVE}') and (Qualified_Country = '${QUALIFIED_COUNTRY_AUSTRALIA}')) and (Service_Finalized = '${SERVICE_FINALIZED_PERMANENT_RESIDENCY}')) and (Application_Stage in (${stagesStr})))`;

  // Role-based filtering: only filter by handler for non-admin roles
  if (!ADMIN_ROLES.includes(role)) {
    whereClause += ` and (Application_Handled_By like '${username}')`;
  }

  const query = `select id, Name, Deadline_For_Lodgment, Application_Stage from ${MODULE_VISA_APPLICATION} ${whereClause} order by Deadline_For_Lodgment desc limit 1000`;

  return query;
};


const buildSpouseStage1Query = (role, username) => {
  const stagesStr = STAGE_1_STAGES.map(s => `'${s}'`).join(', ');

  // Build WHERE clause - spouse module only filters by stage
  let whereClause = `where id is not null and Application_Stage in (${stagesStr})`;

  // Role-based filtering: only filter by handler for non-admin roles
  if (!ADMIN_ROLES.includes(role)) {
    whereClause += ` and Application_Handled_By like '${username}'`;
  }

  const query = `select id, Name, Deadline_For_Lodgment, Application_Stage from ${MODULE_SPOUSE_SKILL_ASSESSMENT} ${whereClause} order by Deadline_For_Lodgment desc limit 1000`;

  return query;
};


const getDeadlineStatistics = async (username, role, params = {}) => {
  const startTime = Date.now();

  try {
    const {
      type = null,
      approachingPage = 1,
      approachingLimit = 10,
      overduePage = 1,
      overdueLimit = 10,
      noDeadlinePage = 1,
      noDeadlineLimit = 10
    } = params;

    console.log(`Fetching deadline statistics for user: ${username}, role: ${role}, type: ${type || 'all'}`);

    let visaApps = [];
    let spouseApps = [];

    // PHASE 1: Categorization - Fetch minimal fields for all applications
    if (!type || type === 'visa') {
      const visaQuery = buildVisaStage1Query(role, username);
      console.log('Visa Query:', visaQuery);

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
      const spouseQuery = buildSpouseStage1Query(role, username);
      console.log('Spouse Query:', spouseQuery);

      try {
        const spouseResponse = await zohoRequest("coql", "POST", { select_query: spouseQuery });
        spouseApps = (spouseResponse?.data || []).map(app => ({ ...app, _source: 'spouse' }));
        console.log('✅ Spouse query succeeded, got', spouseApps.length, 'results');
      } catch (spouseError) {
        console.error('❌ Spouse query failed:', spouseError.response?.data || spouseError.message);
        throw spouseError;
      }
    }

    const allApplications = [...visaApps, ...spouseApps];
    console.log(`Fetched total ${allApplications.length} applications`);

    // Categorize applications and track IDs
    const categorizedData = categorizeApplicationsWithIds(allApplications);

    console.log(`Categorized: ${categorizedData.approaching.ids.length} approaching, ${categorizedData.overdue.ids.length} overdue, ${categorizedData.noDeadline.ids.length} no deadline`);

    // PHASE 2: Fetch detailed paginated data for each category
    // Pass visaApps and spouseApps to determine which module to query for each ID
    const [approachingDetails, overdueDetails, noDeadlineDetails] = await Promise.all([
      getDetailedCategoryApplications(categorizedData.approaching, visaApps, spouseApps, approachingPage, approachingLimit),
      getDetailedCategoryApplications(categorizedData.overdue, visaApps, spouseApps, overduePage, overdueLimit),
      getDetailedCategoryApplications(categorizedData.noDeadline, visaApps, spouseApps, noDeadlinePage, noDeadlineLimit)
    ]);

    // PHASE 3: Attach days calculations and type information
    approachingDetails.data = approachingDetails.data.map(app => {
      const appSource = visaApps.find(v => v.id === app.id) ? 'visa' : 'spouse';
      return {
        ...app,
        daysUntil: categorizedData.approaching.daysMap.get(app.id) || 0,
        type: appSource
      };
    });

    overdueDetails.data = overdueDetails.data.map(app => {
      const appSource = visaApps.find(v => v.id === app.id) ? 'visa' : 'spouse';
      return {
        ...app,
        daysOverdue: categorizedData.overdue.daysMap.get(app.id) || 0,
        type: appSource
      };
    });

    noDeadlineDetails.data = noDeadlineDetails.data.map(app => {
      const appSource = visaApps.find(v => v.id === app.id) ? 'visa' : 'spouse';
      return {
        ...app,
        type: appSource
      };
    });

    // PHASE 4: Attach attachment counts (always)
    await attachAttachmentCountsToCategories([approachingDetails, overdueDetails, noDeadlineDetails]);

    // Build pagination metadata
    const buildPaginationMeta = (currentPage, limit, total) => ({
      currentPage,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      limit
    });

    // Build response
    const statistics = {
      summary: {
        total: allApplications.length,
        approaching: categorizedData.approaching.ids.length,
        overdue: categorizedData.overdue.ids.length,
        noDeadline: categorizedData.noDeadline.ids.length
      },
      details: {
        approaching: {
          data: approachingDetails.data,
          pagination: buildPaginationMeta(approachingPage, approachingLimit, approachingDetails.total)
        },
        overdue: {
          data: overdueDetails.data,
          pagination: buildPaginationMeta(overduePage, overdueLimit, overdueDetails.total)
        },
        noDeadline: {
          data: noDeadlineDetails.data,
          pagination: buildPaginationMeta(noDeadlinePage, noDeadlineLimit, noDeadlineDetails.total)
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheExpiry: 300,
        queryExecutionTime: Date.now() - startTime
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
  categorizeApplicationsWithIds,
  getDetailedCategoryApplications,
  attachAttachmentCountsToCategories,
  validateAndParseDeadline,
  buildVisaStage1Query,
  buildSpouseStage1Query
};
