require("dotenv").config();

const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const ZohoDmsUser = require('../models/zohoDmsUser');
const { addNotificationAndEmit } = require("./helper/service/notifications");
const DmsZohoClient = require("../models/dmsZohoClient");
const DmsZohoDocument = require('../models/dmsZohoDocument');
const ZohoDmsNotification = require('../models/zohoDmsNotification');
const { zohoRequest } = require('./zohoDms/zohoApi');
const { uploadToR2 } = require('../services/r2Client');

exports.getAllUsers = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip  = (page - 1) * limit;
    const { search, role } = req.query;

    const matchStage = {};
    if (role)   matchStage.role = role.trim();
    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchStage.username = new RegExp(esc, 'i');
    }

    // Single pipeline: filter + paginate + count
    const [result] = await ZohoDmsUser.aggregate([
      { $match: matchStage },
      {
        $facet: {
          data: [
            { $sort: { last_login: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { password: 0, passwordVal: 0 } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const users      = result.data;
    const total      = result.totalCount[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    if (!users.length) {
      return res.status(200).json({
        status: 'success', results: 0,
        pagination: { currentPage: page, totalPages: 0, totalRecords: 0, limit },
        data: { users: [] },
      });
    }

    const usernames = users.map(u => u.username);
    const userIds = users.map(u => u._id);

    const allStats = await Promise.allSettled([
      DmsZohoDocument.aggregate([
        { $match: { 'requested_reviews.requested_by': { $in: usernames } } },
        { $unwind: '$requested_reviews' },
        { $match: { 'requested_reviews.requested_by': { $in: usernames } } },
        { $group: {
            _id:     '$requested_reviews.requested_by',
            total:   { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$requested_reviews.status', 'pending'] }, 1, 0] } },
        }},
      ]),
      DmsZohoDocument.aggregate([
        { $match: { 'requested_reviews.requested_to': { $in: usernames } } },
        { $unwind: '$requested_reviews' },
        { $match: { 'requested_reviews.requested_to': { $in: usernames } } },
        { $group: {
            _id:     '$requested_reviews.requested_to',
            total:   { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$requested_reviews.status', 'pending'] }, 1, 0] } },
        }},
      ]),
      ZohoDmsNotification.aggregate([
        { $match: { user: { $in: userIds }, isRead: false } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
      ...usernames.map(username =>
        Promise.all([
          zohoRequest('coql', 'POST', {
            select_query: `select COUNT(id) as total from Visa_Applications where Application_Handled_By like '${username}' and Application_State = 'Active'`,
          }),
          zohoRequest('coql', 'POST', {
            select_query: `select COUNT(id) as total from Spouse_Skill_Assessment where Application_Handled_By like '${username}'`,
          }),
        ]).then(([vRes, sRes]) => ({
          username,
          count: (vRes?.data?.[0]?.total || 0) + (sRes?.data?.[0]?.total || 0),
        })).catch(() => ({ username, count: 0 }))
      ),
    ]);

    const [sentStats, receivedStats, notifStats, ...appResults] = allStats;

    const sentMap     = new Map((sentStats.status     === 'fulfilled' ? sentStats.value     : []).map(s => [s._id, s]));
    const receivedMap = new Map((receivedStats.status === 'fulfilled' ? receivedStats.value : []).map(s => [s._id, s]));
    const notifMap    = new Map((notifStats.status    === 'fulfilled' ? notifStats.value    : []).map(s => [s._id.toString(), s.count]));
    const appCountMap = new Map();

    for (const r of appResults) {
      if (r.status === 'fulfilled' && r.value?.username !== undefined) {
        appCountMap.set(r.value.username, r.value.count);
      }
    }

    const enriched = users.map(u => ({
      ...u,
      stats: {
        active_applications:       appCountMap.get(u.username)         ?? 0,
        reviews_sent:              sentMap.get(u.username)?.total       ?? 0,
        reviews_sent_pending:      sentMap.get(u.username)?.pending     ?? 0,
        reviews_received:          receivedMap.get(u.username)?.total   ?? 0,
        reviews_received_pending:  receivedMap.get(u.username)?.pending ?? 0,
        unread_notifications:      notifMap.get(u._id.toString())       ?? 0,
      },
    }));

    res.status(200).json({
      status: 'success',
      results: enriched.length,
      pagination: { currentPage: page, totalPages, totalRecords: total, limit },
      data: { users: enriched },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id }      = req.params;
    const limit       = Math.min(parseInt(req.query.limit,        10) || 10, 50);
    const reviewsPage = Math.max(parseInt(req.query.reviews_page, 10) || 1, 1);
    const appsPage    = Math.max(parseInt(req.query.apps_page,    10) || 1, 1);
    const notifsPage  = Math.max(parseInt(req.query.notifs_page,  10) || 1, 1);

    const user = await ZohoDmsUser.findById(id).select('-password -passwordVal');
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    const { username } = user;
    const reviewSkip   = (reviewsPage - 1) * limit;
    const appsOffset   = (appsPage    - 1) * limit;
    const notifsSkip   = (notifsPage  - 1) * limit;

    const [sentResult, receivedResult, notifResult, notifTotal, visaRes, spouseRes] = await Promise.allSettled([
      DmsZohoDocument.aggregate([
        { $match: { 'requested_reviews.requested_by': username } },
        { $unwind: '$requested_reviews' },
        { $match: { 'requested_reviews.requested_by': username } },
        { $sort: { 'requested_reviews.requested_at': -1 } },
        { $lookup: { from: 'dmszohoclients', localField: 'record_id', foreignField: 'lead_id', as: 'client' } },
        {
          $facet: {
            data: [
              { $skip: reviewSkip }, { $limit: limit },
              { $project: {
                  _id: 1, record_id: 1, document_name: 1, document_category: 1,
                  client_name: { $arrayElemAt: ['$client.name', 0] },
                  review: {
                    _id:          '$requested_reviews._id',
                    requested_to: '$requested_reviews.requested_to',
                    status:       '$requested_reviews.status',
                    requested_at: '$requested_reviews.requested_at',
                  },
              }},
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]),
      DmsZohoDocument.aggregate([
        { $match: { 'requested_reviews.requested_to': username } },
        { $unwind: '$requested_reviews' },
        { $match: { 'requested_reviews.requested_to': username } },
        { $sort: { 'requested_reviews.requested_at': -1 } },
        { $lookup: { from: 'dmszohoclients', localField: 'record_id', foreignField: 'lead_id', as: 'client' } },
        {
          $facet: {
            data: [
              { $skip: reviewSkip }, { $limit: limit },
              { $project: {
                  _id: 1, record_id: 1, document_name: 1, document_category: 1,
                  client_name: { $arrayElemAt: ['$client.name', 0] },
                  review: {
                    _id:          '$requested_reviews._id',
                    requested_by: '$requested_reviews.requested_by',
                    status:       '$requested_reviews.status',
                    requested_at: '$requested_reviews.requested_at',
                  },
              }},
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]),
      ZohoDmsNotification.find({ user: user._id }).sort({ createdAt: -1 }).skip(notifsSkip).limit(limit).lean(),
      ZohoDmsNotification.countDocuments({ user: user._id }),
      zohoRequest('coql', 'POST', {
        select_query: `select id, Name, DMS_Application_Status, Application_Stage, Deadline_For_Lodgment, Record_Type, Qualified_Country, Recent_Activity, Package_Finalize from Visa_Applications where Application_Handled_By like '${username}' and Application_State = 'Active' order by Created_Time desc limit ${limit} offset ${appsOffset}`,
      }),
      zohoRequest('coql', 'POST', {
        select_query: `select id, Name, DMS_Application_Status, Application_Stage, Deadline_For_Lodgment, Record_Type, Assessing_Authority, Recent_Activity from Spouse_Skill_Assessment where Application_Handled_By like '${username}' order by Created_Time desc limit ${limit} offset ${appsOffset}`,
      }),
    ]);

    const sentData     = sentResult.status     === 'fulfilled' ? sentResult.value[0]       : { data: [], totalCount: [] };
    const receivedData = receivedResult.status === 'fulfilled' ? receivedResult.value[0]   : { data: [], totalCount: [] };
    const notifs       = notifResult.status    === 'fulfilled' ? notifResult.value          : [];
    const totalNotifs  = notifTotal.status     === 'fulfilled' ? notifTotal.value           : 0;
    const visaApps     = visaRes.status        === 'fulfilled' ? visaRes.value?.data   ?? [] : [];
    const spouseApps   = spouseRes.status      === 'fulfilled' ? spouseRes.value?.data ?? [] : [];

    res.status(200).json({
      status: 'success',
      data: {
        user: { _id: user._id, username: user.username, role: user.role, last_login: user.last_login, online_status: user.online_status, profile_image_url: user.profile_image_url },
        reviews_sent: {
          data: sentData.data,
          totalRecords: sentData.totalCount[0]?.count ?? 0,
          currentPage: reviewsPage, limit,
        },
        reviews_received: {
          data: receivedData.data,
          totalRecords: receivedData.totalCount[0]?.count ?? 0,
          currentPage: reviewsPage, limit,
        },
        applications: {
          data: [...visaApps, ...spouseApps],
          currentPage: appsPage, limit,
        },
        notifications: {
          data: notifs,
          totalRecords: totalNotifs,
          currentPage: notifsPage, limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { username } = req.body;
    const { role } = req.user;

    if (role !== 'master_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.',
      });
    }

    const deletedUser = await ZohoDmsUser.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};


exports.resetPassword = async (req, res, next) => {
  try {
    const { username, newPassword } = req.body;
    const { role } = req.user;

    if (role !== 'master_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.',
      });
    }

    const user = await ZohoDmsUser.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { username, newRole } = req.body;
    const { role } = req.user;

    if (role !== 'master_admin') {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.',
      });
    }

    const user = await ZohoDmsUser.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.',
      });
    }

    user.role = newRole;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User role updated successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};


const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
      },
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    // Check if user already exists
    const existingUser = await ZohoDmsUser.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Username already exists',
      });
    }

    // Validate required fields
    if (!username || !password || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'Username, password, and role are required',
      });
    }

    // Validate role
    const validRoles = ['master_admin', 'supervisor', 'team_leader', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid role. Must be one of: master_admin, supervisor, team_leader, admin',
      });
    }

    // Create new user
    const newUser = await ZohoDmsUser.create({
      username: username.toLowerCase(),
      password: password,
      passwordVal: password,
      role: role
    });

    // Return success without token
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: {
          _id: newUser._id,
          username: newUser.username,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1) Check if username and password exist
    if (!username || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide username and password!',
      });
    }

    // 2) Check if user exists && password is correct
    const user = await ZohoDmsUser.findOne({ username }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect username or password',
      });
    }

    // 3) Record last login, set online, then send token
    await ZohoDmsUser.findByIdAndUpdate(user._id, { last_login: new Date(), online_status: true });
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.protect = async (req, res, next) => {
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

    // 3) Check if user still exists
    const currentUser = await ZohoDmsUser.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist.',
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.',
    });
  }
};

