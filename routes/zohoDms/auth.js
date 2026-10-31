/**
 * DEPRECATED: Zoho OAuth redirection route is no longer needed.
 * Zoho CRM authentication now operates purely via Self-Client environment variables:
 * - CLIENT_ID
 * - CLIENT_SECRET
 * - REFRESH_TOKEN
 * - ZOHO_DC
 *
 * Centralized token manager is located in: controllers/zohoDms/zohoAuth.js
 */

const express = require("express");
const router = express.Router();

router.get("*", (req, res) => {
  res.status(200).json({
    status: "ok",
    message:
      "Zoho CRM authentication is configured via Self-Client environment variables (.env). Browser OAuth is disabled.",
  });
});

module.exports = router;
