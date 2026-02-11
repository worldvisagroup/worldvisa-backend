require("dotenv").config();

const Sentry = require("@sentry/node");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const ZohoDmsUser = require("../models/zohoDmsUser");
const { addNotificationAndEmit } = require("./helper/service/notifications");
const DmsZohoClient = require("../models/dmsZohoClient");
const Session = require("../models/session");
const {
  generateSessionId,
  generateCSRFToken,
  extractClientIP,
} = require("../utils/session");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await ZohoDmsUser.find(); // Include password in the results
    res.status(200).json({
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { username } = req.body;
    const { role } = req.user;

    // Check if the user has the master_admin role
    if (role !== "master_admin") {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }

    // Find and delete the user by username
    const deletedUser = await ZohoDmsUser.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({
        status: "fail",
        message: "User not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { username, newPassword } = req.body;
    const { role } = req.user;

    // Check if the user has the master_admin role
    if (role !== "master_admin") {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }

    // Find the user by username
    const user = await ZohoDmsUser.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found.",
      });
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password reset successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { username, newRole } = req.body;
    const { role } = req.user;

    // Check if the user has the master_admin role
    if (role !== "master_admin") {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action.",
      });
    }

    // Find the user by username
    const user = await ZohoDmsUser.findOne({ username });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found.",
      });
    }

    // Update the user's role
    user.role = newRole;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "User role updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
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
    status: "success",
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
  return Sentry.startSpan(
    { name: "auth.signup.admin", op: "auth" },
    async () => {
      try {
        const { username, password, role } = req.body;

        const existingUser = await ZohoDmsUser.findOne({
          username: username.toLowerCase(),
        });
        if (existingUser) {
          Sentry.logger.warn("Admin signup failed", {
            userType: "admin",
            reason: "validation_or_duplicate",
          });
          return res.status(400).json({
            status: "fail",
            message: "Username already exists",
          });
        }

        if (!username || !password || !role) {
          Sentry.logger.warn("Admin signup failed", {
            reason: "validation_or_duplicate",
          });
          return res.status(400).json({
            status: "fail",
            message: "Username, password, and role are required",
          });
        }

        const validRoles = [
          "master_admin",
          "supervisor",
          "team_leader",
          "admin",
        ];
        if (!validRoles.includes(role)) {
          Sentry.logger.warn("Admin signup failed", {
            reason: "validation_or_duplicate",
          });
          return res.status(400).json({
            status: "fail",
            message:
              "Invalid role. Must be one of: master_admin, supervisor, team_leader, admin",
          });
        }

        const newUser = await ZohoDmsUser.create({
          username: username.toLowerCase(),
          password: password,
          passwordVal: password,
          role: role,
        });

        Sentry.logger.info("Admin signup success", {
          userType: "admin",
          userId: newUser._id.toString(),
        });
        res.status(201).json({
          status: "success",
          message: "User created successfully",
          data: {
            user: {
              _id: newUser._id,
              username: newUser.username,
              role: newUser.role,
            },
          },
        });
      } catch (error) {
        Sentry.logger.warn("Admin signup failed", {
          reason: "validation_or_duplicate",
        });
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
      }
    },
  );
};

