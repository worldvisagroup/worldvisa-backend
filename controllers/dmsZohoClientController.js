const jwt = require('jsonwebtoken');
const DmsZohoClient = require('../models/dmsZohoClient');
const DmsZohoDocument = require('../models/dmsZohoDocument');
const { deleteFileFromWorkDrive, renameWorkDriveFile } = require('../utils/dmsZohoWorkDrive');
const { zohoRequest } = require('./zohoDms/zohoApi');
const bcrypt = require('bcryptjs');

const signToken = (id, lead_id, email) => {
  return jwt.sign({ id, lead_id, email, role: 'client' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};


exports.signup = async (req, res) => {
  try {
    const { name, email, phone, lead_id, password, lead_owner, record_type } = req.body;

    if (!name || !email || !phone || !lead_id || !password || !lead_owner || !record_type) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, phone, lead_id,lead_owner, record_type and password',
      });
    }

    const newClient = await DmsZohoClient.create({
      name,
      email,
      phone: phone.replace(/[\s+]/g, ''), // Removes spaces and plus symbols
      lead_id,
      password, // Use custom password provided by the user
      lead_owner,
      record_type,
      password_value: password
    });

    // Remove password from output
    newClient.password = undefined;

    res.status(201).json({
      status: 'success',
      data: {
        client: newClient,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong during signup',
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // 2) Check if client exists
    const client = await DmsZohoClient.findOne({ email }).select('+password');

    if (!client) {
      return res.status(401).json({
        status: 'fail',
        message: 'Account not existing. Contact your visa executive.',
      });
    }

    // 3) Check if password is correct
    if (!(await client.correctPassword(password, client.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Password is incorrect',
      });
    }

    // 4) If everything is ok, set online and send token to client
    await DmsZohoClient.findByIdAndUpdate(client._id, { online_status: true });
    const token = signToken(client._id, client.lead_id, client.email);

    res.status(200).json({
      status: 'success',
      token,
      lead_id: client.lead_id,
      role: 'client',
      email: client.email,
      name: client.name,
      dms_record_link: `https://dms.worldvisagroup.com/admin/applications/${client.lead_id}`,
      lead_owner: client?.lead_owner,
      record_type: client?.record_type,
      password_value: client?.password_value
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong during login',
    });
  }
};

exports.userExistsWithLeadId = async (req, res) => {
  const { lead_id } = req.params; // Extract lead_id from the request parameters
  try {
    const client = await DmsZohoClient.findOne({ lead_id });
    return res.status(200).json({ exists: !!client }); // Returns true if client exists, otherwise false
  } catch (error) {
    console.error('Error checking user existence:', error);
    return res.status(500).json({ status: 'error', message: 'Error checking user existence' });
  }
};


exports.updateRecordType = async (req, res) => {
  try {
    const { lead_id, record_type } = req.body;

    if (!lead_id || !record_type) {
      return res.status(400).json({
        status: 'fail',
        message: 'lead_id and record_type are required',
      });
    }

    const client = await DmsZohoClient.findOneAndUpdate(
      { lead_id },
      { record_type },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found with the provided lead_id',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Record type updated successfully',
      data: {
        lead_id: client.lead_id,
        record_type: client.record_type,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while updating record type',
    });
  }
};


// Start Generation Here
exports.resetPassword = async (req, res) => {
  try {
    const email = req.user.email;

    const { newPassword } = req.body;
    // 1) Check if email and newPassword exist
    if (!email || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and new password',
      });
    }

    // 2) Find the client by email
    const client = await DmsZohoClient.findOne({ email }).select('+password');

    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found',
      });
    }

    // 4) Update the client's password
    client.password = newPassword;
    client.password_value = newPassword;
    await client.save();

    // 5) Send success response
    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong during password reset',
    });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const { search, lead_owner } = req.query;

    // ── Build Zoho WHERE clause ────────────────────────────────────────────
    const conditions = [];

    if (req.user.role === 'admin') {
      conditions.push(`Application_Handled_By like '${req.user.username}'`);
    } else if (lead_owner) {
      conditions.push(`Application_Handled_By like '${lead_owner.trim()}'`);
    }

    if (search) {
      const s = search.trim();
      conditions.push(`(Name like '${s}' or Email like '${s}')`);
    }

    if (conditions.length === 0) conditions.push('id is not null');

    const whereClause = `where ${conditions.join(' and ')}`;

    const VISA_FIELDS   = 'id, Name, Email, Phone, Application_Handled_By, DMS_Application_Status, Application_Stage, Deadline_For_Lodgment, Record_Type, Recent_Activity, Package_Finalize, Qualified_Country, Application_State, Created_Time';
    const SPOUSE_FIELDS = VISA_FIELDS + ', Assessing_Authority, Suggested_Anzsco, Spouse_Name';

    // ── Phase 1: Zoho — paginated primary data + counts ───────────────────
    const [visaCountRes, spouseCountRes, visaDataRes, spouseDataRes] = await Promise.allSettled([
      zohoRequest('coql', 'POST', { select_query: `select COUNT(id) as total from Visa_Applications ${whereClause}` }),
      zohoRequest('coql', 'POST', { select_query: `select COUNT(id) as total from Spouse_Skill_Assessment ${whereClause}` }),
      zohoRequest('coql', 'POST', { select_query: `select ${VISA_FIELDS} from Visa_Applications ${whereClause} order by Created_Time desc limit ${limit} offset ${offset}` }),
      zohoRequest('coql', 'POST', { select_query: `select ${SPOUSE_FIELDS} from Spouse_Skill_Assessment ${whereClause} order by Created_Time desc limit ${limit} offset ${offset}` }),
    ]);

    const visaCount   = visaCountRes.status   === 'fulfilled' ? (visaCountRes.value?.data?.[0]?.total   ?? 0) : 0;
    const spouseCount = spouseCountRes.status === 'fulfilled' ? (spouseCountRes.value?.data?.[0]?.total ?? 0) : 0;
    const total       = visaCount + spouseCount;

    const visaApps   = (visaDataRes.status   === 'fulfilled' ? visaDataRes.value?.data   : null) ?? [];
    const spouseApps = (spouseDataRes.status === 'fulfilled' ? spouseDataRes.value?.data : null) ?? [];

    const allApps = [
      ...visaApps.map(a   => ({ ...a, _record_type: 'visa_application' })),
      ...spouseApps.map(a => ({ ...a, _record_type: 'spouse_skill_assessment' })),
    ];

    if (allApps.length === 0) {
      return res.status(200).json({
        status: 'success',
        results: 0,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalRecords: total, limit },
        data: { clients: [] },
      });
    }

    // ── Phase 2: MongoDB — enrich with DMS data + document stats ──────────
    const pageIds = allApps.map(a => a.id);

    const [clientDocs, docStats] = await Promise.all([
      DmsZohoClient.find({ lead_id: { $in: pageIds } })
        .select('lead_id online_status last_communication_activity')
        .lean(),
      DmsZohoDocument.aggregate([
        { $match: { record_id: { $in: pageIds } } },
        { $group: { _id: { record_id: '$record_id', status: '$status' }, count: { $sum: 1 } } },
      ]),
    ]);

    const clientMap = new Map(clientDocs.map(c => [c.lead_id, c]));

    const docMap = new Map();
    for (const d of docStats) {
      const rid = d._id.record_id;
      if (!docMap.has(rid)) docMap.set(rid, { total: 0, documents_by_status: {} });
      const entry = docMap.get(rid);
      entry.total += d.count;
      entry.documents_by_status[d._id.status] = d.count;
    }

    // ── Merge ──────────────────────────────────────────────────────────────
    const enriched = allApps.map(app => {
      const client = clientMap.get(app.id);
      const docs   = docMap.get(app.id);
      return {
        ...app,
        dms_registered:              !!client,
        online_status:               client?.online_status               ?? false,
        last_communication_activity: client?.last_communication_activity ?? null,
        total_documents:             docs?.total                         ?? 0,
        documents_by_status:         docs?.documents_by_status           ?? {},
      };
    });

    // ── Response ───────────────────────────────────────────────────────────
    res.status(200).json({
      status: 'success',
      results: enriched.length,
      pagination: {
        currentPage:  page,
        totalPages:   Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
      data: { clients: enriched },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while retrieving clients',
    });
  }
};

