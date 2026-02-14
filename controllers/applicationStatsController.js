const { getDeadlineStatistics } = require('../services/applicationStatsService');
const { MIN_PAGE, MAX_LIMIT } = require('./helper/constants');


// Validation helper for pagination parameters
const validatePaginationParams = (params) => {
  const errors = [];

  // Validate page numbers
  ['approachingPage', 'overduePage', 'noDeadlinePage'].forEach(param => {
    if (params[param] < MIN_PAGE) {
      errors.push(`${param} must be >= ${MIN_PAGE}`);
    }
  });

  // Validate limits
  ['approachingLimit', 'overdueLimit', 'noDeadlineLimit'].forEach(param => {
    if (params[param] < 1 || params[param] > MAX_LIMIT) {
      errors.push(`${param} must be between 1 and ${MAX_LIMIT}`);
    }
  });

  return errors;
};

const getDeadlineStats = async (req, res) => {
  try {
    // Extract user context from authenticated request
    const username = req.user.username;
    const role = req.user.role;

    // Parse and validate query parameters
    const params = {
      type: req.query.type,
      approachingPage: parseInt(req.query.approachingPage, 10) || 1,
      approachingLimit: parseInt(req.query.approachingLimit, 10) || 10,
      overduePage: parseInt(req.query.overduePage, 10) || 1,
      overdueLimit: parseInt(req.query.overdueLimit, 10) || 10,
      noDeadlinePage: parseInt(req.query.noDeadlinePage, 10) || 1,
      noDeadlineLimit: parseInt(req.query.noDeadlineLimit, 10) || 10
    };

    // Validate type parameter
    if (params.type && !['visa', 'spouse'].includes(params.type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type parameter. Must be 'visa' or 'spouse'"
      });
    }

    // Validate pagination parameters
    const validationErrors = validatePaginationParams(params);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid pagination parameters",
        details: validationErrors
      });
    }

    // Fetch deadline statistics with user context
    const stats = await getDeadlineStatistics(username, role, params);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error('Error fetching deadline statistics:', err.response?.data || err.message);

    if (err.response?.status === 401) {
      return res.status(503).json({
        success: false,
        error: "External service authentication failed",
        message: "Unable to connect to application database. Please try again later."
      });
    }

    if (err.response?.status === 429) {
      return res.status(503).json({
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests to external service. Please try again in a few minutes."
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch deadline statistics",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getDeadlineStats
};
