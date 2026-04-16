const jwt = require('jsonwebtoken');
const DmsZohoClient = require('../models/dmsZohoClient');
const { addActivityLog } = require('./helper/service/activityLog');
const DmsZohoDocument = require('../models/dmsZohoDocument');
const { deleteFileFromWorkDrive, renameWorkDriveFile } = require('../utils/dmsZohoWorkDrive');
const { zohoRequest } = require('./zohoDms/zohoApi');
const bcrypt = require('bcryptjs');
const { inviteClientAfterSignup } = require('../services/clerk/clerkInvitationService');
const { escapeRegexForMongo, sanitizeSearchTerm } = require('../utils/querySanitizer');
const { VISA_DETAIL_FIELDS, SPOUSE_DETAIL_FIELDS } = require('../queries/visaApplicationCoql');
const { mapZohoRecordToClientSnapshot } = require('../utils/mapZohoRecordToClientSnapshot');

const signToken = (id, lead_id, email) => {
  return jwt.sign({ id, lead_id, email, role: 'client' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

const SIGNUP_CONFLICT_LEAD = {
  field: 'lead_id',
  code: 'LEAD_ALREADY_REGISTERED',
  message: 'An application for this lead is already registered.',
};

const SIGNUP_CONFLICT_EMAIL = {
  field: 'email',
  code: 'EMAIL_ALREADY_EXISTS',
  message: 'An account with this email already exists.',
};

/** Maps Mongo duplicate key (11000) to the same conflict shape as the pre-insert check. */
function signupConflictFromDuplicateKey(error) {
  const keyPattern = error.keyPattern || {};
  if (keyPattern.lead_id) return SIGNUP_CONFLICT_LEAD;
  if (keyPattern.email) return SIGNUP_CONFLICT_EMAIL;
  const kv = error.keyValue || {};
  if (kv.lead_id != null) return SIGNUP_CONFLICT_LEAD;
  if (kv.email != null) return SIGNUP_CONFLICT_EMAIL;
  return null;
}

// ─── Shared field helpers ─────────────────────────────────────────────────────

function strOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Builds a MongoDB $set-compatible object from a signup/webhook body.
 * Only includes keys explicitly present in the body (partial-update safe).
 */
function buildApplicationPayload(body) {
  const out = {};

  // NOTE: lead_owner is required in the schema, so webhook updates must never
  // accidentally $set it to null/empty when Zoho omits/clears a field.
  const strFields = [
    ['service_type',            'service_type'],
    ['application_stage',       'application_stage'],
    ['dms_application_status',  'dms_application_status'],
    ['qualified_country',       'qualified_country'],
    ['deadline_for_lodgment',   'deadline_for_lodgment'],
    ['application_state',       'application_state'],
    ['quality_check_from',      'quality_check_from'],
    ['assessing_authority',     'assessing_authority'],
    ['suggested_anzsco',        'suggested_anzsco'],
    ['send_check_list',         'send_check_list'],
    ['package_finalize',        'package_finalize'],
    ['spouse_skill_assessment', 'spouse_skill_assessment'],
    ['spouse_name',             'spouse_name'],
    ['main_applicant',          'main_applicant'],
  ];

  // Prefer explicit lead_owner over application_handled_by, support both keys,
  // and never include lead_owner if it normalizes to null/empty.
  const rawOwner =
    ('lead_owner' in body ? body.lead_owner : undefined) ??
    ('application_handled_by' in body ? body.application_handled_by : undefined) ??
    ('Application_Handled_By' in body ? body.Application_Handled_By : undefined);
  if (rawOwner !== undefined) {
    const normalizedOwner = strOrNull(rawOwner);
    if (normalizedOwner !== null) out.lead_owner = normalizedOwner;
  }

  for (const [bodyKey, dbKey] of strFields) {
    if (bodyKey in body) out[dbKey] = strOrNull(body[bodyKey]);
  }

  if ('recent_activity'    in body) out.recent_activity    = parseDateOrNull(body.recent_activity);
  if ('zoho_created_time'  in body) out.zoho_created_time  = parseDateOrNull(body.zoho_created_time);
  if ('zoho_modified_time' in body) out.zoho_modified_time = parseDateOrNull(body.zoho_modified_time);
  if ('checklist_requested' in body) out.checklist_requested = Boolean(body.checklist_requested);

  return out;
}



exports.signup = async (req, res) => {
  try {
    const { name, email, phone, lead_id, lead_owner, record_type, full_name } = req.body;

    if (!name || !email || !phone || !lead_id || !lead_owner || !record_type) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, phone, lead_id, lead_owner and record_type',
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedPhone = String(phone).replace(/\s/g, '');
    const phoneDigits = String(phone).replace(/\D/g, '');
    if (!phoneDigits.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'Phone number must contain at least one digit.',
        field: 'phone',
        code: 'PHONE_INVALID',
      });
    }
    if (phoneDigits.length > 12) {
      return res.status(400).json({
        status: 'fail',
        message: 'Phone number must be at most 12 digits.',
        field: 'phone',
        code: 'PHONE_TOO_LONG',
      });
    }

    const conflicts = await DmsZohoClient.find({
      $or: [{ email: normalizedEmail }, { lead_id }],
    })
      .select('email lead_id')
      .lean();

    if (conflicts.length > 0) {
      const leadTaken = conflicts.some((c) => c.lead_id === lead_id);
      const emailTaken = conflicts.some((c) => c.email === normalizedEmail);
      if (leadTaken) {
        return res.status(409).json({
          status: 'fail',
          ...SIGNUP_CONFLICT_LEAD,
        });
      }
      if (emailTaken) {
        return res.status(409).json({
          status: 'fail',
          ...SIGNUP_CONFLICT_EMAIL,
        });
      }
    }

    const optionalFields = buildApplicationPayload(req.body);

    const newClient = await DmsZohoClient.create({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      lead_id,
      lead_owner,
      record_type,
      ...(full_name ? { full_name } : {}),
      ...optionalFields,
    });

    addActivityLog({
      lead_id:       newClient.lead_id,
      activity_type: 'application_created',
      summary:       `Application created for ${name} (${record_type === 'spouse_skill_assessment' ? 'Spouse Skill Assessment' : 'Visa Application'})`,
      actor_type:    'staff',
      actor_name:    req.user?.username ?? 'Zoho',
      actor_role:    req.user?.role ?? null,
      metadata:      { record_type, lead_owner, email: normalizedEmail },
    });

    let inviteWarning = null;
    try {
      await inviteClientAfterSignup(newClient._id, newClient.email);
    } catch (inviteErr) {
      console.error('[signup] Clerk invitation failed:', inviteErr.message);
      inviteWarning = 'Client created but Clerk invitation could not be sent. Please invite manually.';
    }

    // Remove password from output
    newClient.password = undefined;

    return res.status(201).json({
      status: 'success',
      data: {
        client: newClient,
        ...(inviteWarning && { warning: inviteWarning }),
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {})
        .map((e) => e.message)
        .filter(Boolean);
      return res.status(400).json({
        status: 'fail',
        message: messages.length ? messages.join(' ') : 'Validation failed.',
      });
    }

    if (error.code === 11000 || error.code === '11000') {
      const dup = signupConflictFromDuplicateKey(error);
      if (dup) {
        return res.status(409).json({
          status: 'fail',
          ...dup,
        });
      }
      return res.status(409).json({
        status: 'fail',
        message: 'A client record with these details already exists.',
        code: 'DUPLICATE_KEY',
      });
    }

    console.error('[signup] Unexpected error:', error);

    const message =
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong during signup.'
        : error.message || 'Something went wrong during signup';

    return res.status(500).json({
      status: 'error',
      message,
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

    // 4) If everything is ok, send token to client
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

exports.logout = async (req, res) => {
  try {
    await DmsZohoClient.findByIdAndUpdate(req.client._id, { online_status: false });
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong during logout' });
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
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip  = (page - 1) * limit;

    const { search, lead_owner, invited } = req.query;

    // ── Phase 1: MongoDB — paginate + document stats ───────────────────────
    const matchStage = {};

    if (invited === 'true') {
      matchStage.account_status = 'invited';
    } else {
      matchStage.account_status = { $ne: 'invited' };
    }

    if (lead_owner) {
      matchStage.lead_owner = lead_owner.trim();
    }

    if (search) {
      const safeSearch = sanitizeSearchTerm(String(search), 100);
      if (!safeSearch) {
        return res.status(400).json({
          status: 'fail',
          message: 'search must be a non-empty string up to 100 characters.',
        });
      }
      const regex = new RegExp(escapeRegexForMongo(safeSearch), 'i');
      matchStage.$or = [
        { name:      regex },
        { full_name: regex },
        { email:     regex },
        { phone:     regex },
        { lead_id:   regex },
        { lead_owner: regex },
      ];
    }

    const [result] = await DmsZohoClient.aggregate([
      { $match: matchStage },
      {
        $facet: {
          data: [
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { password: 0, checklist: 0 } },
            // $lookup scoped to the page slice — runs for at most `limit` docs
            {
              $lookup: {
                from: 'dmszohodocuments',
                let:  { lid: '$lead_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$record_id', '$$lid'] } } },
                  { $group: { _id: '$status', count: { $sum: 1 } } },
                ],
                as: 'document_stats',
              },
            },
            {
              $addFields: {
                total_documents: { $sum: '$document_stats.count' },
                documents_by_status: {
                  $arrayToObject: {
                    $map: {
                      input: '$document_stats',
                      as:    's',
                      in:    { k: '$$s._id', v: '$$s.count' },
                    },
                  },
                },
              },
            },
            { $project: { document_stats: 0 } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const clients    = result.data;
    const total      = result.totalCount[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      results: clients.length,
      pagination: {
        currentPage:  page,
        totalPages,
        totalRecords: total,
        limit,
      },
      data: { clients },
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
      ? SPOUSE_DETAIL_FIELDS
      : VISA_DETAIL_FIELDS;

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

    if (applicationData?.id) {
      const snap = mapZohoRecordToClientSnapshot(
        applicationData,
        client.record_type === 'spouse_skill_assessment' ? 'spouse_skill_assessment' : 'visa_application',
      );
      await DmsZohoClient.findOneAndUpdate(
        { lead_id: client.lead_id },
        { $set: snap },
        { runValidators: true },
      ).exec();
    }

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

exports.checkAndSyncLeadOwner = async (req, res) => {
  try {
    const dry_run = req.query.dry_run === 'true';
    const record_type_filter = req.query.record_type || null;
    const VALID = ['visa_application', 'spouse_skill_assessment'];

    if (record_type_filter && !VALID.includes(record_type_filter)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid record_type. Must be visa_application or spouse_skill_assessment' });
    }

    const mongoQuery = record_type_filter ? { record_type: record_type_filter } : {};
    const mongoClients = await DmsZohoClient.find(mongoQuery)
      .select('lead_id lead_owner record_type').lean();

    if (!mongoClients.length) {
      return res.status(200).json({
        status: 'success',
        summary: { total_checked: 0, mismatched: 0, updated: 0, not_found_in_zoho: 0, errors: 0 },
        mismatches: [],
        dry_run,
      });
    }

    const ZOHO_MODULE = {
      visa_application: 'Visa_Applications',
      spouse_skill_assessment: 'Spouse_Skill_Assessment',
    };
    const grouped = { visa_application: [], spouse_skill_assessment: [] };
    for (const c of mongoClients) grouped[c.record_type]?.push(c.lead_id);

    const BATCH_SIZE = 100;
    const batchPromises = [];
    for (const [rtype, ids] of Object.entries(grouped)) {
      if (!ids.length) continue;
      for (const chunk of chunkArray(ids, BATCH_SIZE)) {
        const idList = chunk.map(id => `'${id}'`).join(', ');
        const query = `select id, Application_Handled_By from ${ZOHO_MODULE[rtype]} where id in (${idList}) limit ${BATCH_SIZE}`;
        batchPromises.push(
          zohoRequest('coql', 'POST', { select_query: query })
            .then(r => ({ data: r?.data ?? [] }))
            .catch(() => ({ data: [], error: true }))
        );
      }
    }

    const batchResults = await Promise.allSettled(batchPromises);
    const zohoMap = new Map();
    let batchErrors = 0;
    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        if (r.value.error) { batchErrors++; continue; }
        for (const rec of r.value.data) zohoMap.set(rec.id, rec.Application_Handled_By ?? null);
      } else {
        batchErrors++;
      }
    }

    const mismatches = [];
    const not_found_details = [];
    const updateOps = [];

    for (const { lead_id, lead_owner, record_type } of mongoClients) {
      if (!zohoMap.has(lead_id)) {
        not_found_details.push({ lead_id, record_type, mongodb_lead_owner: lead_owner });
        continue;
      }
      const zoho_value = zohoMap.get(lead_id);
      if ((lead_owner ?? '').trim() !== (zoho_value ?? '').trim()) {
        mismatches.push({ lead_id, record_type, mongodb_lead_owner: lead_owner, zoho_application_handled_by: zoho_value, updated: false });
        if (!dry_run) updateOps.push({ lead_id, zoho_value });
      }
    }

    let updated_count = 0;
    if (!dry_run && updateOps.length) {
      const updateResults = await Promise.allSettled(
        updateOps.map(({ lead_id, zoho_value }) =>
          DmsZohoClient.updateOne({ lead_id }, { $set: { lead_owner: zoho_value } })
        )
      );
      updateResults.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.modifiedCount > 0) {
          updated_count++;
          mismatches[i].updated = true;
        } else if (r.status === 'rejected') {
          batchErrors++;
        }
      });
    }

    res.status(200).json({
      status: 'success',
      dry_run,
      summary: {
        total_checked: mongoClients.length,
        mismatched: mismatches.length,
        updated: updated_count,
        not_found_in_zoho: not_found_details.length,
        errors: batchErrors,
      },
      mismatches,
      not_found_in_zoho: not_found_details,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong during lead owner sync' });
  }
};

exports.updateLeadOwnerFromZoho = async (req, res) => {
  const { lead_id, name, email, phone, record_type, full_name } = req.body;

  if (!lead_id) {
    return res.status(400).json({ status: 'fail', message: 'lead_id is required' });
  }

  try {
    // Build update payload from all provided body fields
    const setFields = buildApplicationPayload(req.body);
    if (name)       setFields.name      = String(name).trim();
    if (full_name !== undefined) setFields.full_name = strOrNull(full_name);
    if (email)      setFields.email     = String(email).toLowerCase().trim();
    if (phone)      setFields.phone     = String(phone).replace(/\s/g, '');

    // If Zoho explicitly includes an owner key but it normalizes to empty/null,
    // reject the request instead of attempting to null out a required field.
    const ownerKeyPresent =
      ('lead_owner' in req.body) ||
      ('application_handled_by' in req.body) ||
      ('Application_Handled_By' in req.body);
    if (ownerKeyPresent && !('lead_owner' in setFields)) {
      return res.status(400).json({
        status: 'fail',
        message: 'lead_owner must be a non-empty string',
      });
    }

    // ── UPDATE PATH ──────────────────────────────────────────────────────────
    const existing = await DmsZohoClient.findOne({ lead_id }).select('_id name record_type').lean();

    if (existing) {
      const updated = await DmsZohoClient.findOneAndUpdate(
        { lead_id },
        { $set: setFields },
        { new: true, runValidators: true }
      );

      addActivityLog({
        lead_id,
        activity_type: 'application_synced',
        summary:       `Application updated from Zoho for ${updated.name}`,
        actor_type:    'system',
        actor_name:    'Zoho Webhook',
        actor_role:    null,
        metadata:      { record_type: updated.record_type, lead_owner: updated.lead_owner },
      });

      return res.status(200).json({
        status: 'success',
        action: 'updated',
        data: {
          lead_id:     updated.lead_id,
          lead_owner:  updated.lead_owner,
          record_type: updated.record_type,
          name:        updated.name,
        },
      });
    }

    // ── CREATE PATH ──────────────────────────────────────────────────────────
    if (!name || !email || !phone || !record_type) {
      return res.status(404).json({
        status:  'fail',
        message: `No application found with lead_id: ${lead_id}. Provide name, email, phone, and record_type to create one.`,
      });
    }

    const newClient = await DmsZohoClient.create({
      name:        String(name).trim(),
      email:       String(email).toLowerCase().trim(),
      phone:       String(phone).replace(/\s/g, ''),
      lead_id,
      record_type,
      ...(full_name ? { full_name } : {}),
      ...setFields,
    });

    addActivityLog({
      lead_id,
      activity_type: 'application_created',
      summary:       `Application created from Zoho sync for ${newClient.name}`,
      actor_type:    'system',
      actor_name:    'Zoho Webhook',
      actor_role:    null,
      metadata:      { record_type, lead_owner: newClient.lead_owner },
    });

    return res.status(201).json({
      status: 'success',
      action: 'created',
      data: {
        lead_id:     newClient.lead_id,
        lead_owner:  newClient.lead_owner,
        record_type: newClient.record_type,
        name:        newClient.name,
      },
    });

  } catch (error) {
    if (error.code === 11000) {
      const keyPattern = error.keyPattern || {};
      const keyValue = error.keyValue || {};

      const conflictField =
        keyPattern.lead_id || keyValue.lead_id ? 'lead_id'
          : keyPattern.email || keyValue.email ? 'email'
            : 'unknown';

      if (conflictField === 'lead_id') {
        return res.status(409).json({
          status: 'fail',
          code: 'LEAD_ID_ALREADY_EXISTS',
          field: 'lead_id',
          lead_id,
          message: `A record with lead_id ${lead_id} already exists.`,
        });
      }

      if (conflictField === 'email') {
        const conflictEmail =
          keyValue.email != null
            ? String(keyValue.email)
            : email
              ? String(email).toLowerCase().trim()
              : null;

        return res.status(409).json({
          status: 'fail',
          code: 'EMAIL_ALREADY_EXISTS',
          field: 'email',
          lead_id,
          ...(conflictEmail ? { email: conflictEmail } : {}),
          message: conflictEmail
            ? `A record with email ${conflictEmail} already exists.`
            : 'A record with this email already exists.',
        });
      }

      return res.status(409).json({
        status: 'fail',
        code: 'DUPLICATE_KEY',
        field: 'unknown',
        lead_id,
        ...(email ? { email: String(email).toLowerCase().trim() } : {}),
        message: 'A record with this lead_id or email already exists.',
      });
    }
    console.error('[updateLeadOwnerFromZoho] Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};