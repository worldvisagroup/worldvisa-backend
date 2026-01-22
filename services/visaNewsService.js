const axios = require("axios");
const VisaNews = require("../models/VisaNews");
const mongoose = require("mongoose");

/**
 * List of countries to fetch visa news for
 * ISO 3166-1 alpha-2 country codes
 */
const TARGET_COUNTRIES = [
  "US", // United States
  "CA", // Canada
  "AU", // Australia
  "GB", // United Kingdom
  "IN", // India
  "DE", // Germany
  "FR", // France
  "AE", // UAE
  "SG", // Singapore
  "NZ", // New Zealand
  "IE", // Ireland
  "IT", // Italy
  "ES", // Spain
  "NL", // Netherlands
  "SE", // Sweden
  "CH", // Switzerland
  "JP", // Japan
  "CN", // China
  "BR", // Brazil
  "MX", // Mexico
];

/**
 * Keywords to search for visa-related news
 */
const VISA_KEYWORDS = [
  "visa",
  "immigration",
  "travel",
  "emigration",
  "passport",
  "work permit",
  "residence permit",
  "green card",
  "citizenship",
  "border",
];

/**
 * Detect visa type from article content
 * @param {string} title - Article title
 * @param {string} description - Article description
 * @returns {string} - Detected visa type
 */
const detectVisaType = (title, description) => {
  const content = `${title} ${description}`.toLowerCase();

  // Priority-based detection (check in order of specificity)
  if (
    content.includes("student") ||
    content.includes("study") ||
    content.includes("university") ||
    content.includes("college") ||
    content.includes("f-1") ||
    content.includes("tier 4")
  ) {
    return "STUDENT";
  }

  if (
    content.includes("work") ||
    content.includes("employment") ||
    content.includes("job") ||
    content.includes("h-1b") ||
    content.includes("skilled worker") ||
    content.includes("intra-company")
  ) {
    return "WORK";
  }

  if (
    content.includes("permanent residen") ||
    content.includes("pr ") ||
    content.includes("green card") ||
    content.includes("indefinite leave") ||
    content.includes("settlement")
  ) {
    return "PR";
  }

  if (
    content.includes("tourist") ||
    content.includes("visitor") ||
    content.includes("tourism") ||
    content.includes("b-1") ||
    content.includes("b-2") ||
    content.includes("standard visitor")
  ) {
    return "TOURIST";
  }

  if (
    content.includes("business") ||
    content.includes("entrepreneur") ||
    content.includes("investor") ||
    content.includes("startup")
  ) {
    return "BUSINESS";
  }

  if (
    content.includes("family") ||
    content.includes("spouse") ||
    content.includes("partner") ||
    content.includes("dependent") ||
    content.includes("parent") ||
    content.includes("child")
  ) {
    return "FAMILY";
  }

  if (
    content.includes("skilled") ||
    content.includes("professional") ||
    content.includes("express entry") ||
    content.includes("points-based")
  ) {
    return "SKILLED";
  }

  return "GENERAL";
};

/**
 * Normalize country code to uppercase
 * @param {string} countryCode - Country code from API
 * @returns {string} - Normalized country code
 */
const normalizeCountryCode = (countryCode) => {
  if (!countryCode) return "UNKNOWN";
  return countryCode.toUpperCase();
};

/**
 * Extract keywords from article
 * @param {string} title - Article title
 * @param {string} description - Article description
 * @returns {Array<string>} - Extracted keywords
 */
