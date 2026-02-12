const { getDeadlineStatistics } = require('../services/applicationStatsService');

const getDeadlineStats = async (req, res) => {
  try {
    // Extract optional type filter from query params
    const { type } = req.query; // 'visa', 'spouse', or undefined (both)

    // Validate type parameter
    if (type && !['visa', 'spouse'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type parameter. Must be 'visa' or 'spouse'"
      });
    }

    console.log(`Fetching deadline stats from Zoho (type: ${type || 'all'})...`);

    // Fetch fresh data from Zoho with optional type filter
    const stats = await getDeadlineStatistics(type);

    // Return response
    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error('Error fetching deadline statistics:', err.response?.data || err.message);

    // Distinguish between Zoho API errors and application errors
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

    // General error response
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
