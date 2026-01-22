const FormData = require("form-data");
const { Buffer } = require("buffer");
const canadaPositiveAssessment = require("../controllers/PositiveAssessment_Canada");
const canadaNegativeAssessment = require("../controllers/NegativeAssessment_Canada");
const australiaPositiveAssessment = require("../controllers/PositiveAssessment_Australia");
const australiaNegativeAssessment = require("../controllers/NegativeAssessment_Australia");
const axios = require("axios");
require("dotenv").config();
const supabase = require("../controllers/Supabase");
const whatsapp = require("../controllers/Whatsapp");
const helperFunctions = require("../utils/helperFunction");

const fetchToken = helperFunctions.fetchToken;

async function searchLeads(email) {
  try {
    const token = await fetchToken();

    const response = await axios.get(
      `https://www.zohoapis.in/crm/v5/Leads/search?email=${email}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.data) {
      const id = response.data.data[0].id;
      console.log("find lead id", id);
      return id;
    }
  } catch (error) {
    console.log("error", error);
    return "";
  }
}

const createLeads = async (req, res) => {
  let ageScore1 = 0,
    educationScore1 = 0,
    employmentScore1 = 0,
    obroadExperienceScore = 0,
    languageAbilityScore1 = 0,
    arrangedEmploymentScore1 = 0,
    adaptabilityFactorScore1 = 0,
    totalPoints1 = 0,
    name = "";

  try {
    const token = await fetchToken();
    let leadId;
    const queryParam = req.query.country;

    let apiData = {};
    let pdfBuffer = [];
    let pdfFunction;
    let emailAddress;

    if (queryParam == "Canada") {
      const {
        fullName,
        email,
        phoneNumber,
        age,
        totalWorkExperience,
        spouseNotAccompanying,
        canadianWorkExperience,
        canadianWorkExperienceSpouse,
        arrangedEmploymentInCanada,
        spouseLanguage,
        applicantLanguage,
        highestEducationQualification,
        maritalStatus,
        ageScore,
        educationScore,
        employmentScore,
        languageAbilityScore,
        arrangedEmploymentScore,
        adaptibilityFactorsScore,
        totalPoints,
        partnerQualification,
        gclid,
      } = req.body;
      emailAddress = email;
      ageScore1 = ageScore;
      educationScore1 = educationScore;
      employmentScore1 = employmentScore;
      obroadExperienceScore = canadianWorkExperience;
      languageAbilityScore1 = languageAbilityScore;
      arrangedEmploymentScore1 = arrangedEmploymentScore;
      adaptabilityFactorScore1 = adaptibilityFactorsScore;
      totalPoints1 = totalPoints;
      name = fullName.toUpperCase();

      apiData = helperFunctions.canadaLeadsApiData(
        name,
        email,
        phoneNumber,
        age,
        totalWorkExperience,
        spouseNotAccompanying,
        canadianWorkExperience,
        canadianWorkExperienceSpouse,
        arrangedEmploymentInCanada,
        spouseLanguage,
        applicantLanguage,
        highestEducationQualification,
        maritalStatus,
        gclid,
        partnerQualification
      );

      pdfFunction =
        totalPoints1 >= 67
          ? canadaPositiveAssessment.buildPDF
          : canadaNegativeAssessment.buildPDF;
      // canada done
      // ...
      // ...
    } else if (queryParam == "Australia") {
      const {
        fullName,
        email,
        phoneNumber,
        age,
        highestEducationQualification,
        australianWorkExperience,
        totalWorkExperience,
        applicantLanguage,
        maritalStatus,
        partnerCriteria,
        ageScore,
        education,
        employment,
        australianEmployment,
        languageAbility,
        communityLanguage,
        partnerSkills,
        partnerQualification,
        totalPoints,
        gclid,
      } = req.body;
      emailAddress = email;
      (ageScore1 = ageScore),
        (educationScore1 = education),
        (employmentScore1 = employment),
        (obroadExperienceScore = australianEmployment),
        (languageAbilityScore1 = languageAbility),
        (communityLanguageScore1 = communityLanguage),
        (partnerSkillsScore1 = partnerSkills),
        (totalPoints1 = totalPoints);
      adaptabilityFactorScore1 = partnerSkills;
      name = fullName.toUpperCase();

      apiData = helperFunctions.australiaLeadsApiData(
        name,
        email,
        phoneNumber,
        age,
        totalWorkExperience,
        australianWorkExperience,
        applicantLanguage,
        highestEducationQualification,
        maritalStatus,
        partnerCriteria,
        gclid,
        partnerQualification
      );

      pdfFunction =
        totalPoints1 >= 65
          ? australiaPositiveAssessment.buildPDF
          : australiaNegativeAssessment.buildPDF;
      // australia done
      // ...
      // ...
    } else {
      res
        .status(401)
        .json({ success: false, message: "Country not supported." });
      return;
    }

    let dataCallBack = (chunk) => pdfBuffer.push(chunk);

    // Generate the PDF and store it in memory
    pdfFunction(
      ageScore1,
      educationScore1,
      employmentScore1,
      obroadExperienceScore,
      languageAbilityScore1,
      arrangedEmploymentScore1,
      adaptabilityFactorScore1,
      totalPoints1,
      name,
      dataCallBack,
      async () => {
        pdfBuffer = Buffer.concat(pdfBuffer);

        // Send the PDF as a response to the HTTP request
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment;filename=Assessment.pdf",
        });
        res.write(pdfBuffer);
        res.end();

        // After sending the response, make a separate request to the Zoho /leads API
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

          if (response.status === 201) {
            leadId = response.data.data[0].details.id;

            const formData = new FormData();
            formData.append("file", pdfBuffer, "Assessment.pdf");

            if (leadId) {
              const updateLead = await axios.post(
                `https://www.zohoapis.in/crm/v5/Leads/${leadId}/Attachments`,
                formData,
                {
                  headers: {
                    ...formData.getHeaders(), // This will set the "Content-Type" header
                    Authorization: `Zoho-oauthtoken ${token}`,
                  },
                }
              );
              const attachmentId = updateLead.data.data[0].details.id;

              try {
                const uploadedFileData = await supabase.uploadFile(
                  apiData.data[0]["Email"],
                  attachmentId,
                  pdfBuffer
                );

                const fileLink = await supabase.getPublicUrl(
                  uploadedFileData.path
                );

                const filePublicUrl = fileLink.publicUrl;

                await whatsapp.SendWhatsappTemplate(
                  filePublicUrl,
                  apiData.data[0]["Last_Name"],
                  apiData.data[0]["Phone"],
                  apiData.data[0]["Country_Finalised"]
                );

                setTimeout(() => {
                  console.log("deleted file after 9 seconds");
                  supabase.deleteFile(uploadedFileData.path);
                }, 9000);
              } catch (err) {
                console.log("Unable to store the pdf", err);
              }
            }
          }
        } catch (error) {
          console.log("zoho form error", error);
          console.log("lead got 400 error, searching if exist...");
          const leadId = await searchLeads(emailAddress);

          try {
            apiData.data[0].id = leadId;
            const response = await axios.put(
              "https://www.zohoapis.in/crm/v5/Leads",
              JSON.stringify(apiData),
              {
                headers: {
                  Authorization: `Zoho-oauthtoken ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            console.log("updated the lead");
          } catch (err) {
            console.log("Error occured updating the lead", err);
          }
        }
      }
    );
  } catch (error) {
    console.error("Getting Errors", error.data);

    if (
      error.response &&
      error.response.data &&
      Array.isArray(error.response.data.data)
    ) {
      const errorDetails = error.response.data.data[0];
      res.json({
        success: false,
        message: "Failed to add lead.",
        error: errorDetails,
      });
    } else {
      res.json({
        success: false,
        message: "Failed to add lead. From Direct try/catch",
      });
    }
  }
};

const getLeadById = async (req, res) => {
  try {
    const token = await fetchToken();
    const leadId = req.params.id;

    const response = await axios.get(
      `https://www.zohoapis.in/crm/v5/Leads/${leadId}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.data) {
      res.json({ success: true, data: response.data.data[0] });
    } else {
      res.status(404).json({ success: false, message: "Lead not found" });
    }
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ success: false, message: "Failed to fetch lead" });
  }
};

module.exports = {
  createLeads,
  getLeadById,
};
