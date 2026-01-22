const { zohoRequest } = require("./zohoDms/zohoApi.js");
const dmsZohoDocument = require('../models/dmsZohoDocument');
const { REQ_MODULE_VISA_APPLICATION, MODULE_VISA_APPLICATION, REQ_MODULE_SPOUSE_SKILL_ASSESSMENT, MODULE_SPOUSE_SKILL_ASSESSMENT } = require("./helper/constants.js");

// Function to get filtered Visa Applications for a user
async function getFilteredVisaApplications(username, role, page = 1, limit = 10, startDate, endDate, giveMine, recentActivity, handledBy) {
  const offset = (page - 1) * limit;
  let baseQuery = '';
  let countQuery = '';

  baseQuery = `select Name, id, Application_Handled_By, Created_Time, Email, Phone, Quality_Check_From, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Recent_Activity, Application_Stage, Application_State, Service_Finalized, Qualified_Country from Visa_Applications`;
  // Query to get the total count of records using COUNT function with GROUP BY
  countQuery = `select COUNT(id) as total from Visa_Applications`;

  // users: if username !== 'admin' add Application_Handled_By or don't add any thing
  if (role === "admin" || (giveMine && giveMine === 'true')) {
    baseQuery += ` where Application_Handled_By like '${username}'`;
    countQuery += ` where Application_Handled_By like '${username}'`;

    if (startDate && endDate) {
      const startStr = `${startDate}T00:00:00+00:00`;
      const endStr = `${endDate}T23:59:59+00:00`;
      baseQuery += ` and (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
      countQuery += ` and (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
    } else if (startDate) {
      // Case 2: Only start date is provided (records on that specific day)
      const startStr = `${startDate}T00:00:00+00:00`;

      baseQuery += ` and (Created_Time >= '${startStr}')`;
      countQuery += ` and (Created_Time >= '${startStr}')`;
    } else if (endDate) {
      // Case 3: Only end date is provided (records up to that day)
      const endStr = `${endDate}T23:59:59+00:00`;
      baseQuery += ` and Created_Time <= '${endStr}'`;
      countQuery += ` and Created_Time <= '${endStr}'`;
    }

  } else {
    // admins
    if (startDate && endDate) {
      const startStr = `${startDate}T00:00:00+00:00`;
      const endStr = `${endDate}T23:59:59+00:00`;

      baseQuery += ` where (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
      countQuery += ` where (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
    } else if (startDate) {
      // Case 2: Only start date is provided (records on that specific day)
      const startStr = `${startDate}T00:00:00+00:00`;

      baseQuery += ` where (Created_Time >= '${startStr}')`;
      countQuery += ` where (Created_Time >= '${startStr}')`;
    } else if (endDate) {
      // Case 3: Only end date is provided (records up to that day)
      const endStr = `${endDate}T23:59:59+00:00`;
      baseQuery += ` where Created_Time <= '${endStr}'`;
      countQuery += ` where Created_Time <= '${endStr}'`;
    }
    else {
      baseQuery += ` where id is not null`
      countQuery += ` where id is not null`
    }
  }

  // Filters by Application_State, Qualified_Country, Application_Stage and Service_Finalized
  const filterByActiveApplications = ` and ((((Application_State = 'Active')`;
  const filterByCountryFinalised = ` and (Qualified_Country = 'Australia'))`;
  const filterByApplicationApprovedStage = ` and (Application_Stage in ('Stage 1 Documentation: Approved', 'Stage 1 Documentation: Rejected', 'Stage 1 Milestone Completed', 'Stage 1 Documentation Reviewed', 'Skill Assessment Stage')))`;

  let filterByServiceFinalised = '';
  let filterByApplicationHandledBy = '';

  if ((role === "admin" || role === "master_admin") && handledBy) {
    filterByServiceFinalised = ` and ((Service_Finalized = 'Permanent Residency')`

    const handledByList = handledBy.split(',').map(h => h.trim()).join("', '");

    filterByApplicationHandledBy = ` and (Application_Handled_By in ('${handledByList}'))))`
  } else {
    filterByServiceFinalised = ` and (Service_Finalized = 'Permanent Residency'))`
  }

  // Active Applications
  countQuery += filterByActiveApplications;
  baseQuery += filterByActiveApplications;

  // Qualified Country
  countQuery += filterByCountryFinalised;
  baseQuery += filterByCountryFinalised;

  // Service Finalised
  countQuery += filterByServiceFinalised;
  baseQuery += filterByServiceFinalised;

  if ((role === "admin" || role === "master_admin") && handledBy) {
    // Application Handled By
    countQuery += filterByApplicationHandledBy;
    baseQuery += filterByApplicationHandledBy;
  }

  // Application Approved Stage
  countQuery += filterByApplicationApprovedStage;
  baseQuery += filterByApplicationApprovedStage;


  if (role === "admin") {
    countQuery += ` group by Application_Handled_By`;
  }

  const countCoqlQuery = {
    "select_query": countQuery
  };

  const countResponse = await zohoRequest("coql", "POST", countCoqlQuery);

  const totalRecords = countResponse?.data?.[0]?.total || 0;

  // Sort by Recent_Activity if recentActivity is 'true', otherwise by Created_Time
  if (recentActivity && recentActivity === 'true') {
    baseQuery += ` order by Recent_Activity desc limit ${limit} offset ${offset}`;
  } else {
    baseQuery += ` order by Created_Time desc limit ${limit} offset ${offset}`;
  }

  const coqlQuery = {
    "select_query": baseQuery
  };

  // The zohoRequest returns the full response body, which includes 'data' and 'info' keys for COQL queries.
  const zohoResponse = await zohoRequest("coql", "POST", coqlQuery);
  // Ensure we always return a predictable structure, even if Zoho returns nothing.
  return { data: zohoResponse?.data || [], info: { count: totalRecords } };
}

const getApplicationsWithAttachments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { startDate, endDate, giveMine, recentActivity, handledBy } = req.query;

    const { data: filteredApplications, info } = await getFilteredVisaApplications(req.user.username, req.user.role, page, limit, startDate, endDate, giveMine, recentActivity, handledBy);

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

    const applicationsWithAttachments = [];
    const batchSize = 10; // This batching is for the internal MongoDB queries, it's fine to keep.

    for (let i = 0; i < filteredApplications.length; i += batchSize) {
      const batch = filteredApplications.slice(i, i + batchSize);

      const batchPromises = batch.map(async (app) => {
        // Fetch documents from dmsZohoDocument for each application
        const documentsCount = await dmsZohoDocument.countDocuments({ record_id: app.id });
        return {
          ...app,
          AttachmentCount: documentsCount, // Add the document count to the application object
        };
      });

      const batchResults = await Promise.all(batchPromises);
      applicationsWithAttachments.push(...batchResults);
    }

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
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch visa applications");
  }
};