exports.login = async (req, res, next) => {
  return Sentry.startSpan(
    { name: "auth.login.admin", op: "auth" },
    async () => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          Sentry.logger.warn("Admin login failed", {
            reason: "missing_credentials",
          });
          return res.status(400).json({
            status: "fail",
            message: "Please provide username and password!",
          });
        }

        const user = await ZohoDmsUser.findOne({ username }).select(
          "+password",
        );

        if (!user || !(await user.correctPassword(password, user.password))) {
          Sentry.logger.warn("Admin login failed", {
            userType: "admin",
            reason: "invalid_credentials",
          });
          return res.status(401).json({
            status: "fail",
            message: "Incorrect username or password",
          });
        }

        const sessionId = generateSessionId();
        const csrfToken = generateCSRFToken();
        const expiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS) || 7;
        const expiresAt = new Date(
          Date.now() + expiryDays * 24 * 60 * 60 * 1000,
        );

        await Session.create({
          sessionId,
          userId: user._id.toString(),
          userType: "admin",
          role: user.role,
          csrfToken,
          ipAddress: extractClientIP(req),
          userAgent: req.headers["user-agent"] || "unknown",
          expiresAt,
        });

        // Build cookie options
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === "true",
          sameSite: process.env.COOKIE_SAME_SITE || "strict",
          maxAge: expiryDays * 24 * 60 * 60 * 1000,
        };
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
        // Only set domain if defined (not set for localhost)
        // if (process.env.COOKIE_DOMAIN) {
        //   cookieOptions.domain = process.env.COOKIE_DOMAIN;
        // }

        console.log("================================");
        console.log("🍪 About to set cookie");
        console.log("🍪 Session ID:", sessionId);
        console.log(
          "🍪 Cookie name:",
          process.env.SESSION_COOKIE_NAME || "worldvisa_session",
        );
        console.log(
          "🍪 Cookie options:",
          JSON.stringify(cookieOptions, null, 2),
        );
        console.log("🍪 ENV - COOKIE_DOMAIN:", process.env.COOKIE_DOMAIN);
        console.log("🍪 ENV - COOKIE_SECURE:", process.env.COOKIE_SECURE);
        console.log("🍪 ENV - COOKIE_SAME_SITE:", process.env.COOKIE_SAME_SITE);
        console.log("================================");

        res.cookie(
          process.env.SESSION_COOKIE_NAME || "worldvisa_session",
          sessionId,
          cookieOptions,
        );

        Sentry.logger.info("Admin login success", {
          userType: "admin",
          userId: user._id.toString(),
        });
        res.status(200).json({
          status: "success",
          csrfToken,
          data: {
            user: {
              _id: user._id,
              username: user.username,
              role: user.role,
            },
          },
        });
      } catch (error) {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
      }
    },
  );
};

exports.logout = async (req, res) => {
  return Sentry.startSpan(
    { name: "auth.logout.admin", op: "auth" },
    async () => {
      try {
        if (req.session) {
          await Session.deleteOne({ sessionId: req.session.sessionId });
        }

        // Build clear cookie options
        const clearCookieOptions = {};
        clearCookieOptions.domain = process.env.COOKIE_DOMAIN;
        // if (process.env.COOKIE_DOMAIN) {
        //   clearCookieOptions.domain = process.env.COOKIE_DOMAIN;
        // }

        res.clearCookie(
          process.env.SESSION_COOKIE_NAME || "worldvisa_session",
          clearCookieOptions,
        );

        Sentry.logger.info("Admin logout", {
          userType: "admin",
          userId: req.session?.userId,
        });
        res.status(200).json({
          status: "success",
          message: "Logged out successfully",
        });
      } catch (error) {
        Sentry.logger.error("Admin logout error", { message: error.message });
        res.status(500).json({
          status: "error",
          message: error.message,
        });
      }
    },
  );
};

exports.validateSessionEndpoint = async (req, res) => {
  return Sentry.startSpan(
    { name: "auth.validateSession.admin", op: "auth" },
    async () => {
      Sentry.logger.info("Admin session validated", { userId: req.user?.id });
      res.status(200).json({
        status: "success",
        user: req.user,
        session: {
          expiresAt: req.session.expiresAt,
          lastAccessedAt: req.session.lastAccessedAt,
        },
      });
    },
  );
};

exports.protect = async (req, res, next) => {
  return Sentry.startSpan(
    { name: "auth.protect.admin", op: "auth" },
    async () => {
      try {
        if (req.session && req.user) {
          return next();
        }

        let token;
        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith("Bearer")
        ) {
          token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
          Sentry.logger.warn("Admin protect failed", {
            reason: "unauthorized_or_invalid_token",
          });
          return res.status(401).json({
            status: "fail",
            message: "You are not logged in! Please log in to get access.",
          });
        }

        const decoded = await promisify(jwt.verify)(
          token,
          process.env.JWT_SECRET,
        );

        const currentUser = await ZohoDmsUser.findById(decoded.id);
        if (!currentUser) {
          Sentry.logger.warn("Admin protect failed", {
            reason: "unauthorized_or_invalid_token",
          });
          return res.status(401).json({
            status: "fail",
            message: "The user belonging to this token does no longer exist.",
          });
        }

        req.user = currentUser;
        next();
      } catch (error) {
        Sentry.logger.warn("Admin protect failed", {
          reason: "unauthorized_or_invalid_token",
        });
        res.status(401).json({
          status: "fail",
          message: "Invalid token. Please log in again.",
        });
      }
    },
  );
};

