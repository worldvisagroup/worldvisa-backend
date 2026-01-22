const axios = require("axios");
require("dotenv").config();

const SendWhatsappTemplate = async (
  public_url,
  name,
  number = "918497048572",
  country,
  template_name = "assessment_report_v3"
) => {
  const watiTemplate = {
    template_name: template_name,
    broadcast_name: template_name,
    parameters: [
      {
        name: "name",
        value: name,
      },
      {
        name: "pdf_file",
        value: public_url,
      },
      {
        name: "country",
        value: country,
      },
    ],
  };

  try {
    const sendWatiTemplate = await axios.post(
      `${process.env.WATI_URL}/api/v1/sendTemplateMessage?whatsappNumber=${number}`,
      JSON.stringify(watiTemplate),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.WATI_ACCESS_TOKEN,
        },
      }
    );
    console.log("sent whatsapp template", sendWatiTemplate);
    return sendWatiTemplate;
  } catch (err) {
    console.log("whatsapp template error", err);
  }
};

module.exports = { SendWhatsappTemplate };
