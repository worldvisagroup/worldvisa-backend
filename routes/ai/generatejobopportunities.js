const express = require("express");
const jobOpportunitiesController = require("../../controllers/jobOpportunitiesController");
const { validateJobOpportunityRequest } = require("../../middleware/validation");

const router = express.Router();

// Main endpoint - generates content immediately
router.post("/", validateJobOpportunityRequest, jobOpportunitiesController.generateJobOpportunityContent);

// Health check endpoint
router.get("/health", jobOpportunitiesController.getHealthStatus);

// Cache management endpoint (for maintenance)
router.delete("/cache", jobOpportunitiesController.clearCache);

module.exports = router;
