const ReferenceForm = require("../models/visaReferenceForm");
const helperFunctions = require("../utils/helperFunction");
const axios = require("axios");


const fetchToken = helperFunctions.fetchToken;

async function createCustomModule(token) {
  try {
    const response = await axios.post(
      `https://www.zohoapis.in/crm/v7/settings/modules`,
      {
        "modules": [
          {
            "plural_label": "Visa Reference Forms",
            "singular_label": "Visa Reference Form",
            "profiles": [
              {
                "id": "164193000015224001"
              }
            ],
            "api_name": "visa_reference_form",
            "display_field": {
              "field_label": "Visa Reference Form",
              "data_type": "autonumber",
              "auto_number": {
                "prefix": "ZOHOCRM",
                "start_number": "1005",
                "suffix": "BRANCH"
              }
            }
          }
        ]
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Custom Module Created!", response);
    return token;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const addCustomFields = async (token) => {
  try {
    const response = await axios.post(
      `https://www.zohoapis.in/crm/v7/settings/fields?module=visa_reference_form`,
      {
        "fields": [
          {
            "field_label": "Your Name",
            "data_type": "text",  // Specify the data type as text*
            "length": 150,
            "filterable": true,
            "tooltip": {
              "name": "static_text",
              "value": "Enter your name"
            },
            "external": {
              "type": "user",
              "show": false
            }
          }
        ]
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Custom Module Created!", response);
    return token;
  } catch (error) {
    console.log(error);
    throw error;
  }
}


const referenceForm = async (req, res) => {
  const data = req.body;
  const token = await fetchToken();

  ReferenceForm.create(req.body)
    .then(() => {
      console.log("Visa Reference Form Backup Created");
      addCustomFields(token);
      res.json({ message: "success" })
    })
    .catch((error) => {
      console.log("Error: Visa Reference Form", error);
      res.json({ message: "failed" })
    });
};

module.exports = { referenceForm }