exports.updateAllPasswordsToPhone = async (req, res) => {
  try {
    const clients = await DmsZohoClient.find();
    for (const client of clients) {
      const hashedPassword = await bcrypt.hash(client.phone, 12);

      await DmsZohoClient.updateOne(
        { _id: client._id },
        { $set: { password: hashedPassword } }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'All passwords have been updated to hashed phone numbers',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while updating passwords',
    });
  }
};


const { promisify } = require('util');

exports.protectClient = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if client still exists
    const currentClient = await DmsZohoClient.findById(decoded.id);
    if (!currentClient) {
      return res.status(401).json({
        status: 'fail',
        message: 'The client belonging to this token does no longer exist.',
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentClient;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.',
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await DmsZohoClient.findByIdAndUpdate(req.user._id, { online_status: false });
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
};

exports.getClientDocuments = async (req, res) => {
  try {
    // Assuming req.user is populated by the protect middleware
    const lead_id = req.user.lead_id;


    if (!lead_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Lead ID not found for the authenticated client.',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const documents = await DmsZohoDocument.find({ record_id: lead_id })
      .skip(skip)
      .limit(limit);

    const totalRecords = await DmsZohoDocument.countDocuments({ record_id: lead_id });
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      status: 'success',
      data: {
        documents,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching client documents:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while fetching documents.',
    });
  }
};

exports.deleteClientDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const clientLeadId = req.user.lead_id; // From protectClient middleware

    const document = await DmsZohoDocument.findById(docId);

    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found.',
      });
    }

    // Ensure the document belongs to the logged-in client
    if (document.record_id !== clientLeadId) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this document.',
      });
    }

    // Delete from Zoho WorkDrive
    await deleteFileFromWorkDrive(document.workdrive_file_id);

    // Delete from MongoDB
    await DmsZohoDocument.findByIdAndDelete(docId);

    res.status(204).json({
      status: 'success',
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting client document:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while deleting the document.',
    });
  }
};

