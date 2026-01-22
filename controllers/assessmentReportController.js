const axios = require("axios");
const zoho = require("../controllers/Zoho");
const helperFunction = require("../utils/helperFunction");
const { capitalize } = require("lodash");
const leadsControllerNew = require("./leadControllerNew");
const helperFunctions = require("../utils/helperFunction");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

const fetchToken = helperFunctions.fetchToken;
const supabase = require("../controllers/Supabase");
const whatsapp = require("../controllers/Whatsapp");

const getConsoleParsedData = (sendWatiTemplate) => {
  const consoleData = {
    status: sendWatiTemplate.status,
    statusText: sendWatiTemplate.statusText,
    data: {
      result: sendWatiTemplate.data.result,
      phoneNumber: sendWatiTemplate.data.phone_number,
      templateName: sendWatiTemplate.data.template_name,
      validWhatsappNumber: sendWatiTemplate.data.validWhatsAppNumber
    },
    contact: {
      wAid: sendWatiTemplate.data.contact.wAid,
      firstName: sendWatiTemplate.data.contact.firstName,
      fullName: sendWatiTemplate.data.contact.fullName,
      contactStatus: sendWatiTemplate.data.contact.contactStatus,
    }
  };

  return consoleData;
}

const sendMessage = async (whatsappNumber, watiTemplate) => {
  try {
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

    const consoleData = getConsoleParsedData(sendWatiTemplate);
    console.log("sending whatsapp template", consoleData);
    if (consoleData.data.validWhatsappNumber) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log("error occured sending wati template", err);
    return false;
  }
};

const workDataParser = (selectedCountryCriteria, eligibilityData) => {
  const whatsappTemplate = {
    template_name: "work_assessment_report",
    broadcast_name: "work_assessment_report",
    parameters: [
      { name: "name", value: eligibilityData.fullName },
      {
        name: "eligible",
        value: selectedCountryCriteria.eligible ? "Eligible" : "Not Eligible",
      },
      { name: "country", value: capitalize(eligibilityData.country) },
      { name: "age", value: selectedCountryCriteria.age ? "✅" : "❌" },
      {
        name: "education",
        value: selectedCountryCriteria.education ? "✅" : "❌",
      },
      {
        name: "experience",
        value: selectedCountryCriteria.experience ? "✅" : "❌",
      },
      {
        name: "language",
        value: selectedCountryCriteria.language ? "✅" : "❌",
      },
    ],
  };

  return whatsappTemplate;
}

const sendAssessmentReport = async (req, res) => {
  if (!req.body) {
    res.json({ message: "Failed", error: "Invalid Request Data" });
    return;
  }

  if (!req.body.eligibilityData) {
    res.json({ message: "Failed", error: "Invalid Request Eligibility Data" })
    return;
  }

  if (!req.body.assessmentReports) {
    res.json({ message: "Failed", error: "Invalid Request Assessment Reports Data" })
    return;
  }

  const { eligibilityData, assessmentReports } = req.body;

  const selectedCountry =
    assessmentReports[eligibilityData.country] ?? assessmentReports[0];

  try {

    const selectedCountryCriteria = {
      eligible: selectedCountry.eligible,
      age: selectedCountry.data.age.eligible,
      education: selectedCountry.data.education.eligible,
      experience: selectedCountry.data.experience.eligible,
      language: selectedCountry.data.language.eligible,
    };

    // Work Data parser
    const whatsappTemplate = workDataParser(selectedCountryCriteria, eligibilityData);

    // send whatsapp template
    const whatsappMessageSent = await sendMessage(
      `${eligibilityData.countryCode}${eligibilityData.phoneNumber}`,
      whatsappTemplate
    );

    // parse user data
    const apiData = helperFunction.leadApiDataParser(eligibilityData);

    // Create lead on the crm
    const zohoLeadCreated = await zoho.createCrmLead(apiData);

    const leadCreationStatus = zohoLeadCreated ? "Created" : "Lead Already Exists";

    res.json({ message: "Success", whatsappMessageSent: whatsappMessageSent, leadCreated: leadCreationStatus });

  } catch (error) {
    console.log(error);
    res.json({ message: "Failed", details: error })
  }

};

const sendWatiMessageWithPdf = async (apiData) => {
  try {
    const pdfPath = path.join(__dirname, '../Images/subclass-462-eligible.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);

    const uploadedFileData = await supabase.uploadFile(
      apiData.data[0]["Email"],
      `Subclass_462_Assessment_Report_${Math.random()}`,
      pdfBuffer
    );

    const fileLink = await supabase.getPublicUrl(
      uploadedFileData.path
    );

    const filePublicUrl = fileLink.publicUrl;

    await whatsapp.SendWhatsappTemplate(
      filePublicUrl,
      apiData.data[0]["Last_Name"],
      `${apiData.data[0]["countryCode"]}${apiData.data[0]["Phone"]}`,
      apiData.data[0]["country_addressed"],
      "visa_page_assessment_report"
    );

    setTimeout(() => {
      console.log("deleted file after 9 seconds");
      supabase.deleteFile(uploadedFileData.path);
    }, 9000);
  } catch (err) {
    console.log("Unable to store the pdf", err);
  }
}

const sendAssessmentReportWithPdf = async (req, res) => {
  const { eligibilityData, assessmentReport } = req.body;


  const countryCriteria = {
    eligible: assessmentReport.eligible,
    age: assessmentReport.data.age.eligible,
    education: assessmentReport.data.education.eligible,
    workExperience: assessmentReport.data.experience.eligible,
    englishLanguageAbility: assessmentReport.data.language.eligible,
  };

  if (countryCriteria.eligible) {
    const apiToken = await fetchToken();
    // parse user data
    const apiData = helperFunction.leadApiDataParser(eligibilityData, true);
    const updateApiData = helperFunction.leadsUpdateeLeadsApiDataParser(eligibilityData);
    let existingLeadId = undefined;

    // Send wati message first
    await sendWatiMessageWithPdf(apiData);

    existingLeadId = await leadsControllerNew.searchLeads("Leads", `phone=${apiData.data[0]["Phone"]}`, apiToken);

    if (!existingLeadId) {
      existingLeadId = await leadsControllerNew.searchLeads("Contacts", `phone=${apiData.data[0]["Phone"]}`, apiToken);
    }


    if (!existingLeadId) {
      await zoho.createCrmLead(apiData);
    } else {
      await zoho.updateVisaLead(eligibilityData, existingLeadId, apiToken);
    }
  } else {
    console.log("Not Eligible")
  }

  res.json({ message: "Success", eligible: countryCriteria.eligible });

}

module.exports = {
  sendAssessmentReport,
  sendAssessmentReportWithPdf
};