const extractKeywords = (title, description) => {
  const content = `${title} ${description}`.toLowerCase();
  const keywords = [];

  VISA_KEYWORDS.forEach((keyword) => {
    if (content.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return keywords;
};

/**
 * Check MongoDB connection health
 * @returns {Promise<Object>} - Connection status
 */
const checkDatabaseConnection = async () => {
  try {
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      isConnected: connectionState === 1,
      state: states[connectionState] || 'unknown',
      readyState: connectionState
    };
  } catch (error) {
    return {
      isConnected: false,
      state: 'error',
      error: error.message
    };
  }
};

/**
 * Fetch visa news from Mediastack API
 * @param {number} limit - Number of articles to fetch (default: 100)
 * @returns {Promise<Object>} - Result object with success status and count
 */
const fetchVisaNews = async (limit = 100) => {
  try {
    // Check database connection first
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.isConnected) {
      console.error(`❌ Database not connected (state: ${dbStatus.state})`);
      return {
        success: false,
        count: 0,
        message: `Database not connected (state: ${dbStatus.state})`,
        errorType: "database_connection"
      };
    }

    const MEDIASTACK_API_KEY = process.env.MEDIASTACK_API_KEY;

    if (!MEDIASTACK_API_KEY) {
      throw new Error("MEDIASTACK_API_KEY is not defined in environment variables");
    }

    console.log("🔄 Starting visa news fetch from Mediastack API...");

    // Try multiple keyword combinations to ensure we get results
    // Start with broader searches to get more articles, then narrow down if needed
    const keywordCombinations = [
      "visa", 
      "visa,immigration", 
      "visa,travel", // Alternative two-keyword combination
      "visa,immigration,travel", // Three keywords for more specific results
      "visa,immigration,travel,passport" // Four keywords for very specific results
    ];
    
    const countrySets = [
      "us,ca,au,gb,de,fr,ae,sg,nz,ie,it,es,nl,se,ch,jp,cn,br,mx", // All target countries
      "us,ca,au,gb,de,fr,ae,sg,nz,ie", // Top 10 countries
      "us,ca,au,gb,de", // Top 5 countries
      "us,ca,au" // Top 3 countries
    ];

    let response = null;
    let articles = [];
    let usedKeywords = "";
    let usedCountries = "";

    // Try different combinations until we get results
    for (const keywords of keywordCombinations) {
      for (const countries of countrySets) {
        console.log(`🔍 Trying: "${keywords}" in countries: ${countries}`);
        
        try {
          response = await axios.get("http://api.mediastack.com/v1/news", {
            params: {
              access_key: MEDIASTACK_API_KEY,
              keywords: keywords,
              countries: countries,
              languages: "en",
              limit: Math.min(limit, 100), // Increased limit since we can get more articles
              sort: "published_desc",
            },
          });

          if (response.data && response.data.data && response.data.data.length > 0) {
            articles = response.data.data;
            usedKeywords = keywords;
            usedCountries = countries;
            console.log(`✅ Found ${articles.length} articles with keywords: "${keywords}" and countries: ${countries}`);
            break;
          }
        } catch (err) {
          console.log(`❌ Failed with keywords: "${keywords}" and countries: ${countries}`);
          continue;
        }
      }
      if (articles.length > 0) break;
    }

    // If still no results, try without country filter
    if (articles.length === 0) {
      console.log("🔍 Trying without country filter...");
      try {
        response = await axios.get("http://api.mediastack.com/v1/news", {
          params: {
            access_key: MEDIASTACK_API_KEY,
            keywords: "visa",
            languages: "en",
            limit: Math.min(limit, 50), // Increased fallback limit
            sort: "published_desc",
          },
        });
        
        if (response.data && response.data.data) {
          articles = response.data.data;
          usedKeywords = "visa";
          usedCountries = "all";
          console.log(`✅ Found ${articles.length} articles with global search`);
        }
      } catch (err) {
        console.error("❌ Even global search failed:", err.message);
      }
    }

    if (articles.length === 0) {
      console.error("❌ No articles found with any keyword/country combination");
      return { success: false, count: 0, message: "No articles found" };
    }

    console.log(`📰 Fetched ${articles.length} articles from Mediastack using keywords: "${usedKeywords}" and countries: ${usedCountries}`);

    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // Process articles in batches to avoid overwhelming the database
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < articles.length; i += batchSize) {
      batches.push(articles.slice(i, i + batchSize));
    }

    console.log(`📦 Processing ${articles.length} articles in ${batches.length} batches of ${batchSize}`);

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} articles)`);
      
      // Process each article in the batch
      for (const article of batch) {
        try {
          // Skip articles without required fields
          if (!article.title || !article.source || !article.url || !article.published_at) {
            errorCount++;
            continue;
          }

          const title = article.title.trim();
          const description = article.description || "";
          const visaType = detectVisaType(title, description);
          const country = normalizeCountryCode(article.country);
          const articleKeywords = extractKeywords(title, description);

          const newsData = {
            title: title,
            description: description,
            country: country,
            visaType: visaType,
            source: article.source,
            url: article.url,
            imageUrl: article.image || null,
            publishedAt: new Date(article.published_at),
            fetchedAt: new Date(),
            author: article.author || null,
            category: article.category || null,
            language: article.language || "en",
            keywords: articleKeywords,
            isActive: true,
          };

          // Try to save the article with better error handling
          try {
            // Check if MongoDB is connected
            if (VisaNews.db.readyState !== 1) {
              console.error(`⚠️  MongoDB not connected (state: ${VisaNews.db.readyState})`);
              errorCount++;
              continue;
            }

            // Check for existing article with timeout
            const existingArticle = await VisaNews.findOne({
              title: title,
              source: article.source,
            }).maxTimeMS(10000); // Increased to 10 seconds

            if (existingArticle) {
              duplicateCount++;
              continue;
            }

            // Create and save new article with timeout
            const visaNews = new VisaNews(newsData);
            await visaNews.save({ maxTimeMS: 10000 }); // Increased to 10 seconds
            savedCount++;
          } catch (dbError) {
            if (dbError.code === 11000) {
              // Duplicate key error - article already exists
              duplicateCount++;
            } else if (dbError.name === 'MongoTimeoutError' || dbError.name === 'MongoServerSelectionError') {
              console.error(`⏰ Database timeout for article: ${title.substring(0, 50)}...`);
              errorCount++;
            } else if (dbError.name === 'MongoNetworkError') {
              console.error(`🌐 Network error for article: ${title.substring(0, 50)}...`);
              errorCount++;
            } else {
              console.error(`❌ Database error for article: ${title.substring(0, 50)}... - ${dbError.message}`);
              errorCount++;
            }
          }
        } catch (err) {
          console.error(`❌ Error processing article: ${err.message}`);
          errorCount++;
        }
      }
      
      // Add a small delay between batches to avoid overwhelming the database
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    console.log(`✅ Successfully saved ${savedCount} new articles`);
    console.log(`⏭️  Skipped ${duplicateCount} duplicate articles`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} articles had errors`);
    }

    return {
      success: true,
      count: savedCount,
      duplicates: duplicateCount,
      errors: errorCount,
      total: articles.length,
    };
  } catch (error) {
    console.error("❌ Error fetching visa news:", error.message);
    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 429) {
        console.error("🚫 Rate limit exceeded. Please wait before making another request.");
        return {
          success: false,
          count: 0,
          message: "Rate limit exceeded. Please wait before making another request.",
          errorType: "rate_limit"
        };
      } else if (status === 401) {
        console.error("🔑 Invalid API key");
        return {
          success: false,
          count: 0,
          message: "Invalid Mediastack API key",
          errorType: "auth_error"
        };
      } else {
        console.error(`❌ API Error ${status}:`, data);
        return {
          success: false,
          count: 0,
          message: `API Error ${status}: ${data?.error?.message || error.message}`,
          errorType: "api_error"
        };
      }
    }
    
    return {
      success: false,
      count: 0,
      message: error.message,
      errorType: "network_error"
    };
  }
};