const getVisaApplicationById = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const coqlQuery = {
      "select_query": `select Email, Name, Application_Handled_By, Phone, id, Created_Time, Send_Check_List, Assessing_Authority, Qualified_Country, Service_Finalized, Suggested_Anzsco, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Recent_Activity, Application_Stage from Visa_Applications where id = '${applicationId}'`
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

async function getFilteredSpouseApplications(username, role, page = 1, limit = 10, startDate, endDate, giveMine, recentActivity) {
  const offset = (page - 1) * limit;
  let baseQuery = '';
  let countQuery = '';

  baseQuery = `select Name, id, Application_Handled_By, Created_Time, Email, Phone, Quality_Check_From, DMS_Application_Status, Package_Finalize, Checklist_Requested, Deadline_For_Lodgment, Record_Type, Recent_Activity, Application_Stage, Suggested_Anzsco, Assessing_Authority, Service_Finalized, Main_Applicant from Spouse_Skill_Assessment`;
  // Query to get the total count of records using COUNT function with GROUP BY
  countQuery = `select COUNT(id) as total from Spouse_Skill_Assessment`;

  // users: if username !== 'admin' add Application_Handled_By or don't add any thing
  if (role === "admin" || giveMine && giveMine === 'true') {
    baseQuery += ` where Application_Handled_By like '${username}'`;
    countQuery += ` where Application_Handled_By like '${username}'`;

    if (startDate && endDate) {
      const startStr = `${startDate}T00:00:00+00:00`;
      const endStr = `${endDate}T23:59:59+00:00`;
      baseQuery += ` and (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
      countQuery += ` and (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
    } else if (startDate) {
      // Case 2: Only start date is provided (records on that specific day)
      const startStr = `${startDate}T00:00:00+00:00`;

      baseQuery += ` and (Created_Time >= '${startStr}')`;
      countQuery += ` and (Created_Time >= '${startStr}')`;
    } else if (endDate) {
      // Case 3: Only end date is provided (records up to that day)
      const endStr = `${endDate}T23:59:59+00:00`;
      baseQuery += ` and Created_Time <= '${endStr}'`;
      countQuery += ` and Created_Time <= '${endStr}'`;
    }

  } else {
    // admins
    if (startDate && endDate) {
      const startStr = `${startDate}T00:00:00+00:00`;
      const endStr = `${endDate}T23:59:59+00:00`;

      baseQuery += ` where (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
      countQuery += ` where (Created_Time >= '${startStr}' and Created_Time <= '${endStr}')`
    } else if (startDate) {
      // Case 2: Only start date is provided (records on that specific day)
      const startStr = `${startDate}T00:00:00+00:00`;

      baseQuery += ` where (Created_Time >= '${startStr}')`;
      countQuery += ` where (Created_Time >= '${startStr}')`;
    } else if (endDate) {
      // Case 3: Only end date is provided (records up to that day)
      const endStr = `${endDate}T23:59:59+00:00`;
      baseQuery += ` where Created_Time <= '${endStr}'`;
      countQuery += ` where Created_Time <= '${endStr}'`;
    }
    else {
      baseQuery += ` where id is not null`
      countQuery += ` where id is not null`
    }
  }


  if (role === "admin") {
    countQuery += ` group by Application_Handled_By`;
  }

  const countCoqlQuery = {
    "select_query": countQuery
  };

  const countResponse = await zohoRequest("coql", "POST", countCoqlQuery);

  const totalRecords = countResponse?.data?.[0]?.total || 0;

  // Determine order by field: if recentActivity is 'true', order by Recent_Activity, else by Created_Time
  let orderByField = "Created_Time";
  if (recentActivity && recentActivity === 'true') {
    orderByField = "Recent_Activity";
  }

  baseQuery += ` order by ${orderByField} desc limit ${limit} offset ${offset}`;

  const coqlQuery = {
    "select_query": baseQuery
  };

  // The zohoRequest returns the full response body, which includes 'data' and 'info' keys for COQL queries.
  const zohoResponse = await zohoRequest("coql", "POST", coqlQuery);
  // Ensure we always return a predictable structure, even if Zoho returns nothing.
  return { data: zohoResponse?.data || [], info: { count: totalRecords } };
}

const getSpouseApplicationsWithAttachments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { startDate, endDate, giveMine, recentActivity } = req.query;

    const { data: filteredApplications, info } = await getFilteredSpouseApplications(req.user.username, req.user.role, page, limit, startDate, endDate, giveMine, recentActivity);

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

    const applicationsWithAttachments = [];
    const batchSize = 10; // This batching is for the internal MongoDB queries, it's fine to keep.

    for (let i = 0; i < filteredApplications.length; i += batchSize) {
      const batch = filteredApplications.slice(i, i + batchSize);

      const batchPromises = batch.map(async (app) => {
        // Fetch documents from dmsZohoDocument for each application
        const documentsCount = await dmsZohoDocument.countDocuments({ record_id: app.id });
        return {
          ...app,
          AttachmentCount: documentsCount, // Add the document count to the application object
        };
      });

      const batchResults = await Promise.all(batchPromises);
      applicationsWithAttachments.push(...batchResults);
    }

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
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch visa applications");
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