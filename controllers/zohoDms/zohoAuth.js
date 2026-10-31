const axios = require("axios");
const dotenv = require("dotenv");
const logger = require("../../utils/logger");
const ZohoToken = require("../../models/zohoToken");

dotenv.config();

/**
 * Refresh Zoho OAuth access token using Self-Client credentials from .env
 * and persist the new access token and expiration directly into MongoDB.
 */
async function refreshAccessToken() {
  try {
    const refreshToken = process.env.REFRESH_TOKEN;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const dc = process.env.ZOHO_DC || "in";

    if (!refreshToken || !clientId || !clientSecret) {
      throw new Error(
        `[Zoho Auth] Missing credentials in ENV: REFRESH_TOKEN=${Boolean(refreshToken)}, CLIENT_ID=${Boolean(clientId)}, CLIENT_SECRET=${Boolean(clientSecret)}`
      );
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    logger.info(
      "[Zoho Auth] Requesting fresh access token from Zoho Accounts (Self-Client)",
      {
        dc,
        clientIdPrefix: clientId
          ? clientId.substring(0, 8) + "..."
          : "missing",
      }
    );

    const response = await axios.post(
      `https://accounts.zoho.${dc}/oauth/v2/token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      }
    );

    if (!response.data || !response.data.access_token) {
      const errorDesc =
        response.data?.error_description ||
        response.data?.error ||
        JSON.stringify(response.data);
      throw new Error(
        `[Zoho Auth] Failed to obtain access token: ${errorDesc}`
      );
    }

    const expiresInSeconds = response.data.expires_in || 3600;
    // Expiration buffer: refresh 5 minutes before actual expiration (minimum 60s)
    const expiresAt = new Date(Date.now() + Math.max(expiresInSeconds - 300, 60) * 1000);

    // Save/update token directly into MongoDB
    const updatedDoc = await ZohoToken.findOneAndUpdate(
      { name: "zoho_token" },
      {
        accessToken: response.data.access_token,
        refreshToken: refreshToken,
        expiresAt,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info(
      "[Zoho Auth] Fresh access token saved to MongoDB successfully",
      {
        expiresInSeconds,
        expiresAt: expiresAt.toISOString(),
      }
    );

    return updatedDoc.accessToken;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    logger.error("[Zoho Auth] Error refreshing Zoho access token", {
      status: err.response?.status,
      details: errorData,
    });
    throw err;
  }
}

/**
 * Get active access token directly from MongoDB database on every request.
 * 1. Checks MongoDB for existing token.
 * 2. If present and not expired, returns accessToken directly from DB.
 * 3. If missing or expired, requests fresh token from Zoho, saves to DB, and returns it.
 */
async function getAccessToken() {
  try {
    const tokenDoc = await ZohoToken.findOne({ name: "zoho_token" });

    // Check if token in DB exists and is still valid (with 60-second buffer)
    const isValid =
      tokenDoc?.accessToken &&
      tokenDoc?.expiresAt &&
      new Date(tokenDoc.expiresAt).getTime() > Date.now() + 60000;

    if (isValid) {
      return tokenDoc.accessToken;
    }
  } catch (err) {
    logger.warn("[Zoho Auth] Failed to read token from DB, initiating refresh", {
      error: err.message,
    });
  }

  // Token is expired, missing, or DB had read error -> generate fresh one, save to DB, and return
  return await refreshAccessToken();
}

module.exports = {
  refreshAccessToken,
  getAccessToken,
};