exports.renameClientDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const { newName } = req.body;
    const clientLeadId = req.user.lead_id; // From protectClient middleware

    if (!newName) {
      return res.status(400).json({
        status: 'fail',
        message: 'New name is required.',
      });
    }

    const document = await DmsZohoDocument.findOne({ _id: docId, record_id: clientLeadId });

    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found or you are not authorized to rename it.',
      });
    }

    // Rename in Zoho WorkDrive
    await renameWorkDriveFile(document.workdrive_file_id, newName);

    // Update in MongoDB
    document.file_name = newName;
    await document.save();

    res.status(200).json({
      status: 'success',
      message: 'Document renamed successfully.',
      data: {
        document,
      },
    });
  } catch (error) {
    console.error('Error renaming client document:', error);

    // Check for the specific Zoho error for duplicate file names
    if (error.message && error.message.includes('Resource with same name exists')) {
      return res.status(409).json({ // 409 Conflict is a suitable status code
        status: 'fail',
        message: 'A file with this name already exists. Please choose a different name.',
      });
    }

    // For any other errors, send a generic 500 response
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while renaming the document.',
    });
  }
};


exports.getChecklist = async (req, res) => {
  try {
    const leadId = req.user.lead_id;
    const user = await DmsZohoClient.findOne({ lead_id: leadId });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    const checklist = user.checklist; // Assuming 'checklist' is a field in the User model

    res.status(200).json({
      status: 'success',
      data: {
        checklist,
      },
    });
  } catch (error) {
    console.error('Error fetching user checklist:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong while fetching the checklist.',
    });
  }
}


exports.resetPasswordByLeadId = async (req, res) => {
  try {
    const { leadId, newPassword } = req.body;

    if (!leadId || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide leadId and newPassword',
      });
    }

    const client = await DmsZohoClient.findOne({ lead_id: leadId });

    if (!client) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client Account not found'
      })
    };

    client.password = newPassword;
    client.password_value = newPassword;

    await client.save();

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully',
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong during password reset',
    });
  }
}

// Admin: Get client account by record_id (lead_id) using aggregation
exports.getClientAccountByRecordId = async (req, res) => {
  try {
    const { record_id } = req.params;

    if (!record_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'record_id is required',
      });
    }

    // Use aggregation pipeline for efficient querying with validation status
    const result = await DmsZohoClient.aggregate([
      { $match: { lead_id: record_id } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          lead_id: 1,
          lead_owner: 1,
          record_type: 1,
          created_at: 1,
          password_value: 1,
          notes: 1,
          accountStatus: {
            exists: true,
            emailValid: { $cond: [{ $ne: ['$email', null] }, true, false] },
            phoneValid: { $cond: [{ $ne: ['$phone', null] }, true, false] },
            emailExists: { $cond: [{ $ne: ['$email', null] }, true, false] },
            phoneExists: { $cond: [{ $ne: ['$phone', null] }, true, false] }
          }
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client account not found with the provided record_id',
      });
    }

    const client = result[0];

    res.status(200).json({
      status: 'success',
      data: {
        client,
      },
    });
  } catch (error) {
    console.error('Error fetching client account:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while fetching client account',
    });
  }
};

