/**
 * Smoke test for the Zoho PhoneBridge "list users" API, to confirm the
 * PhoneBridge.call.log scope (added to routes/zohoDms/auth.js) was actually
 * granted and the stored token can reach PhoneBridge endpoints.
 *
 * Usage: node scripts/testZohoPhoneBridgeUsers.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const { getAccessToken, refreshAccessToken } = require('../controllers/zohoDms/zohoAuth');

const PHONEBRIDGE_URL = `https://www.zohoapis.${process.env.ZOHO_DC}/phonebridge/v3/users?page=1&perPage=200`;

async function fetchPhoneBridgeUsers(token) {
  return axios.get(PHONEBRIDGE_URL, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  console.log('Connected to MongoDB');

  let token = await getAccessToken();
  if (!token) throw new Error('No access token available — run the OAuth flow first');

  console.log(`GET ${PHONEBRIDGE_URL}`);

  try {
    let response;
    try {
      response = await fetchPhoneBridgeUsers(token);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('Access token expired, refreshing...');
        token = await refreshAccessToken();
        response = await fetchPhoneBridgeUsers(token);
      } else {
        throw err;
      }
    }

    console.log(`\n✅ Success — HTTP ${response.status}`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error(`\n❌ Failed — HTTP ${err.response?.status}`);
    console.error(JSON.stringify(err.response?.data ?? err.message, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