/**
 * Clean up old visa news articles
 * @param {number} days - Delete articles older than this many days (default: 30)
 * @returns {Promise<Object>} - Result object with deletion count
 */
const cleanupOldNews = async (days = 30) => {
  try {
    console.log(`🧹 Cleaning up articles older than ${days} days...`);
    const result = await VisaNews.deleteOldArticles(days);
    console.log(`🗑️  Deleted ${result.deletedCount} old articles`);
    
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("❌ Error cleaning up old news:", error.message);
    return {
      success: false,
      deletedCount: 0,
      message: error.message,
    };
  }
};

/**
 * Get statistics about stored visa news
 * @returns {Promise<Object>} - Statistics object
 */
const getNewsStats = async () => {
  try {
    const totalCount = await VisaNews.countDocuments({ isActive: true });
    const countByCountry = await VisaNews.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const countByVisaType = await VisaNews.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$visaType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get latest article date
    const latestArticle = await VisaNews.findOne({ isActive: true })
      .sort({ publishedAt: -1 })
      .select("publishedAt");

    return {
      totalCount,
      countByCountry,
      countByVisaType,
      latestArticleDate: latestArticle ? latestArticle.publishedAt : null,
    };
  } catch (error) {
    console.error("❌ Error getting news stats:", error.message);
    return null;
  }
};

module.exports = {
  fetchVisaNews,
  cleanupOldNews,
  getNewsStats,
  detectVisaType,
  checkDatabaseConnection,
  TARGET_COUNTRIES,
  VISA_KEYWORDS,
};

