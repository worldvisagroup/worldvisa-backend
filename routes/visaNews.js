const express = require("express");
const visaNewsController = require("../controllers/visaNewsController");

const router = express.Router();

/**
 * Public Routes
 */

// GET /api/visa-news - Get all visa news with filters
router.get("/", visaNewsController.getAllVisaNews);

// GET /api/visa-news/latest - Get latest visa news
router.get("/latest", visaNewsController.getLatestNews);

// GET /api/visa-news/stats - Get news statistics
router.get("/stats", visaNewsController.getNewsStats);

// GET /api/visa-news/countries - Get available countries
router.get("/countries", visaNewsController.getAvailableCountries);

// GET /api/visa-news/visa-types - Get available visa types
router.get("/visa-types", visaNewsController.getAvailableVisaTypes);

// GET /api/visa-news/country/:country - Get news by country
router.get("/country/:country", visaNewsController.getNewsByCountry);

// GET /api/visa-news/:id - Get single news article by ID
router.get("/:id", visaNewsController.getVisaNewsById);

/**
 * Admin Routes (Protected)
 * Note: Add authentication middleware as needed
 */

// POST /api/visa-news/fetch - Manually trigger news fetch
router.post("/fetch", visaNewsController.fetchVisaNews);

// POST /api/visa-news/cleanup - Delete old news articles
router.post("/cleanup", visaNewsController.cleanupOldNews);

// DELETE /api/visa-news/:id - Delete specific news article
router.delete("/:id", visaNewsController.deleteVisaNews);

module.exports = router;

