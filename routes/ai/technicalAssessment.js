const express = require("express");
const { technicalAssessmentHandler, technicalAssessmentHandlerNew, technicalAssessmentWithSeedHandler } = require("../../controllers/technicalAssessmentController");

const router = express.Router();

const STATIC_API_TOKEN = 'world-visa-technical-seo-assessment-api-123'; // Set your static token value here

// Middleware for checking API token from req.headers
function apiTokenAuth(req, res, next) {
  const token = req.headers['x-api-token'];
  if (!token || token !== STATIC_API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API token' });
  }
  next();
}

router.post("/", apiTokenAuth, technicalAssessmentHandler);

// this is what we are using now
router.post("/new", apiTokenAuth, technicalAssessmentHandlerNew);

router.post("/json", apiTokenAuth, technicalAssessmentWithSeedHandler);

module.exports = router;
