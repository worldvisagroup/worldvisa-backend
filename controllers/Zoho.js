const axios = require("axios");
require("dotenv").config();
const helperFunctions = require("../utils/helperFunction");

const fetchToken = helperFunctions.fetchToken;
const searchLeads = helperFunctions.searchLeadsNew;

const createCrmLead = async (apiData) => {
  try {
    const token = await fetchToken();

    const leadId = await searchLeads("Leads",
      `phone=${apiData.data[0]["Phone"]}`,
      token)


    if (leadId) {
      try {
        await axios.post(
          "https://www.zohoapis.in/crm/v5/Leads",
          JSON.stringify(apiData),
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        return true;
      } catch (err) {
        return false;
      }
    }

  } catch (err) {
    return false;
  }
};

const createLead = async (phone, token) => {
  const apiData = {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_LAYOUT_ID,
        },
        Lead_Source: "WhatsApp - World Visa",
        Lead_Status: "New Lead",
        Last_Name: phone.toString(),
        Phone: phone.toString(),
        Mobile: phone.toString(),
        Email: `${phone.toString()}@outofoffice.com`,
      },
    ],
  };

  try {
    const response = await axios.post(
      "https://www.zohoapis.in/crm/v5/Leads",
      JSON.stringify(apiData),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Zoho Lead is created");
    return true;
  } catch (err) {
    console.log("Error occured creating a lead", err?.response?.data?.data, err?.response?.data?.data[0], err?.response?.data?.data[0].details);
    return false;
  }
};

const updateLead = async (id, token) => {
  const apiData = {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_LAYOUT_ID,
        },
        Lead_Source: "WhatsApp - World Visa",
        Lead_Created_Time: new Date().toISOString(),
      },
    ],
  };

  try {
    try {
      const response = await axios.put(
        `https://www.zohoapis.in/crm/v5/Leads/${id}`,
        JSON.stringify(apiData),
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return true;
    } catch (err) {
      console.log("Error occured creating a lead");
      console.log(err, err.response.data.data[0]);
      return true;
    }
  } catch (err) {
    console.log("Error occured fetching token", err);
  }
};

const updateVisaContacts = async (eligibilityData, id, token) => {
  const apiData = helperFunctions.leadsUpdateeLeadsApiDataParser(eligibilityData, true);
  try {
    try {
      console.log("Updating lead on contacts module")
      const response = await axios.put(
        `https://www.zohoapis.in/crm/v5/Contacts/${id}`,
        JSON.stringify(apiData),
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return true;
    } catch (err) {
      console.log("Error occured creating a lead");
      console.log(err, err.response.data.data[0]);
      return true;
    }
  } catch (err) {
    console.log("Error occured fetching token", err);
  }
};

const updateVisaLead = async (eligibilityData, id, token) => {
  const apiData = helperFunctions.leadsUpdateeLeadsApiDataParser(eligibilityData);
  try {
    try {
      const response = await axios.put(
        `https://www.zohoapis.in/crm/v5/Leads/${id}`,
        JSON.stringify(apiData),
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return true;
    } catch (err) {
      console.log("Error occured creating a lead");
      await updateVisaContacts(eligibilityData, id, token);
      return true;
    }
  } catch (err) {
    console.log("Error occured fetching token", err);
  }
};

module.exports = {
  createLead,
  updateLead,
  createCrmLead,
  updateVisaLead,
  updateVisaContacts
};
