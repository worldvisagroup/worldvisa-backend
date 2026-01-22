const express = require("express");
const { exchangeCodeForTokens } = require("../../controllers/zohoDms/zohoAuth.js");


const router = express.Router();

router.get("/", (req, res) => {
  const ZOHO_DMS_CLIENT_ID = process.env.ZOHO_DMS_CLIENT_ID;
  const ZOHO_DMS_REDIRECT_URI = process.env.ZOHO_DMS_REDIRECT_URI;

  const scope = "ZohoCRM.modules.all,ZohoCRM.coql.READ,WorkDrive.files.CREATE,WorkDrive.files.READ,WorkDrive.files.UPDATE,WorkDrive.files.DELETE,WorkDrive.files.ALL,ZohoFiles.files.ALL";

  const authUrl = `https://accounts.zoho.${process.env.ZOHO_DC}/oauth/v2/auth?response_type=code&client_id=${ZOHO_DMS_CLIENT_ID}&scope=${scope}&redirect_uri=${ZOHO_DMS_REDIRECT_URI}&access_type=offline`;

  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    await exchangeCodeForTokens(code);
    res.send("✅ Zoho OAuth setup successful. Tokens stored.");
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    res.status(500).send("❌ Failed to exchange code for tokens.");
  }
});

module.exports = router;
