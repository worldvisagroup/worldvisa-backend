const FormData = require("form-data");
const { Buffer } = require("buffer");
const canadaPositiveAssessment = require("../controllers/PositiveAssessment_Canada");
const canadaNegativeAssessment = require("../controllers/NegativeAssessment_Canada");
const australiaPositiveAssessment = require("../controllers/PositiveAssessment_Australia");
const australiaNegativeAssessment = require("../controllers/NegativeAssessment_Australia");
const germanyPostiveAssessment = require("../controllers/PositiveAssessment_Germany");
const germanyNegativeAssessment = require("../controllers/NegativeAssessment_Germany");
const axios = require("axios");
require("dotenv").config();
const supabase = require("../controllers/Supabase");
const whatsapp = require("../controllers/Whatsapp");
const helperFunctions = require("../utils/helperFunction");

const fetchToken = helperFunctions.fetchToken;

async function searchLeads(module, params, token) {
  console.log("Searching Leads", module, params);
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
      console.log("searched Lead", true);
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
    const queryParam = req.query.country;

    let leadId;
    let apiData = {};
    let apiUpdateData = {};
    let pdfBuffer = [];
    let pdfFunction;
    let emailAddress;

    if (queryParam == "Canada") {
      const { australiaReport, canadaReport, germanyReport, eligibilityData } = req.body;

      const { fullName, email, workOverseasExperience } = eligibilityData;

      const { totalPoints, points } = canadaReport;

      const {
        age: ageScore,
        education: educationScore,
        experience: employmentScore,
        language: languageAbilityScore,
      } = points;

      emailAddress = email;
      ageScore1 = ageScore;
      educationScore1 = educationScore;
      employmentScore1 = employmentScore;
      obroadExperienceScore = workOverseasExperience || 0;
      languageAbilityScore1 = languageAbilityScore;
      totalPoints1 = totalPoints;

      name = fullName.toUpperCase();

      apiData = helperFunctions.leadsApiDataParser(
        eligibilityData,
        australiaReport,
        canadaReport,
        germanyReport
      );

      apiUpdateData = helperFunctions.updateLeadsApiDataParser(
        eligibilityData,
        australiaReport,
        canadaReport,
        germanyReport
      );

      pdfFunction =
        totalPoints1 >= 67
          ? canadaPositiveAssessment.buildPDF
          : canadaNegativeAssessment.buildPDF;
    } else if (queryParam == "Australia") {
      try {
        const { australiaReport, canadaReport, germanyReport, eligibilityData } = req.body;

        const { fullName, email } = eligibilityData;

        const { totalPoints, points } = australiaReport;

        const {
          age: ageScore,
          education: educationScore,
          experience: employmentScore,
          language: languageAbilityScore,
          marital,
          overseasWorkExperience, //overseasWorkExperience
        } = points;

        phone = eligibilityData.phoneNumber;
        emailAddress, email;
        (ageScore1 = ageScore),
          (educationScore1 = educationScore),
          (employmentScore1 = employmentScore),
          (obroadExperienceScore = overseasWorkExperience || 0),
          (languageAbilityScore1 = languageAbilityScore),
          (totalPoints1 = totalPoints);
        adaptabilityFactorScore1 = marital;
        name = fullName.toUpperCase();

        apiData = helperFunctions.leadsApiDataParser(
          eligibilityData,
          australiaReport,
          canadaReport,
          germanyReport
        );

        apiUpdateData = helperFunctions.updateLeadsApiDataParser(
          eligibilityData,
          australiaReport,
          canadaReport,
          germanyReport
        );

        pdfFunction =
          totalPoints1 >= 50
            ? australiaPositiveAssessment.buildPDF
            : australiaNegativeAssessment.buildPDF;
        // australia done
      } catch (error) {
        throw new Error(`Error occured on australia assessment report ${error}`)
      }

    } else if (queryParam == "Germany") {
      const { australiaReport, canadaReport, germanyReport, eligibilityData } = req.body;

      const { fullName, email } = eligibilityData;

      const { totalPoints, points } = germanyReport;

      const {
        age: ageScore,
        education: educationScore,
        experience: employmentScore,
        language: languageAbilityScore,
        marital,
        overseasWorkExperience,
      } = points;

      phone = eligibilityData.phoneNumber;
      emailAddress, email;
      (ageScore1 = ageScore),
        (educationScore1 = educationScore),
        (employmentScore1 = employmentScore),
        (languageAbilityScore1 = languageAbilityScore),
        (totalPoints1 = totalPoints);
      (obroadExperienceScore = 0),
        adaptabilityFactorScore1 = 0;
      name = fullName.toUpperCase();

      apiData = helperFunctions.leadsApiDataParser(
        eligibilityData,
        australiaReport,
        canadaReport,
        germanyReport
      );

      apiUpdateData = helperFunctions.updateLeadsApiDataParser(
        eligibilityData,
        australiaReport,
        canadaReport,
        germanyReport
      );

      pdfFunction =
        totalPoints1 >= 60
          ? germanyPostiveAssessment.buildPDF
          : germanyNegativeAssessment.buildPDF;
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
            formData.append(
              "file",
              pdfBuffer,
              `Assessment-report-${apiData.data[0]["country_addressed"]}.pdf`
            );

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
                  `Assessment_Report_${apiData.data[0]["country_addressed"]}-${attachmentId}`,
                  pdfBuffer
                );

                const fileLink = await supabase.getPublicUrl(
                  uploadedFileData.path
                );

                const filePublicUrl = fileLink.publicUrl;

                await whatsapp.SendWhatsappTemplate(
                  filePublicUrl,
                  apiData.data[0]["Last_Name"],
                  `${apiData.data[0]["countryCode"] ? apiData.data[0]["countryCode"] : 91}${apiData.data[0]["Phone"]}`,
                  apiData.data[0]["country_addressed"]
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
          console.log("error details", error.response.data.data);
          console.log(
            "error extra details",
            error.response.data.data[0].details
          );
          console.log("lead got 400 error, searching if exist...");
          let leadId = "";
          leadId = await searchLeads(
            "Leads",
            `phone=${apiData.data[0]["Phone"]}`,
            token
          );

          if (!leadId) {
            leadId = await searchLeads(
              "Leads",
              `phone=${apiData.data[0]["Phone"]}`,
              token
            );
          }

          if (!leadId) {
            leadId = await searchLeads(
              "Leads",
              `email=${apiData.data[0]["Email"]}`,
              token
            );
          }

          if (leadId) {
            try {
              console.log("apiData", apiUpdateData);
              apiUpdateData.data[0].id = leadId;

              console.log("Api data for updating the lead", apiUpdateData);

              const response = await axios.put(
                "https://www.zohoapis.in/crm/v5/Leads",
                JSON.stringify(apiUpdateData),
                {
                  headers: {
                    Authorization: `Zoho-oauthtoken ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              console.log("updated the lead", response.status);
              console.log("Uploading attachment and Sending wati template");
              if (response.status === 200) {
                leadId = response.data.data[0].details.id;
                console.log("updated lead id", leadId);

                const formData = new FormData();
                formData.append(
                  "file",
                  pdfBuffer,
                  `Assessment Report ${apiData.data[0]["country_addressed"]}.pdf`
                );

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
                      `Assessment_Report_${apiData.data[0]["country_addressed"]}_${attachmentId}`,
                      pdfBuffer
                    );

                    const fileLink = await supabase.getPublicUrl(
                      uploadedFileData.path
                    );

                    const filePublicUrl = fileLink.publicUrl;

                    await whatsapp.SendWhatsappTemplate(
                      filePublicUrl,
                      apiData.data[0]["Last_Name"],
                      `${apiData.data[0]["countryCode"] ? apiData.data[0]["countryCode"] : 91}${apiData.data[0]["Phone"]}`,
                      apiData.data[0]["country_addressed"]
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
            } catch (err) {
              console.log("Error occured updating the lead", err);
              console.log("Error details", err?.response?.data?.data);
              console.log("Sending wati template");
              try {
                const uploadedFileData = await supabase.uploadFile(
                  apiData.data[0]["Email"],
                  `Assessment_Report_${apiData.data[0]["country_addressed"]}`,
                  pdfBuffer
                );

                const fileLink = await supabase.getPublicUrl(
                  uploadedFileData.path
                );

                const filePublicUrl = fileLink.publicUrl;

                await whatsapp.SendWhatsappTemplate(
                  filePublicUrl,
                  apiData.data[0]["Last_Name"],
                  `${apiData.data[0]["countryCode"] ? apiData.data[0]["countryCode"] : 91}${apiData.data[0]["Phone"]}`,
                  apiData.data[0]["country_addressed"]
                );

                setTimeout(() => {
                  console.log("deleted file after 9 seconds");
                  supabase.deleteFile(uploadedFileData.path);
                }, 9000);
              } catch (err) {
                console.log("Unable to store the pdf", err);
              }
            }
          } else {
            console.log("Error Lead Not found");
            let leadId = "";

            leadId = await searchLeads(
              "Contacts",
              `phone=${apiData.data[0]["Phone"]}`,
              token
            );

            if (!leadId) {
              leadId = await searchLeads(
                "Contacts",
                `phone=${apiData.data[0]["Phone"]}`,
                token
              );
            }

            if (!leadId) {
              leadId = await searchLeads(
                "Contacts",
                `email=${apiData.data[0]["Email"]}`,
                token
              );
            }

            if (leadId) {
              console.log("Got contact lead id", leadId);

              try {
                console.log("Got Record in contacts");
                console.log("Record Id", leadId);
                apiUpdateData.data[0].id = leadId;

                const response = await axios.put(
                  "https://www.zohoapis.in/crm/v5/Contacts",
                  JSON.stringify(apiUpdateData),
                  {
                    headers: {
                      Authorization: `Zoho-oauthtoken ${token}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                console.log("updated the record on contacts", response.status);
                console.log("Uploading attachment and Sending wati template");

                if (response.status === 200) {
                  leadId = response.data.data[0].details.id;
                  console.log("updated contact lead id", leadId);

                  const formData = new FormData();
                  formData.append(
                    "file",
                    pdfBuffer,
                    `Assessment Report ${apiData.data[0]["country_addressed"]
                    } ${Date.now()}.pdf`
                  );

                  if (leadId) {
                    const updateLead = await axios.post(
                      `https://www.zohoapis.in/crm/v5/Contacts/${leadId}/Attachments`,
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
                        `Assessment_Report_${apiData.data[0]["country_addressed"]}`,
                        pdfBuffer
                      );

                      const fileLink = await supabase.getPublicUrl(
                        uploadedFileData.path
                      );

                      const filePublicUrl = fileLink.publicUrl;

                      await whatsapp.SendWhatsappTemplate(
                        filePublicUrl,
                        apiData.data[0]["Last_Name"],
                        `${apiData.data[0]["countryCode"] ? apiData.data[0]["countryCode"] : 91}${apiData.data[0]["Phone"]}`,
                        apiData.data[0]["country_addressed"]
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
                console.log("error Occured updating the contacts", error);
                console.log(
                  "error Occured updating the contacts data:",
                  error.response.data.data[0].details
                );
                return "";
              }
            } else {
              console.log("Record not found in contacts also");
            }
          }
        }
      }
    );
  } catch (error) {
    console.error("Getting Errors", error);

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

module.exports = {
  createLeads,
  searchLeads
};