const DMS_ADMIN_ROLES = ['master_admin', 'supervisor', 'team_leader', 'admin'];

exports.logout = async (req, res) => {
  try {
    await ZohoDmsUser.findByIdAndUpdate(req.user._id, { online_status: false });
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Logout failed' });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No image file provided' });
    }
    const ext = (req.file.originalname || 'image').split('.').pop() || 'jpg';
    const key = `profile-images/users/${req.user._id}/${Date.now()}.${ext}`;
    const url = await uploadToR2(key, req.file.buffer, req.file.mimetype || 'image/jpeg');
    const updated = await ZohoDmsUser.findByIdAndUpdate(
      req.user._id,
      { profile_image_url: url },
      { new: true }
    ).select('-password -passwordVal');
    res.status(200).json({ status: 'success', data: { user: updated } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || 'Upload failed' });
  }
};

exports.restrictToAdmin = (req, res, next) => {
  if (!req.user || !DMS_ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      status: 'fail',
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

exports.getAllNotifications = async (req, res, next) => {
  try {
    // Only allow access if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized. Please log in.',
      });
    }

    // Pagination parameters
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    limit = Math.min(limit, 100);
    const skip = (page - 1) * limit;

    const ZohoDmsNotification = require('../models/zohoDmsNotification');
    const selectFields = 'title message type category source isRead createdAt link leadId documentId documentName applicationType';

    const [notifications, totalRecords] = await Promise.all([
      ZohoDmsNotification.find({ user: req.user._id })
        .select(selectFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ZohoDmsNotification.countDocuments({ user: req.user._id })
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      status: 'success',
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.addNotification = async (req, res) => {
  try {
    const { message, title, type = 'info', category, source = 'general', link = null } = req.body;
    const { _id } = req.user;

    if (!_id || !message) {
      return res.status(400).json({
        status: 'fail',
        message: '_id and message are required.',
      });
    }

    const shortTitle = title != null ? title : (message.length > 80 ? message.slice(0, 77) + '...' : message);
    const notification = await addNotificationAndEmit({
      req,
      userId: _id,
      leadId: null,
      message,
      title: shortTitle,
      type,
      category,
      source,
      link,
    });

    res.status(201).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    console.error('Error in addNotification:', error);
    res.status(500).json({
      status: 'fail',
      message: error.message || 'Internal server error',
    });
  }
};

exports.addNotificationByClient = async (req, res) => {
  try {
    const { message, title, type = 'info', category, source = 'general', link = null } = req.body;
    const { lead_owner, lead_id } = req.user;

    if (!lead_owner) {
      return res.status(404).json({
        status: 'fail',
        message: 'lead_owner does not exist for this lead.',
      });
    }

    const DmsUser = require('../models/zohoDmsUser');
    const user = await DmsUser.findOne({ username: lead_owner });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User (lead_owner) not found.',
      });
    }
    const _id = user._id;

    if (!_id || !message) {
      return res.status(400).json({
        status: 'fail',
        message: '_id and message are required.',
      });
    }

    const shortTitle = title != null ? title : (message.length > 80 ? message.slice(0, 77) + '...' : message);
    const notification = await addNotificationAndEmit({
      req,
      userId: _id,
      leadId: lead_id,
      message,
      title: shortTitle,
      type,
      category,
      source,
      link,
    });

    res.status(201).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const ZohoDmsNotification = require('../models/zohoDmsNotification');
    const { notificationId } = req.body;
    const userId = req.user._id;

    if (!notificationId) {
      return res.status(400).json({
        status: 'fail',
        message: 'notificationId is required.',
      });
    }

    // Only allow the user to delete their own notification
    const notification = await ZohoDmsNotification.findOne({ _id: notificationId, user: userId });
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found or not authorized.',
      });
    }

    await ZohoDmsNotification.deleteOne({ _id: notificationId });

    try {
      const io = req.app.get('io');
      io?.to(`user:${userId}`).emit('notification:deleted', {
        _id: notificationId
      })
    } catch (err) {
      console.log("Got error from the socket, delete notification")
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};

exports.updateNotificationIsRead = async (req, res) => {
  try {
    const ZohoDmsNotification = require('../models/zohoDmsNotification');
    const { notificationId, isRead } = req.body;
    const userId = req.user._id;

    if (!notificationId || typeof isRead !== 'boolean') {
      return res.status(400).json({
        status: 'fail',
        message: 'notificationId and isRead(boolean) are required.',
      });
    }

    const notification = await ZohoDmsNotification.findOne({ _id: notificationId, user: userId });
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found or not authorized.',
      });
    }

    notification.isRead = isRead;
    await notification.save();

    try {
      const io = req.app.get('io');
      io?.to(`user:${userId}`).emit('notification:updated', {
        _id: notification._id,
        isRead: notification.isRead
      })
    } catch (error) {
      console.log("error occured on websocket for update notification is read: ", error);
    }

    res.status(200).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};




