const { zohoRequest } = require("./zohoDms/zohoApi.js");
const dmsZohoDocument = require('../models/dmsZohoDocument');
const { REQ_MODULE_VISA_APPLICATION, MODULE_VISA_APPLICATION, REQ_MODULE_SPOUSE_SKILL_ASSESSMENT, MODULE_SPOUSE_SKILL_ASSESSMENT } = require("./helper/constants.js");

// Function to get filtered Visa Applications for a user
async function getFilteredVisaApplications(username, role, page = 1, limit = 10, startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState) {
  const offset = (page - 1) * limit;
  
  // Build query conditions
  const conditions = [];
  let hasWhereClause = false;
  
  // Role-based filtering - add WHERE clause
  if (role === "admin" || (giveMine && giveMine === 'true')) {
    conditions.push(`Application_Handled_By like '${username}'`);
    hasWhereClause = true;
  }
  
  // Date filtering
  if (startDate && endDate) {
    const startStr = `${startDate}T00:00:00+00:00`;
    const endStr = `${endDate}T23:59:59+00:00`;
    const dateCondition = `(Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`;
    
    if (hasWhereClause) {
      conditions.push(dateCondition);
    } else {
      conditions.push(dateCondition);
      hasWhereClause = true;
    }
  } else if (startDate) {
    const startStr = `${startDate}T00:00:00+00:00`;
    const dateCondition = `Created_Time >= '${startStr}'`;
    
    if (hasWhereClause) {
      conditions.push(dateCondition);
    } else {
      conditions.push(dateCondition);
      hasWhereClause = true;
    }
  } else if (endDate) {
    const endStr = `${endDate}T23:59:59+00:00`;
    const dateCondition = `Created_Time <= '${endStr}'`;
    
    if (hasWhereClause) {
      conditions.push(dateCondition);
    } else {
      conditions.push(dateCondition);
      hasWhereClause = true;
    }
  }
  
  // If no WHERE clause yet, add default
  if (!hasWhereClause) {
    conditions.push(`id is not null`);
  }
  
  // Build WHERE clause
  const whereClause = ` where ${conditions.join(' and ')}`;
  
  // Core filters with correct parentheses matching your working code
  let coreFilters = ` and (((`;

  // Application State filter - now dynamic
  if (applicationState) {
    coreFilters += `(Application_State = '${applicationState}')`;
  } else {
    coreFilters += `(Application_State = 'Active')`;
  }

  coreFilters += ` and (Qualified_Country = 'Australia'))`;
  
  // Service Finalized and Application Handled By logic
  if ((role === "admin" || role === "master_admin") && handledBy) {
    coreFilters += ` and ((Service_Finalized = 'Permanent Residency')`;
    
    const handledByList = handledBy.split(',').map(h => h.trim()).join("', '");
    coreFilters += ` and (Application_Handled_By in ('${handledByList}'))))`;
  } else {
    coreFilters += ` and (Service_Finalized = 'Permanent Residency'))`;
  }
  
  // Application Stage filter - now dynamic
  if (applicationStage) {
    // Support multiple stages separated by comma
    const stages = applicationStage.split(',').map(s => s.trim()).join("', '");
    coreFilters += ` and (Application_Stage in ('${stages}'))`;
  } else {
    // Default stages when no filter is provided
    coreFilters += ` and (Application_Stage in ('Stage 1 Documentation: Approved', 'Stage 1 Documentation: Rejected ', 'Stage 1 Milestone Completed', 'Stage 1 Documentation Reviewed', 'Skill Assessment Stage', 'Language Test', 'Lodge Application 1', 'Lodge Application 2', 'Lodge Application 3', 'Lodge Application 4','INIVITATION TO APPLY', 'Invitation to Apply', 'Invitation to Apply 2', 'VA Application Lodge', 'Stage 3 Documentation: Approved', 'Stage 3 Visa Application', 'SEND CHECKLIST'))`;
  }

  coreFilters += `)`;
  
  // Count query
  let countQuery = `select COUNT(id) as total from Visa_Applications${whereClause}${coreFilters}`;
  
  if (role === "admin") {
    countQuery += ` group by Application_Handled_By`;
  }
  
  // Base select query
  const baseQuery = `select Name, id, Application_Handled_By, Created_Time, Email, Phone, Quality_Check_From, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Recent_Activity, Application_Stage, Application_State, Service_Finalized, Qualified_Country from Visa_Applications${whereClause}${coreFilters}`;
  
  // Sort and pagination
  const orderBy = (recentActivity === 'true') ? 'Recent_Activity' : 'Created_Time';
  const finalQuery = `${baseQuery} order by ${orderBy} desc limit ${limit} offset ${offset}`;
  
  // Execute both queries in parallel
  const [countResponse, zohoResponse] = await Promise.all([
    zohoRequest("coql", "POST", { select_query: countQuery }),
    zohoRequest("coql", "POST", { select_query: finalQuery })
  ]);
  
  const totalRecords = countResponse?.data?.[0]?.total || 0;
  
  return { 
    data: zohoResponse?.data || [], 
    info: { count: totalRecords } 
  };
}

