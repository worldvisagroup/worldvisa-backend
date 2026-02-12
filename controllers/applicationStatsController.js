const { getDeadlineStatistics } = require('../services/applicationStatsService');
const { fetchCachedSummary, cacheSummary } = require('../services/redis');

const CACHE_KEY = 'deadline-stats';
const CACHE_TTL = 300; // 5 minutes in seconds

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

    // Check Redis cache first (include type in cache key)
    const cacheKey = type ? `${CACHE_KEY}-${type}` : CACHE_KEY;
    console.log(`Checking cache for deadline stats (type: ${type || 'all'})...`);
    const cachedData = await fetchCachedSummary(cacheKey);

    if (cachedData) {
      console.log('Cache hit for deadline stats');
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    console.log('Cache miss - fetching from Zoho');

    // Fetch fresh data from Zoho with optional type filter
    const stats = await getDeadlineStatistics(type);

    // Cache the result for 5 minutes (using type-specific cache key)
    await cacheSummary(cacheKey, stats);

    // Return response
    res.status(200).json({
      success: true,
      data: stats,
      cached: false
    });

  } catch (err) {
    console.error('Error fetching deadline statistics:', err.response?.data || err.message);

    // Try to return cached data if available, even if expired
    try {
      const fallbackData = await fetchCachedSummary(CACHE_KEY);
      if (fallbackData) {
        console.log('Returning stale cached data due to error');
        return res.status(200).json({
          success: true,
          data: fallbackData,
          cached: true,
          warning: 'Data may be stale due to temporary service issue'
        });
      }
    } catch (cacheErr) {
      console.error('Cache fallback also failed:', cacheErr.message);
    }

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
