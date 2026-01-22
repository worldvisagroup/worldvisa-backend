import axios from "axios";
import dotenv from "dotenv";
import ZohoToken from "../../models/zohoToken.js";

dotenv.config();

// Function to save tokens to the database
async function saveTokensToDB(tokens) {
  try {
    await ZohoToken.findOneAndUpdate(
      { name: 'zoho_token' },
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Error saving tokens to DB:", error);
  }
}

// Function to get tokens from the database
async function getTokensFromDB() {
  try {
    const tokenDoc = await ZohoToken.findOne({ name: 'zoho_token' });
    return tokenDoc || {};
  } catch (error) {
    console.error("Error reading tokens from DB:", error);
    return {};
  }
}

export async function exchangeCodeForTokens(code) {
  const response = await axios.post(
    `https://accounts.zoho.${process.env.ZOHO_DC}/oauth/v2/token`,
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.ZOHO_DMS_CLIENT_ID,
      client_secret: process.env.ZOHO_DMS_CLIENT_SECRET,
      redirect_uri: process.env.ZOHO_DMS_REDIRECT_URI,
      code,
    })
  );
  const tokens = {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  };
  await saveTokensToDB(tokens);
  return response.data;
}

export async function refreshAccessToken() {
  const { refreshToken } = await getTokensFromDB();
  if (!refreshToken) throw new Error("No refresh token stored yet");

  const response = await axios.post(
    `https://accounts.zoho.${process.env.ZOHO_DC}/oauth/v2/token`,
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ZOHO_DMS_CLIENT_ID,
      client_secret: process.env.ZOHO_DMS_CLIENT_SECRET,
      refresh_token: refreshToken,
    })
  );
  const tokens = {
    accessToken: response.data.access_token,
    refreshToken: refreshToken, // Keep the same refresh token
  };
  await saveTokensToDB(tokens);
  return tokens.accessToken;
}

export async function getAccessToken() {
  const { accessToken } = await getTokensFromDB();
  return accessToken;
}

// This function is now redundant as exchangeCodeForTokens handles saving.
export async function storeTokens(tokens) {
  const existingTokens = await getTokensFromDB();
  const newTokens = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || existingTokens.refreshToken,
  };
  await saveTokensToDB(newTokens);
}