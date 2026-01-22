const axios = require("axios");
require("dotenv").config();
const helperFunction = require("../utils/helperFunction");
const zoho = require("./Zoho");
const watiTemplates = helperFunction.allWatiTemplates;
const fetchToken = helperFunction.fetchToken;


const watiTemplate = {
  template_name: watiTemplates.agent_busy_after_office_hours,
  broadcast_name: watiTemplates.agent_busy_after_office_hours,
};

const sendMessage = async (whatsappNumber, watiTemplate, res) => {
  const sendWatiTemplate = await axios.post(
    `${process.env.WATI_URL}/api/v1/sendTemplateMessage?whatsappNumber=${whatsappNumber}`,
    JSON.stringify(watiTemplate),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.WATI_ACCESS_TOKEN,
      },
    }
  );

  console.log("sending whatsapp template", sendWatiTemplate);
  res.send({
    status: sendWatiTemplate.status,
    data: sendWatiTemplate.data,
  });
};

async function searchLeads(module, params, token) {
  console.log("Searching leads with", params);
  try {
    const response = await axios.get(
      `https://www.zohoapis.in/crm/v5/${module}/search?${params}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.data) {
      console.log("searched Lead", response.data.data);
      const id = response.data.data[0].id;
      console.log("find lead id", id);
      return id;
    }
  } catch (error) {
    console.log("error", error);
    return "";
  }
}

const sendWhatsappTemplate = async (req, res) => {
  let whatsappNumber = req.query.whatsappNumber;
  const { template_name, broadcast_name, parameters } = req.body;

  if (!whatsappNumber) {
    return res.status(400).json({
      status: "error",
      message: "Missing required field: whatsappNumber in query params",
    });
  }

  if (!req.body || !req.body.template_name || !Array.isArray(req.body.parameters)) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: template_name, or parameters in request body",
    });
  }
  let updatedParameters = [
    ...parameters,
    { name: "lead_owner", value: "World Visa" },
  ];

  watiTemplate["parameters"] = updatedParameters;
  watiTemplate["template_name"] = watiTemplates[template_name];
  watiTemplate["broadcast_name"] = broadcast_name || template_name;

  if (!watiTemplate["template_name"]) {
    return res.status(400).json({
      status: "error",
      message: "Invalid template_name provided or template_name does not exist"
    });
  }

  try {
    await sendMessage(whatsappNumber, watiTemplate, res);
  } catch (err) {
    console.log("whatsapp template error", err);
    return;
  }
};

module.exports = {
  sendWhatsappTemplate,
  sendMessage,
};