// Admin: Update client account by record_id (lead_id)
exports.updateClientAccountByRecordId = async (req, res) => {
  try {
    const { record_id } = req.params;
    const { email, phone, password } = req.body;

    if (!record_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'record_id is required',
      });
    }

    // Check if at least one field is provided for update
    if (!email && !phone && !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one field (email, phone, or password) must be provided for update',
      });
    }

    // Find the client first to check if it exists
    const existingClient = await DmsZohoClient.findOne({ lead_id: record_id });

    if (!existingClient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client account not found with the provided record_id',
      });
    }

    // Prepare update object
    const updateData = {};

    // Validate and update email if provided
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid email format',
        });
      }

      // Check if email already exists for another client
      const emailExists = await DmsZohoClient.findOne({
        email: email.toLowerCase().trim(),
        lead_id: { $ne: record_id } // Exclude current client
      });

      if (emailExists) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email already exists for another client',
        });
      }

      updateData.email = email.toLowerCase().trim();
    }

    // Update phone if provided
    if (phone) {
      // Sanitize phone number (remove spaces and + symbols)
      updateData.phone = phone.replace(/[\s+]/g, '');
    }

    // Update password if provided
    if (password) {
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          status: 'fail',
          message: 'Password must be at least 6 characters long',
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
      updateData.password_value = password; // Store plain password value
    }

    // Perform atomic update using findOneAndUpdate
    const updatedClient = await DmsZohoClient.findOneAndUpdate(
      { lead_id: record_id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password hash from response

    if (!updatedClient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client account not found or update failed',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Client account updated successfully',
      data: {
        client: updatedClient,
      },
    });
  } catch (error) {
    console.error('Error updating client account:', error);

    // Handle duplicate key error (email uniqueness)
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already exists for another client',
      });
    }

    res.status(500).json({
      status: 'error',
      message: error.message || 'Something went wrong while updating client account',
    });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const { id }   = req.params;
    const limit    = Math.min(parseInt(req.query.limit,    10) || 10, 50);
    const docsPage = Math.max(parseInt(req.query.docs_page,10) || 1, 1);
    const docsSkip = (docsPage - 1) * limit;

    const client = await DmsZohoClient.findById(id).select('-password -checklist');
    if (!client) return res.status(404).json({ status: 'fail', message: 'Client not found' });

    const zohoModule = client.record_type === 'spouse_skill_assessment'
      ? 'Spouse_Skill_Assessment' : 'Visa_Applications';
    const zohoFields = client.record_type === 'spouse_skill_assessment'
      ? 'id, Name, Email, DMS_Application_Status, Application_Stage, Deadline_For_Lodgment, Record_Type, Recent_Activity, Package_Finalize, Assessing_Authority, Suggested_Anzsco, Spouse_Name, Application_Handled_By'
      : 'id, Name, Email, DMS_Application_Status, Application_Stage, Deadline_For_Lodgment, Record_Type, Recent_Activity, Package_Finalize, Qualified_Country, Service_Finalized, Checklist_Requested, Send_Check_List, Application_Handled_By';

    const [docsResult, docsTotal, docStats, appRes] = await Promise.allSettled([
      DmsZohoDocument.find({ record_id: client.lead_id })
        .sort({ uploaded_at: -1 })
        .skip(docsSkip)
        .limit(limit)
        .select('_id file_name document_name document_category status uploaded_at uploaded_by workdrive_file_id')
        .lean(),
      DmsZohoDocument.countDocuments({ record_id: client.lead_id }),
      DmsZohoDocument.aggregate([
        { $match: { record_id: client.lead_id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      zohoRequest('coql', 'POST', {
        select_query: `select ${zohoFields} from ${zohoModule} where id = '${client.lead_id}'`,
      }),
    ]);

    const docs                = docsResult.status === 'fulfilled' ? docsResult.value           : [];
    const totalDocs           = docsTotal.status  === 'fulfilled' ? docsTotal.value            : 0;
    const statRows            = docStats.status   === 'fulfilled' ? docStats.value             : [];
    const applicationData     = appRes.status     === 'fulfilled' ? appRes.value?.data?.[0] ?? null : null;
    const documents_by_status = Object.fromEntries(statRows.map(s => [s._id, s.count]));

    res.status(200).json({
      status: 'success',
      data: {
        client: { ...client.toObject(), application_data: applicationData },
        documents: {
          data: docs,
          totalRecords: totalDocs,
          totalPages: Math.ceil(totalDocs / limit),
          currentPage: docsPage,
          limit,
          documents_by_status,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};

exports.getClientNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await DmsZohoClient.findById(id).select('notes').lean();
    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found' });
    }
    res.status(200).json({
      status: 'success',
      data: { notes: client.notes || [] },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};

exports.addClientNote = async (req, res) => {
  try {
    const { id } = req.params;
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
      { _id: id },
      { $push: { notes: { note, addedBy, addedAt } } },
      { new: true, runValidators: true }
    ).select('notes');
    if (!updated) {
      return res.status(404).json({ status: 'fail', message: 'Client not found' });
    }
    const newNote = updated.notes[updated.notes.length - 1];
    res.status(201).json({
      status: 'success',
      data: { note: newNote, notes: updated.notes },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};