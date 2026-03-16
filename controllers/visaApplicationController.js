const mongoose = require('mongoose');
const { zohoRequest } = require("./zohoDms/zohoApi.js");
const dmsZohoDocument = require('../models/dmsZohoDocument');
const DmsZohoClient = require('../models/dmsZohoClient');
const {
  REQ_MODULE_VISA_APPLICATION, MODULE_VISA_APPLICATION,
  REQ_MODULE_SPOUSE_SKILL_ASSESSMENT, MODULE_SPOUSE_SKILL_ASSESSMENT,
  APPLICATION_STAGES, APPLICATION_STAGES_CANADA, SUPPORTED_COUNTRIES
} = require("./helper/constants.js");
const QualityCheckRequest = require('../models/qualityCheckRequest');
const { addActivityLog } = require('./helper/service/activityLog');

// Function to get filtered Visa Applications for a user
async function getFilteredVisaApplications(username, role, page = 1, limit = 10, startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState, country = 'Australia') {
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

  coreFilters += ` and (Qualified_Country = '${country}'))`;

  // Service Finalized and Application Handled By logic
  if ((role === "admin" || role === "master_admin") && handledBy) {
    coreFilters += ` and ((Service_Finalized = 'Permanent Residency')`;
    
    const handledByList = handledBy.split(',').map(h => h.trim()).join("', '");
    coreFilters += ` and (Application_Handled_By in ('${handledByList}'))))`;
  } else {
    coreFilters += ` and (Service_Finalized = 'Permanent Residency'))`;
  }
  
  // Application Stage filter - dynamic, with country-specific defaults
  if (applicationStage) {
    const stages = applicationStage.split(',').map(s => s.trim()).join("', '");
    coreFilters += ` and (Application_Stage in ('${stages}'))`;
  } else {
    const defaultStages = (country === 'Canada' ? APPLICATION_STAGES_CANADA : APPLICATION_STAGES)
      .map(s => `'${s}'`).join(', ');
    coreFilters += ` and (Application_Stage in (${defaultStages}))`;
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
    const { startDate, endDate, giveMine, recentActivity, handledBy, applicationStage, applicationState, country = 'Australia' } = req.query;

    if (!SUPPORTED_COUNTRIES.includes(country)) {
      return res.status(400).json({ error: `Invalid country parameter. Supported values: ${SUPPORTED_COUNTRIES.join(', ')}` });
    }

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
      applicationState,
      country
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

    const spouseName = application.Spouse_Name?.trim() || null;

    const [documentsCount, client, spouseClient, qcRequest] = await Promise.all([
      dmsZohoDocument.countDocuments({ record_id }),
      DmsZohoClient.findOne({ lead_id: record_id }).select('notes online_status last_communication_activity').lean(),
      spouseName
        ? DmsZohoClient.findOne({
            name: new RegExp(`^${spouseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            record_type: 'spouse_skill_assessment',
          })
            .select('lead_id')
            .lean()
        : Promise.resolve(null),
      QualityCheckRequest.findOne({ leadId: record_id, status: 'pending' })
        .select('_id status requested_at requested_by requested_to')
        .lean(),
    ]);

    res.json({
      data: {
        ...application,
        AttachmentCount: documentsCount,
        notes: client?.notes ?? [],
        online_status: client?.online_status ?? false,
        last_communication_activity: client?.last_communication_activity ?? null,
        spouse_lead_id: spouseClient?.lead_id ?? null,
        qc_requested: qcRequest
          ? {
              qcId: qcRequest._id,
              status: qcRequest.status,
              requested_at: qcRequest.requested_at,
              requested_by: qcRequest.requested_by,
              requested_to: qcRequest.requested_to,
            }
          : null,
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

    const [documentsCount, client, qcRequest] = await Promise.all([
      dmsZohoDocument.countDocuments({ record_id }),
      DmsZohoClient.findOne({ lead_id: record_id }).select('notes online_status last_communication_activity').lean(),
      QualityCheckRequest.findOne({ leadId: record_id, status: 'pending' })
        .select('_id status requested_at requested_by requested_to')
        .lean(),
    ]);

    res.json({
      data: {
        ...application,
        AttachmentCount: documentsCount,
        notes: client?.notes ?? [],
        online_status: client?.online_status ?? false,
        last_communication_activity: client?.last_communication_activity ?? null,
        qc_requested: qcRequest
          ? {
              qcId: qcRequest._id,
              status: qcRequest.status,
              requested_at: qcRequest.requested_at,
              requested_by: qcRequest.requested_by,
              requested_to: qcRequest.requested_to,
            }
          : null,
      },
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to fetch visa application");
  }
};

const getApplicationNotes = async (req, res) => {
  try {
    const leadId = req.params.id;
    const client = await DmsZohoClient.findOne({ lead_id: leadId }).select('notes').lean();
    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
    }
    res.status(200).json({
      status: 'success',
      data: { notes: client.notes || [] },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || 'Something went wrong' });
  }
};

const addApplicationNote = async (req, res) => {
  try {
    const leadId = req.params.id;
    let { note } = req.body;
    if (note !== undefined) note = typeof note === 'string' ? note.trim() : '';
    if (!note) {
      return res.status(400).json({
        status: 'fail',
        message: 'Note text is required and cannot be empty',
      });
    }
    if (note.length > 2000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Note cannot exceed 2000 characters',
      });
    }
    const addedBy = req.user.username;
    const addedAt = new Date();
    const updated = await DmsZohoClient.findOneAndUpdate(
      { lead_id: leadId },
      { $push: { notes: { note, addedBy, addedAt } } },
      { new: true, runValidators: true }
    ).select('notes');
    if (!updated) {
      return res.status(404).json({ status: 'fail', message: 'Client not found for this application' });
    }
    const newNote = updated.notes[updated.notes.length - 1];

    addActivityLog({
      lead_id:       leadId,
      activity_type: 'note_added',
      summary:       `${addedBy} added a note to this application`,
      actor_type:    'staff',
      actor_name:    addedBy,
      actor_role:    req.user?.role ?? null,
    });

    res.status(201).json({
      status: 'success',
      data: { note: newNote, notes: updated.notes },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || 'Something went wrong' });
  }
};

const updateApplicationNote = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { noteId } = req.params;
    let { note } = req.body;
    if (note !== undefined) note = typeof note === 'string' ? note.trim() : '';
    if (!note) {
      return res.status(400).json({
        status: 'fail',
        message: 'Note text is required and cannot be empty',
      });
    }
    if (note.length > 2000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Note cannot exceed 2000 characters',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid note id' });
    }
    const noteObjectId = new mongoose.Types.ObjectId(noteId);
    const updated = await DmsZohoClient.findOneAndUpdate(
      { lead_id: leadId, 'notes._id': noteObjectId },
      { $set: { 'notes.$.note': note } },
      { new: true, runValidators: true }
    ).select('notes');
    if (!updated) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client or note not found for this application',
      });
    }
    const updatedNote = updated.notes.id(noteId);

    addActivityLog({
      lead_id:       leadId,
      activity_type: 'note_updated',
      summary:       `${req.user?.username ?? 'Unknown'} updated a note on this application`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Unknown',
      actor_role:    req.user?.role ?? null,
    });

    res.status(200).json({
      status: 'success',
      data: { note: updatedNote, notes: updated.notes },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || 'Something went wrong' });
  }
};

const deleteApplicationNote = async (req, res) => {
  try {
    const leadId = req.params.id;
    const { noteId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid note id' });
    }
    const noteObjectId = new mongoose.Types.ObjectId(noteId);
    const updated = await DmsZohoClient.findOneAndUpdate(
      { lead_id: leadId },
      { $pull: { notes: { _id: noteObjectId } } },
      { new: true }
    ).select('notes');
    if (!updated) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found for this application',
      });
    }
    addActivityLog({
      lead_id:       leadId,
      activity_type: 'note_deleted',
      summary:       `${req.user?.username ?? 'Unknown'} deleted a note from this application`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Unknown',
      actor_role:    req.user?.role ?? null,
    });

    res.status(200).json({
      status: 'success',
      data: { notes: updated.notes },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || 'Something went wrong' });
  }
};

module.exports = {
  getApplicationsWithAttachments,
  getSpouseApplicationsWithAttachments,
  getVisaApplicationById,
  getSpouseVisaApplicationById,
  getVisaApplication,
  getApplicationNotes,
  addApplicationNote,
  updateApplicationNote,
  deleteApplicationNote,
};