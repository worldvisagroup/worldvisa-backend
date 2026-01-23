const axios = require("axios");
const { getAccessToken, refreshAccessToken } = require("./zohoAuth");

async function zohoRequest(endpoint, method = "GET", data = null) {
  let token = await getAccessToken();
  if (!token) throw new Error("No access token available");

  try {
    const response = await axios({
      method,
      url: `https://www.zohoapis.in/crm/v5/${endpoint}`,
      headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
      data,
    });
    return response.data;
  } catch (err) {
    if (err.response && err.response.status == 401) {
      // Token expired → refresh and retry
      token = await refreshAccessToken();
      const retry = await axios({
        method,
        url: `https://www.zohoapis.in/crm/v5/${endpoint}`,
        headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
        data,
      });
      return retry.data;
    }
    throw err;
  }
}

module.exports = {
  zohoRequest,
};

