const Sentry = require("@sentry/node");
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const DmsZohoClient = require('../models/dmsZohoClient');
const DmsZohoDocument = require('../models/dmsZohoDocument');
const { deleteFileFromWorkDrive, renameWorkDriveFile } = require('../utils/dmsZohoWorkDrive');
const bcrypt = require('bcryptjs');
const Session = require('../models/session');
const { generateSessionId, generateCSRFToken, extractClientIP } = require('../utils/session');

const signToken = (id, lead_id, email) => {
  return jwt.sign({ id, lead_id, email, role: 'client' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};


exports.signup = async (req, res) => {
  return Sentry.startSpan({ name: 'auth.signup.client', op: 'auth' }, async () => {
    try {
      const { name, email, phone, lead_id, password, lead_owner, record_type } = req.body;

      if (!name || !email || !phone || !lead_id || !password || !lead_owner || !record_type) {
        Sentry.logger.warn('Client signup failed', { reason: 'validation_or_duplicate' });
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide name, email, phone, lead_id,lead_owner, record_type and password',
        });
      }

      const newClient = await DmsZohoClient.create({
        name,
        email,
        phone: phone.replace(/[\s+]/g, ''),
        lead_id,
        password,
        lead_owner,
        record_type,
        password_value: password
      });

      newClient.password = undefined;

      Sentry.logger.info('Client signup success', { userType: 'client', lead_id: newClient.lead_id });
      res.status(201).json({
        status: 'success',
        data: {
          client: newClient,
        },
      });
    } catch (error) {
      Sentry.logger.error('Client signup error', { message: error.message });
      res.status(500).json({
        status: 'error',
        message: error.message || 'Something went wrong during signup',
      });
    }
  });
};

exports.login = async (req, res) => {
  return Sentry.startSpan({ name: 'auth.login.client', op: 'auth' }, async () => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        Sentry.logger.warn('Client login failed', { reason: 'missing_credentials' });
        return res.status(400).json({
          status: 'fail',
          message: 'Please provide email and password',
        });
      }

      const client = await DmsZohoClient.findOne({ email }).select('+password');

      if (!client) {
        Sentry.logger.warn('Client login failed', { userType: 'client', reason: 'invalid_credentials' });
        return res.status(401).json({
          status: 'fail',
          message: 'Account not existing. Contact your visa executive.',
        });
      }

      if (!(await client.correctPassword(password, client.password))) {
        Sentry.logger.warn('Client login failed', { userType: 'client', reason: 'invalid_credentials' });
        return res.status(401).json({
          status: 'fail',
          message: 'Password is incorrect',
        });
      }

      const sessionId = generateSessionId();
      const csrfToken = generateCSRFToken();
      const expiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS) || 7;
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

      await Session.create({
        sessionId,
        userId: client._id.toString(),
        userType: 'client',
        role: 'client',
        csrfToken,
        ipAddress: extractClientIP(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        expiresAt
      });

      // Build cookie options
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SAME_SITE || 'strict',
        maxAge: expiryDays * 24 * 60 * 60 * 1000
      };

      // Only set domain if defined (not set for localhost)
      if (process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
      }

      res.cookie(process.env.SESSION_COOKIE_NAME || 'worldvisa_session', sessionId, cookieOptions);

      Sentry.logger.info('Client login success', { userType: 'client', lead_id: client.lead_id });
      res.status(200).json({
        status: 'success',
        csrfToken,
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
  });
};

exports.logout = async (req, res) => {
  return Sentry.startSpan({ name: 'auth.logout.client', op: 'auth' }, async () => {
    try {
      if (req.session) {
        await Session.deleteOne({ sessionId: req.session.sessionId });
      }

      // Build clear cookie options
      const clearCookieOptions = {};
      if (process.env.COOKIE_DOMAIN) {
        clearCookieOptions.domain = process.env.COOKIE_DOMAIN;
      }

      res.clearCookie(process.env.SESSION_COOKIE_NAME || 'worldvisa_session', clearCookieOptions);

      Sentry.logger.info('Client logout', { userType: 'client', userId: req.session?.userId });
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      Sentry.logger.error('Client logout error', { message: error.message });
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
};

exports.validateSessionEndpoint = async (req, res) => {
  return Sentry.startSpan({ name: 'auth.validateSession.client', op: 'auth' }, async () => {
    Sentry.logger.info('Client session validated', { userId: req.user?.id });
    res.status(200).json({
      status: 'success',
      user: req.user,
      session: {
        expiresAt: req.session.expiresAt,
        lastAccessedAt: req.session.lastAccessedAt
      }
    });
  });
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
    // Explicitly select password and password_value fields, exclude checklist
    const clients = await DmsZohoClient.find({}, '-checklist');
    res.status(200).json({
      status: 'success',
      results: clients.length,
      data: {
        clients,
      },
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

exports.protectClient = async (req, res, next) => {
  return Sentry.startSpan({ name: 'auth.protect.client', op: 'auth' }, async () => {
    try {
      if (req.session && req.user) {
        return next();
      }

      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        Sentry.logger.warn('Client protect failed', { reason: 'unauthorized_or_invalid_token' });
        return res.status(401).json({
          status: 'fail',
          message: 'You are not logged in! Please log in to get access.',
        });
      }

      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      const currentClient = await DmsZohoClient.findById(decoded.id);
      if (!currentClient) {
        Sentry.logger.warn('Client protect failed', { reason: 'unauthorized_or_invalid_token' });
        return res.status(401).json({
          status: 'fail',
          message: 'The client belonging to this token does no longer exist.',
        });
      }

      req.user = currentClient;
      next();
    } catch (error) {
      Sentry.logger.warn('Client protect failed', { reason: 'unauthorized_or_invalid_token' });
      res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.',
      });
    }
  });
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