exports.getAllNotifications = async (req, res, next) => {
  try {
    // Only allow access if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized. Please log in.",
      });
    }

    // Pagination parameters
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    const skip = (page - 1) * limit;

    // Lazy require to avoid import issues at the top
    const ZohoDmsNotification = require("../models/zohoDmsNotification");

    const [notifications, totalRecords] = await Promise.all([
      ZohoDmsNotification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ZohoDmsNotification.countDocuments({ user: req.user._id }),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      status: "success",
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
      status: "fail",
      message: error.message,
    });
  }
};

exports.addNotification = async (req, res) => {
  try {
    const { message, type = "info", category, link = null } = req.body;
    const { _id } = req.user;

    if (!_id || !message) {
      return res.status(400).json({
        status: "fail",
        message: "_id and message are required.",
      });
    }

    const notification = await addNotificationAndEmit({
      req,
      userId: _id,
      leadId: null,
      message,
      type,
      category,
      link,
    });

    res.status(201).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    console.error("Error in addNotification:", error);
    res.status(500).json({
      status: "fail",
      message: error.message || "Internal server error",
    });
  }
};

exports.addNotificationByClient = async (req, res) => {
  try {
    const { message, type = "info", category, link = null } = req.body;
    const { lead_owner, lead_id } = req.user;

    if (!lead_owner) {
      return res.status(404).json({
        status: "fail",
        message: "lead_owner does not exist for this lead.",
      });
    }

    const DmsUser = require("../models/zohoDmsUser");
    // Find the user by lead_owner (assuming lead_owner is the user's _id or some unique field)
    const user = await DmsUser.findOne({ username: lead_owner });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User (lead_owner) not found.",
      });
    }
    const _id = user._id;

    if (!_id || !message) {
      return res.status(400).json({
        status: "fail",
        message: "_id and message are required.",
      });
    }

    const notification = await addNotificationAndEmit({
      req,
      userId: _id,
      leadId: lead_id,
      message,
      type,
      category,
      link,
    });

    res.status(201).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const ZohoDmsNotification = require("../models/zohoDmsNotification");
    const { notificationId } = req.body;
    const userId = req.user._id;

    if (!notificationId) {
      return res.status(400).json({
        status: "fail",
        message: "notificationId is required.",
      });
    }

    // Only allow the user to delete their own notification
    const notification = await ZohoDmsNotification.findOne({
      _id: notificationId,
      user: userId,
    });
    if (!notification) {
      return res.status(404).json({
        status: "fail",
        message: "Notification not found or not authorized.",
      });
    }

    await ZohoDmsNotification.deleteOne({ _id: notificationId });

    try {
      const io = req.app.get("io");
      io?.to(`user:${userId}`).emit("notification:deleted", {
        _id: notificationId,
      });
    } catch (err) {
      console.log("Got error from the socket, delete notification");
    }

    res.status(200).json({
      status: "success",
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.updateNotificationIsRead = async (req, res) => {
  try {
    const ZohoDmsNotification = require("../models/zohoDmsNotification");
    const { notificationId, isRead } = req.body;
    const userId = req.user._id;

    if (!notificationId || typeof isRead !== "boolean") {
      return res.status(400).json({
        status: "fail",
        message: "notificationId and isRead(boolean) are required.",
      });
    }

    // Only allow the user to update their own notification
    const notification = await ZohoDmsNotification.findOne({
      _id: notificationId,
      user: userId,
    });
    if (!notification) {
      return res.status(404).json({
        status: "fail",
        message: "Notification not found or not authorized.",
      });
    }

    notification.isRead = isRead;
    await notification.save();

    try {
      const io = req.app.get("io");
      io?.to(`user:${userId}`).emit("notification:updated", {
        _id: notification._id,
        isRead: notification.isRead,
      });
    } catch (error) {
      console.log(
        "error occured on websocket for update notification is read: ",
        error,
      );
    }

    res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
