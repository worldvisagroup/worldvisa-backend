const express = require("express");
const { getTravelBudget } = require("../../controllers/travelBudget");
const STATIC_API_TOKEN = 'world-visa-technical-seo-assessment-api-123'; // Set your static token value here

const router = express.Router();
// Middleware for checking API token from req.headers
function apiTokenAuth(req, res, next) {
  const token = req.headers['x-api-token'];
  if (!token || token !== STATIC_API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API token' });
  }
  next();
}


router.post('/', apiTokenAuth, getTravelBudget)




module.exports = router;