const getApplicationsWithAttachments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState } = req.query;

    const { data: filteredApplications, info } = await getFilteredVisaApplications(
      req.user.username,
      req.user.role,
      page,
      limit,
      startDate,
      endDate,
      giveMine,
      recentActivity,
      handledBy,
      applicationStage,
      applicationState
    );

    if (!filteredApplications || filteredApplications.length === 0) {
      return res.json({
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalRecords: 0,
          limit,
        },
      });
    }

    const recordIds = filteredApplications.map(app => app.id);
    
    const attachmentCounts = await dmsZohoDocument.aggregate([
      {
        $match: {
          record_id: { $in: recordIds }
        }
      },
      {
        $group: {
          _id: '$record_id',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create a lookup map for O(1) access
    const countMap = new Map(
      attachmentCounts.map(item => [item._id, item.count])
    );
    
    // Attach counts to applications
    const applicationsWithAttachments = filteredApplications.map(app => ({
      ...app,
      AttachmentCount: countMap.get(app.id) || 0
    }));

    res.json({
      data: applicationsWithAttachments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(info.count / limit),
        totalRecords: info.count,
        limit,
      },
    });
  } catch (err) {
    console.error('Error fetching visa applications:', err.response?.data || err.message);
    res.status(500).json({ 
      error: "Failed to fetch visa applications",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const getVisaApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const coqlQuery = {
      "select_query": `select Email, Name, Application_Handled_By, Phone, id, Created_Time, Send_Check_List, Assessing_Authority, Qualified_Country, Service_Finalized, Suggested_Anzsco, DMS_Application_Status, Package_Finalize, Spouse_Skill_Assessment, Spouse_Name,  Checklist_Requested, Deadline_For_Lodgment, Record_Type, Recent_Activity, Application_Stage from Visa_Applications where id = '${applicationId}'`
    };

    const { data: zohoResponseData } = await zohoRequest("coql", "POST", coqlQuery);

    if (!zohoResponseData || zohoResponseData.length === 0) {
      return res.status(404).send("Visa application not found");
    }

    const application = zohoResponseData[0];
    const record_id = application.id;

    const documentsCount = await dmsZohoDocument.countDocuments({ record_id: record_id });

    res.json({
      data: {
        ...application,
        AttachmentCount: documentsCount,
      },
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch visa application");
  }
};

const getVisaApplication = async (req, res) => {
  try {
    const applicationId = req.user.lead_id;
    const recordType = req.user.record_type;

    let moduleName = MODULE_VISA_APPLICATION;

    if (recordType) {
      if (recordType === REQ_MODULE_VISA_APPLICATION) {
        moduleName = MODULE_VISA_APPLICATION;
      } else if (recordType === REQ_MODULE_SPOUSE_SKILL_ASSESSMENT) {
        moduleName = MODULE_SPOUSE_SKILL_ASSESSMENT
      } else {
        moduleName = MODULE_VISA_APPLICATION;
      }
    }

    let coqlQuery = {
      "select_query": `select Email, Name, Application_Handled_By, Phone, id, Send_Check_List,Assessing_Authority, Qualified_Country, Service_Finalized, Suggested_Anzsco, DMS_Application_Status,Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Created_Time, Record_Type, Recent_Activity, Application_Stage from ${moduleName} where id = '${applicationId}'`
    };


    const { data: zohoResponseData } = await zohoRequest("coql", "POST", coqlQuery);

    if (!zohoResponseData || zohoResponseData.length === 0) {
      return res.status(404).send("Visa application not found");
    }

    const application = zohoResponseData[0];
    const record_id = application.id;

    const documentsCount = await dmsZohoDocument.countDocuments({ record_id: record_id });

    res.json({
      data: {
        ...application,
        AttachmentCount: documentsCount,
      },
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch visa application");
  }
};

async function getFilteredSpouseApplications(username, role, page = 1, limit = 10, startDate, endDate, giveMine, recentActivity, applicationStage) {
  const offset = (page - 1) * limit;
  
  const conditions = [];
  let hasWhereClause = false;
  
  // Role-based filtering - add WHERE clause
  if (role === "admin" || (giveMine && giveMine === 'true')) {
    conditions.push(`Application_Handled_By like '${username}'`);
    hasWhereClause = true;
  }
  
  if (startDate && endDate) {
    const startStr = `${startDate}T00:00:00+00:00`;
    const endStr = `${endDate}T23:59:59+00:00`;
    conditions.push(`(Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`);
    if (!hasWhereClause) hasWhereClause = true;
  } else if (startDate) {
    const startStr = `${startDate}T00:00:00+00:00`;
    conditions.push(`Created_Time >= '${startStr}'`);
    if (!hasWhereClause) hasWhereClause = true;
  } else if (endDate) {
    const endStr = `${endDate}T23:59:59+00:00`;
    conditions.push(`Created_Time <= '${endStr}'`);
    if (!hasWhereClause) hasWhereClause = true;
  }
  
  if (!hasWhereClause) {
    conditions.push(`id is not null`);
  }
  
  // Build WHERE clause
  const whereClause = ` where ${conditions.join(' and ')}`;

  // Additional filters for Application Stage only (Application_State doesn't exist in Spouse_Skill_Assessment)
  let additionalFilters = '';

  // Application Stage filter
  if (applicationStage) {
    const stages = applicationStage.split(',').map(s => s.trim()).join("', '");
    additionalFilters += ` and Application_Stage in ('${stages}')`;
  }

  // Count query
  let countQuery = `select COUNT(id) as total from Spouse_Skill_Assessment${whereClause}${additionalFilters}`;
  
  if (role === "admin") {
    countQuery += ` group by Application_Handled_By`;
  }
  
  // Simplified field list - only select fields that exist in Spouse_Skill_Assessment module
  // Note: Application_State field doesn't exist in Spouse_Skill_Assessment module
  const baseQuery = `select Name, id, Application_Handled_By, Created_Time, Email, Phone, DMS_Application_Status, Checklist_Requested, Record_Type, Recent_Activity, Application_Stage, Suggested_Anzsco, Assessing_Authority, Service_Finalized, Main_Applicant from Spouse_Skill_Assessment${whereClause}${additionalFilters}`;

  const orderBy = (recentActivity === 'true') ? 'Recent_Activity' : 'Created_Time';
  const finalQuery = `${baseQuery} order by ${orderBy} desc limit ${limit} offset ${offset}`;

  console.log('Spouse Count Query:', countQuery);
  console.log('Spouse Final Query:', finalQuery);

  const [countResponse, zohoResponse] = await Promise.all([
    zohoRequest("coql", "POST", { select_query: countQuery }),
    zohoRequest("coql", "POST", { select_query: finalQuery })
  ]);
  
  const totalRecords = countResponse?.data?.[0]?.total || 0;
  
  return { 
    data: zohoResponse?.data || [], 
    info: { count: totalRecords } 
  };
}

const getSpouseApplicationsWithAttachments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { startDate, endDate, giveMine, recentActivity, applicationStage } = req.query;

    // Fetch applications from Zoho
    const { data: filteredApplications, info } = await getFilteredSpouseApplications(
      req.user.username,
      req.user.role,
      page,
      limit,
      startDate,
      endDate,
      giveMine,
      recentActivity,
      applicationStage,
    );

    if (!filteredApplications || filteredApplications.length === 0) {
      return res.json({
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalRecords: 0,
          limit,
        },
      });
    }

    const recordIds = filteredApplications.map(app => app.id);
    
    const attachmentCounts = await dmsZohoDocument.aggregate([
      {
        $match: {
          record_id: { $in: recordIds }
        }
      },
      {
        $group: {
          _id: '$record_id',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create a Map for O(1) lookups
    const countMap = new Map(
      attachmentCounts.map(item => [item._id, item.count])
    );
    
    // Merge attachment counts with applications
    const applicationsWithAttachments = filteredApplications.map(app => ({
      ...app,
      AttachmentCount: countMap.get(app.id) || 0
    }));

    res.json({
      data: applicationsWithAttachments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(info.count / limit),
        totalRecords: info.count,
        limit,
      },
    });
    
  } catch (err) {
    console.error('Error fetching spouse applications:', err.response?.data || err.message);
    console.error('Full error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: "Failed to fetch spouse applications",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      details: process.env.NODE_ENV === 'development' ? (err.response?.data || err.toString()) : undefined
    });
  }
};


const getSpouseVisaApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const coqlQuery = {
      "select_query": `select Email, Name, Application_Handled_By, Phone, id, Created_Time, Send_Check_List, Assessing_Authority, Qualified_Country, Service_Finalized, Suggested_Anzsco, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Recent_Activity, Application_Stage, Main_Applicant from Spouse_Skill_Assessment where id = '${applicationId}'`
    };

    const { data: zohoResponseData } = await zohoRequest("coql", "POST", coqlQuery);

    if (!zohoResponseData || zohoResponseData.length === 0) {
      return res.status(404).send("Visa application not found");
    }

    const application = zohoResponseData[0];
    const record_id = application.id;

    const documentsCount = await dmsZohoDocument.countDocuments({ record_id: record_id });

    res.json({
      data: {
        ...application,
        AttachmentCount: documentsCount,
      },
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch visa application");
  }
};

module.exports = {
  getApplicationsWithAttachments,
  getSpouseApplicationsWithAttachments,
  getVisaApplicationById,
  getSpouseVisaApplicationById,
  getVisaApplication
};