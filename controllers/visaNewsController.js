const VisaNews = require("../models/VisaNews");
const visaNewsService = require("../services/visaNewsService");

/**
 * GET /api/visa-news
 * Get all visa news with optional filters
 * Query params: country, visaType, limit, page, search
 */
const getAllVisaNews = async (req, res) => {
  try {
    const {
      country,
      visaType,
      limit = 10,
      page = 1,
      search,
      sortBy = "publishedAt",
      order = "desc",
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (country) {
      filter.country = country.toUpperCase();
    }

    if (visaType) {
      filter.visaType = visaType.toUpperCase();
    }

    // Add text search if search query provided
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortOrder = order === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Execute query with pagination
    let [news, totalCount] = await Promise.all([
      VisaNews.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      VisaNews.countDocuments(filter),
    ]);

    // If no data exists yet, trigger a fetch and try once more
    if (totalCount === 0) {
      try {
        console.log("No visa news found in DB. Triggering initial fetch...");
        const fetchResult = await visaNewsService.fetchVisaNews(50);
        if (fetchResult?.success && fetchResult.count > 0) {
          [news, totalCount] = await Promise.all([
            VisaNews.find(filter)
              .sort(sort)
              .skip(skip)
              .limit(limitNum)
              .lean(),
            VisaNews.countDocuments(filter),
          ]);
        }
      } catch (e) {
        console.error("Initial fetch on empty dataset failed:", e.message);
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching visa news:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visa news",
      error: error.message,
    });
  }
};

/**
 * GET /api/visa-news/:id
 * Get single visa news article by ID
 */
const getVisaNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const news = await VisaNews.findById(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "Visa news article not found",
      });
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("Error fetching visa news by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visa news article",
      error: error.message,
    });
  }
};

/**
 * POST /api/visa-news/fetch
 * Manually trigger news fetch from Mediastack API
 * Admin-only endpoint
 */
const fetchVisaNews = async (req, res) => {
  try {
    const { limit = 100 } = req.body;

    console.log("📡 Manual fetch triggered by admin");
    const result = await visaNewsService.fetchVisaNews(limit);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: "News fetch completed successfully",
        data: {
          newArticles: result.count,
          duplicates: result.duplicates,
          errors: result.errors,
          total: result.total,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to fetch news",
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error in manual news fetch:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visa news",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/visa-news/cleanup
 * Delete old news articles
 * Admin-only endpoint
 */
const cleanupOldNews = async (req, res) => {
  try {
    const { days = 30 } = req.body;

    const result = await visaNewsService.cleanupOldNews(days);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Cleaned up articles older than ${days} days`,
        data: {
          deletedCount: result.deletedCount,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to cleanup old news",
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error cleaning up old news:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up old news",
      error: error.message,
    });
  }
};

/**
 * GET /api/visa-news/stats
 * Get statistics about visa news
 */
const getNewsStats = async (req, res) => {
  try {
    const stats = await visaNewsService.getNewsStats();

    if (stats) {
      res.status(200).json({
        success: true,
        data: stats,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to get news statistics",
      });
    }
  } catch (error) {
    console.error("Error getting news stats:", error);
    res.status(500).json({
      success: false,
      message: "Error getting news statistics",
      error: error.message,
    });
  }
};

/**
 * GET /api/visa-news/countries
 * Get list of all available countries with news
 */
const getAvailableCountries = async (req, res) => {
  try {
    const countries = await VisaNews.distinct("country", { isActive: true });

    res.status(200).json({
      success: true,
      data: countries.sort(),
    });
  } catch (error) {
    console.error("Error getting available countries:", error);
    res.status(500).json({
      success: false,
      message: "Error getting available countries",
      error: error.message,
    });
  }
};

/**
 * GET /api/visa-news/visa-types
 * Get list of all available visa types
 */
const getAvailableVisaTypes = async (req, res) => {
  try {
    const visaTypes = await VisaNews.distinct("visaType", { isActive: true });

    res.status(200).json({
      success: true,
      data: visaTypes.sort(),
    });
  } catch (error) {
    console.error("Error getting available visa types:", error);
    res.status(500).json({
      success: false,
      message: "Error getting available visa types",
      error: error.message,
    });
  }
};

/**
 * GET /api/visa-news/latest
 * Get latest visa news (top 10 most recent)
 */
const getLatestNews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    let news = await VisaNews.find({ isActive: true })
      .sort({ publishedAt: -1 })
      .limit(limitNum)
      .lean();

    // If empty, attempt an on-demand fetch and try again
    if (!news || news.length === 0) {
      try {
        console.log("No latest news found. Triggering initial fetch for latest endpoint...");
        const fetchResult = await visaNewsService.fetchVisaNews(50);
        if (fetchResult?.success && fetchResult.count > 0) {
          news = await VisaNews.find({ isActive: true })
            .sort({ publishedAt: -1 })
            .limit(limitNum)
            .lean();
        }
      } catch (e) {
        console.error("Initial fetch for latest endpoint failed:", e.message);
      }
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error("Error fetching latest news:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching latest news",
      error: error.message,
    });
  }
};

/**
 * GET /api/visa-news/country/:country
 * Get visa news for a specific country
 */
const getNewsByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    const { limit = 10, page = 1, visaType } = req.query;

    const filter = {
      country: country.toUpperCase(),
      isActive: true,
    };

    if (visaType) {
      filter.visaType = visaType.toUpperCase();
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;

    const [news, totalCount] = await Promise.all([
      VisaNews.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      VisaNews.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching news by country:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching news by country",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/visa-news/:id
 * Delete a specific visa news article
 * Admin-only endpoint
 */
const deleteVisaNews = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await VisaNews.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Visa news article not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visa news article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting visa news:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting visa news article",
      error: error.message,
    });
  }
};

module.exports = {
  getAllVisaNews,
  getVisaNewsById,
  fetchVisaNews,
  cleanupOldNews,
  getNewsStats,
  getAvailableCountries,
  getAvailableVisaTypes,
  getLatestNews,
  getNewsByCountry,
  deleteVisaNews,
};

