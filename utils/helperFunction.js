const axios = require("axios");
const express = require("express");
const app = express();
const fs = require("fs");
const { capitalize } = require("lodash");
require("dotenv").config();

const API_KEY = process.env.API_KEY;
const API_KEY_MCUBE = process.env.API_KEY_MCUBE;

async function fetchInitialAccessToken() {
  const formData = new URLSearchParams();
  formData.append("grant_type", "authorization_code");
  formData.append("client_id", process.env.CLIENT_ID);
  formData.append("client_secret", process.env.CLIENT_SECRET);
  formData.append("code", process.env.REFRESH_TOKEN);

  try {
    const response = await axios.post(
      "https://accounts.zoho.in/oauth/v2/token",
      formData
    );
    const token = response.data.access_token;
    console.log("Got API Response", response.data);
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
    throw error;
  }
}

async function fetchToken() {
  try {
    const response = await axios.post(
      `https://accounts.zoho.in/oauth/v2/token?refresh_token=${process.env.REFRESH_TOKEN}&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&grant_type=refresh_token`
    );
    const token = response.data.access_token;
    console.log("Token generated!");
    return token;
  } catch (error) {
    console.log(error);
    const errorMessage = zohoErrorHandler(error);
    throw errorMessage;
  }
}

const leadsApiDataParser = (eligibilityData, australiaData, canadaReport, germanyPoints) => {
  const { totalPoints: total_points_australia, points: australiaPoints } =
    australiaData;

  const {
    age: age_points_australia,
    education: education_points_australia,
    experience: work_experience_points_australia,
    language: english_language_ability_points_australia,
    marital: marital_status_points_australia,
    overseasWorkExperience: onshore_work_experience_points_australia,
    spouseEducation: spouse_education_points_australia,
    spouseWorkExperience: spouse_work_experience_points_australia,
    spouseEnglishLanguageAbility:
    spouse_english_language_ability_points_australia,
  } = australiaPoints;

  const { totalPoints: total_points_canada, points: canadaPoints } =
    canadaReport;

  const {
    age: age_points_canada,
    education: education_points_canada,
    experience: work_experience_points_canada,
    language: english_language_ability_points_canada,
    marital: marital_status_points_canada,
    overseaseWorkExperience: onshore_work_experience_points_canada,
    spouseEducation: spouse_education_points_canada,
    spouseWorkExperience: spouse_work_experience_points_canada,
    spouseEnglishLanguageAbility: spouse_english_language_ability_points_canada,
  } = canadaPoints;

  const {
    age: age_points_germany,
    education: education_points_germany,
    experience: work_experience_points_germany,
    language: english_language_ability_points_germany,
  } = germanyPoints;

  const {
    fullName,
    email,
    phoneNumber,
    countryCode,
    country,
    service,
    age,
    education,
    workExperience,
    workOverseasExperience,
    englishLanguageAbility,
    maritalStatus,
    spouseEducation,
    spouseWorkExperience,
    spouseEnglishLanguageAbility,
    ip
  } = eligibilityData;

  return {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_CRM_NEW_LAYOUT_ID,
        },
        Lead_Source: `${capitalize(country)} Assessment Report`,
        Secondary_Source: `${capitalize(country)} Assessment Report`,
        Last_Name: fullName,
        Email: email.toLowerCase(),
        Phone: phoneNumber, // String
        Country_Code: countryCode,
        country_addressed: capitalize(country), // Pick List
        service_required: ["PR"], // Multiselect
        age, // Number
        education, // Pick List
        work_experience: workExperience, // Number
        work_overseas_experience: workOverseasExperience, //Number
        english_language_ability: englishLanguageAbility, // Pick List
        marital_status: maritalStatus, // Pick List,
        spouse_education: spouseEducation, // Pick List
        spouse_work_experience: spouseWorkExperience, // Number
        spouse_english_language_ability: spouseEnglishLanguageAbility, // Pick List
        // australia points
        age_points_australia, // Number
        work_experience_points_australia, // Number
        onshore_work_experience_points_australia, // Number
        education_points_australia, // Number
        english_language_ability_points_australia, // Number
        marital_status_points_australia, // Number
        spouse_education_points_australia, // Number
        spouse_work_experience_points_australia, // Number
        spouse_english_language_ability_points_australia, // Number
        total_points_australia, // Number
        // canada points
        age_points_canada, // Number
        work_experience_points_canada, // Number
        onshore_work_experience_points_canada, // Number
        english_language_ability_points_canada, // Number
        education_points_canada, // Number
        marital_status_points_canada, // Number
        spouse_education_points_canada, // Number
        spouse_work_experience_points_canada, // Number
        spouse_english_language_ability_points_canada, // Number
        total_points_canada, // Number
        // germany points
        age_points_germany: parseFloat(`${age_points_germany}.0`),
        work_experience_points_germany: parseFloat(`${work_experience_points_germany}.0`),
        education_points_germany: parseFloat(`${education_points_germany}.0`), // Number
        english_language_ability_points_germany: parseFloat(`${english_language_ability_points_germany}.0`), // Number
        // ip information
        Country: ip?.country, // String
        City: ip?.city, // String
        IP_Address: ip?.ipAddress // String
      },
    ],
  };
};

const leadApiDataParser = (eligibilityData, showCampaignName = false) => {
  const {
    fullName,
    email,
    phoneNumber,
    countryCode,
    country,
    service,
    age,
    education,
    workExperience,
    workOverseasExperience,
    englishLanguageAbility,
    maritalStatus,
    spouseEducation,
    spouseWorkExperience,
    spouseEnglishLanguageAbility,
  } = eligibilityData;

  const serviceRequires = {
    immigration: "PR",
    work: "Work Permit",
    study: "Student/Exchange Visa",
    travel: "Visit Visa",
  };

  return {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_CRM_NEW_LAYOUT_ID,
        },
        Lead_Source: `${capitalize(country)} Assessment Report`,
        Secondary_Source: `${capitalize(country)} Assessment Report`,
        Last_Name: fullName,
        Email: email.toLowerCase(),
        Phone: phoneNumber.replace("+", ""), // String
        Country_Code: countryCode,
        country_addressed: capitalize(country), // Pick List
        service_required: [serviceRequires[service]], // Multiselect
        age, // Number
        education, // Pick List
        work_experience: workExperience, // Number
        work_overseas_experience: workOverseasExperience, //Number
        english_language_ability: englishLanguageAbility, // Pick List
        marital_status: maritalStatus, // Pick List,
        spouse_education: spouseEducation, // Pick List
        spouse_work_experience: spouseWorkExperience, // Number
        spouse_english_language_ability: spouseEnglishLanguageAbility, // Pick List
        Campaigns_Name: showCampaignName ? "Subclass 462" : `${capitalize(country)} Assessment Report`,
      },
    ],
  };
};

const updateLeadsApiDataParser = (
  eligibilityData,
  australiaData,
  canadaReport,
  germanyPoints
) => {
  const { totalPoints: total_points_australia, points: australiaPoints } =
    australiaData;

  const {
    age: age_points_australia,
    education: education_points_australia,
    experience: work_experience_points_australia,
    language: english_language_ability_points_australia,
    marital: marital_status_points_australia,
    overseasWorkExperience: onshore_work_experience_points_australia,
    spouseEducation: spouse_education_points_australia,
    spouseWorkExperience: spouse_work_experience_points_australia,
    spouseEnglishLanguageAbility:
    spouse_english_language_ability_points_australia,
  } = australiaPoints;

  const { totalPoints: total_points_canada, points: canadaPoints } =
    canadaReport;

  const {
    age: age_points_canada,
    education: education_points_canada,
    experience: work_experience_points_canada,
    language: english_language_ability_points_canada,
    marital: marital_status_points_canada,
    overseaseWorkExperience: onshore_work_experience_points_canada,
    spouseEducation: spouse_education_points_canada,
    spouseWorkExperience: spouse_work_experience_points_canada,
    spouseEnglishLanguageAbility: spouse_english_language_ability_points_canada,
  } = canadaPoints;

  const {
    age: age_points_germany,
    education: education_points_germany,
    experience: work_experience_points_germany,
    language: english_language_ability_points_germany,
  } = germanyPoints;


  const {
    fullName,
    email,
    phoneNumber,
    country,
    service,
    age,
    education,
    workExperience,
    workOverseasExperience,
    englishLanguageAbility,
    maritalStatus,
    spouseEducation,
    spouseWorkExperience,
    spouseEnglishLanguageAbility,
    ip
  } = eligibilityData;

  return {
    data: [
      {
        Last_Name: fullName,
        Secondary_Source: `${capitalize(country)} Assessment Report`,
        country_addressed: capitalize(country), // Pick List
        service_required: ["PR"], // Multiselect
        age, // Number
        education, // Pick List
        work_experience: workExperience, // Number
        work_overseas_experience: workOverseasExperience, //Number
        english_language_ability: englishLanguageAbility, // Pick List
        marital_status: maritalStatus, // Pick List,
        spouse_education: spouseEducation, // Pick List
        spouse_work_experience: spouseWorkExperience, // Number
        spouse_english_language_ability: spouseEnglishLanguageAbility, // Pick List
        // australia points
        age_points_australia, // Number
        work_experience_points_australia, // Number
        onshore_work_experience_points_australia, // Number
        education_points_australia, // Number
        english_language_ability_points_australia, // Number
        marital_status_points_australia, // Number
        spouse_education_points_australia, // Number
        spouse_work_experience_points_australia, // Number
        spouse_english_language_ability_points_australia, // Number
        total_points_australia, // Number
        // canada points
        age_points_canada, // Number
        work_experience_points_canada, // Number
        onshore_work_experience_points_canada, // Number
        english_language_ability_points_canada, // Number
        education_points_canada, // Number
        marital_status_points_canada, // Number
        spouse_education_points_canada, // Number
        spouse_work_experience_points_canada, // Number
        spouse_english_language_ability_points_canada, // Number
        total_points_canada, // Number
        // Germany points
        age_points_germany,
        work_experience_points_germany,
        education_points_germany, // Number
        english_language_ability_points_germany, // Number
        // ip information
        Country: ip?.country, // String
        City: ip?.city, // String
        IP_Address: ip?.ipAddress // String
      },
    ],
  };
};

const leadsUpdateeLeadsApiDataParser = (eligibilityData, isContact = false) => {
  const {
    fullName,
    email,
    phoneNumber,
    countryCode,
    country,
    service,
    age,
    education,
    workExperience,
    workOverseasExperience,
    englishLanguageAbility,
    maritalStatus,
    spouseEducation,
    spouseWorkExperience,
    spouseEnglishLanguageAbility,
  } = eligibilityData;

  const serviceRequires = {
    immigration: "PR",
    work: "Work Permit",
    study: "Student/Exchange Visa",
    travel: "Visit Visa",
  };

  return {
    data: [
      {
        Layout: {
          id: isContact ? process.env.ZOHO_CRM_CONTACTS_LAYOUT_ID : process.env.ZOHO_CRM_NEW_LAYOUT_ID,
        },
        Secondary_Source: `Subclass 462 Assessment Report`,
        Country_Code: countryCode,
        age, // Number
        education, // Pick List
        work_experience: workExperience, // Number
        english_language_ability: englishLanguageAbility, // Pick List
        Campaigns_Name: "Subclass 462",
        Customer_Contacted_Again: "Yes",
        country_addressed: capitalize(country),
      },
    ],
  };
};

const canadaLeadsApiData = (
  name,
  email,
  phoneNumber,
  age,
  totalWorkExperience,
  canadianWorkExperience,
  canadianWorkExperienceSpouse,
  spouseLanguage,
  applicantLanguage,
  highestEducationQualification,
  maritalStatus,
  partnerQualification
) => {
  return {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_LAYOUT_ID,
        },
        Lead_Source: "Website Canada Spot Assessment Form",
        Test_Taken: "No",
        country_finalised: "Canada",
        service_required: ["PR"],
        First_Name: "",
        Last_Name: name,
        Email: email,
        Phone: phoneNumber.toString(),
        age: age,
        work_experience: totalWorkExperience,
        work_overseas_experience: canadianWorkExperience,
        spouse_work_experience: canadianWorkExperienceSpouse,
        spouse_english_language_ability: spouseLanguage,
        english_language_ability: applicantLanguage,
        education: highestEducationQualification,
        marital_status: maritalStatus,
        spouse_education: partnerQualification.toString(),
        spouse_work_experience: "0",
      },
    ],
  };
};

const australiaLeadsApiData = (
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
) => {
  return {
    data: [
      {
        Layout: {
          id: process.env.ZOHO_LAYOUT_ID,
        },
        Lead_Source: "Website Australia Spot Assesment",
        Lead_Status: "New Lead",
        Test_Taken: "No",
        country_finalised: "Australia",
        service_required: ["PR"],
        First_Name: "",
        Last_Name: name,
        Email: email,
        Phone: phoneNumber.toString(),
        age: age,
        work_experience: totalWorkExperience,
        Australian_skilled_employment_experience: australianWorkExperience,
        english_langauge_ability: applicantLanguage,
        spouse_english_language_ability: applicantLanguage,
        education: highestEducationQualification,
        marital_status: maritalStatus,
        Partner_skills: partnerCriteria,
        spouse_education: partnerQualification.toString(),
        spouse_work_experience: "0",
      },
    ],
  };
};

const apiKeyMiddleware = (req, res, next) => {
  // Accept both "api-key" and "x-api-key" headers
  const apiKey = req.headers["api-key"] || req.headers["x-api-key"];

  if (apiKey && apiKey === API_KEY) {
    next(); // Proceed to the next middleware
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

const mcubeApiKeyMiddleware = (req, res, next) => {
  // Accept both "api-key" and "x-api-key" headers
  const apiKey = req.headers["api-key"] || req.headers["x-api-key"];

  if (apiKey && apiKey === API_KEY_MCUBE) {
    next(); // Proceed to the next middleware
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

function downloadFileWithToken(downloadUrl, token) {
  return new Promise((resolve, reject) => {
    axios
      .get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.ok) {
          return response.buffer();
        }
        throw new Error("Failed to download file");
      })
      .then((buffer) => {
        const filePath = "downloaded_file";
        fs.writeFileSync(filePath, buffer);
        console.log("File downloaded successfully");
        resolve(filePath);
      })
      .catch((error) => {
        console.error("Download error:", error);
        reject(error);
      });
  });
}

function base64ToBlob(base64Data, contentType) {
  const byteCharacters = atob(base64Data);
  console.log(byteCharacters);
  const byteNumbers = new Array(byteCharacters.length);
  console.log(byteNumbers);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

const formatCurrentDate = (daysToAdd = 0) => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = currentDate.toLocaleString("default", { month: "short" });
  const year = currentDate.getFullYear();
  let hours = String(currentDate.getHours()).padStart(2, "0");
  let minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");

  // Round minutes to the nearest multiple of 5
  minutes = Math.ceil(minutes / 5) * 5;

  return `${day} - ${month} - ${year}`;
};

function convertTo24HourFormat(time12h) {
  let [time, period] = time12h.split(" ");
  var [hours, minutes] = time.split(":").map(Number);

  if (period.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  } else if (period.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}: ${minutes
    .toString()
    .padStart(2, "0")
    }`;
}

const currentDateTime = (daysToAdd = 0, time) => {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + daysToAdd);

  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = currentDate.toLocaleString("default", { month: "short" });
  const year = currentDate.getFullYear();

  const convertedTime = convertTo24HourFormat(time);
  let hours = convertedTime.split(":")[0];
  let minutes = convertedTime.split(":")[1];

  // Round minutes to the nearest multiple of 5
  minutes = Math.ceil(minutes / 5) * 5;

  const finalDate = `${day} - ${month} - ${year} ${hours}: ${minutes}:00`;

  return finalDate;
};

function compareTime(selectedTime, availableSlotTime) {
  function timeToMinutes(time) {
    let [hours, minutes] = time.split(":").map(Number);
    console.log("hours", hours, "minutes", minutes);
    if (time.toLowerCase().includes("pm") && hours !== 12) {
      hours += 12;
    } else if (time.toLowerCase().includes("am") && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  const selectedMinutes = timeToMinutes(selectedTime);
  const availableSlotMinutes = timeToMinutes(availableSlotTime);
  console.log(availableSlotMinutes, selectedMinutes);
  return availableSlotMinutes >= selectedMinutes;
}

async function searchLeads(phone, token) {
  try {
    const response = await axios.get(
      `https://www.zohoapis.in/crm/v5/Leads/search?phone=${phone}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.data) {
      const data = response.data.data[0];

      const leadData = {
        id: data.id,
        created_time: data.Lead_Created_Time,
        owner: data.Owner,
        fullName: data.Full_Name,
      };

      return leadData;
    }
  } catch (error) {
    console.log("error", error);
    return "";
  }
}

const allWatiTemplates = {
  agent_busy_after_office_hours: "welcome_template",
  agent_busy_during_office_hours: "agent_busy_during_office_hours_utility",
  we_tried_calling_you: "we_tried_calling_you",
  book_appointment: "book_appointment_utility",
  know_more: "know_more",
  welcome_template_101: "welcome_template_101"
};

const getAverageRatings = (allReviews) => {
  const totalRatings = allReviews.reduce(
    (sum, review) => sum + review.ratings,
    0
  );

  let averageRating = totalRatings / allReviews.length;
  averageRating = Math.min(Math.max(averageRating, 1), 5);
  averageRating = parseFloat(averageRating.toFixed(1));

  return averageRating;
};

async function searchLeadsNew(module, params, token) {
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

/**
 * Format email content with proper HTML structure for email clients
 * @param {string} content - The email content to format
 * @param {string} subject - The email subject
 * @param {string} clientName - The client's name
 * @returns {string} - Formatted HTML email
 */
const formatEmailContent = (content, subject, clientName) => {
  // If content is already HTML formatted, return as is
  if (content.includes('<html>') && content.includes('<body>')) {
    return content;
  }

  // Wrap plain text content in proper HTML structure
  const formattedContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0; font-size: 28px;">${subject}</h1>
        </div>
        <div style="line-height: 1.6; color: #333333; font-size: 16px;">
          ${content.replace(/\n/g, '<br>')}
        </div>
        <div style="margin-top: 30px; text-align: center;">
          <a href="#" style="background-color: #2c5aa0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Schedule Consultation</a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666666; font-size: 14px;">
          <p>Best regards,<br>World Visa Group Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return formattedContent;
};

/**
 * Create a professional email template with consistent styling
 * @param {Object} params - Email parameters
 * @param {string} params.subject - Email subject
 * @param {string} params.clientName - Client name
 * @param {string} params.country - Target country
 * @param {string} params.occupation - Job occupation
 * @param {string} params.content - Email content
 * @returns {Object} - Formatted email object
 */
const createProfessionalEmail = ({ subject, clientName, country, occupation, content }) => {
  const formattedSubject = subject || `Exciting ${occupation} Job Opportunities in ${country}`;
  const formattedContent = formatEmailContent(content, formattedSubject, clientName);

  return {
    subject: formattedSubject,
    html: formattedContent,
    text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    metadata: {
      country,
      occupation,
      clientName,
      generatedAt: new Date().toISOString()
    }
  };
};

// Add to timeline
const capitalizeFn = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');
};

/**
 * Process OpenAI's plain-text markdown bullet list and return an array of up to 4 clean bullet points.
 * Removes code fences and formatting characters, enforcing dash-start for all list items.
 * @param {string} bullets - AI response containing bullet points as a markdown list (dashes).
 * @returns {string[]} Array of up to 4 clean bullet points
 */
const parseMarkdownBullets = (bullets) => {
  if (!bullets || typeof bullets !== 'string') return [];
  // Remove code fences if any
  let cleaned = bullets.replace(/^```(?:markdown)?/gm, '').replace(/```$/gm, '');

  // Remove any leading/trailing * or _ from each line, enforce single dash list item
  const bulletList = cleaned
    .split('\n')
    .map(line =>
      line
        .trim()
        .replace(/^[-*]\s*([*_]*)(.*?)([*_]*)$/, '- $2')
        .replace(/[*_]/g, '')
        .trim()
    )
    .filter(line => line.startsWith('- '))
    .slice(0, 4);

  return bulletList;
};

// Helper function to extract token usage information from OpenAI API responses
const pricingModel = {
  "gpt-3.5-turbo": { inputCost: 0.50, outputCost: 1.50 },
  "gpt-4": { inputCost: 30.00, outputCost: 60.00 },
  "gpt-4-32k": { inputCost: 60.00, outputCost: 120.00 },
  "gpt-4o": { inputCost: 2.50, outputCost: 10.00 },
  "gpt-4o-mini": { inputCost: 0.15, outputCost: 0.60 },
};

function extractTokenUsage(apiResponse, totalTokens = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  total_tokens_cost_in_inr: 0,
}) {
  if (!apiResponse || !apiResponse.usage) {
    return totalTokens;
  }

  totalTokens.prompt_tokens += apiResponse.usage.prompt_tokens || 0;
  totalTokens.completion_tokens += apiResponse.usage.completion_tokens || 0;
  totalTokens.total_tokens += apiResponse.usage.total_tokens || 0;


  if (totalTokens.model && pricingModel[totalTokens.model]) {
    const { inputCost, outputCost } = pricingModel[totalTokens.model];
    const totalUSD = (totalTokens.prompt_tokens * inputCost + totalTokens.completion_tokens * outputCost) / 1_000_000; // Total cost in USD
    totalTokens.total_tokens_cost_in_inr = totalUSD * 84; // Convert to INR based on exchange rate
  }

  return totalTokens;
}

/**
 * Checks if all required fields are present and valid in the request body.
 * Will return a response using `res` if a field is missing/invalid, otherwise returns false (no issues).
 * @param {Array<{ key: string, label: string }>} requiredFields - List of field definitions and error messages.
 * @param {object} reqBody - The body of the request (typically req.body).
 * @param {object} res - The Express response object.
 * @returns {boolean} true if validation failed (response sent), false if all fields are present and valid.
 */
/**
 * Checks if all required fields are present and valid in the request body.
 * Returns an object { validated: true/false, errorMessage: string|null }
 *
 * @param {Array<{ key: string, label: string }>} requiredFields
 * @param {object} reqBody
 * @returns {{ validated: boolean, errorMessage: string|null }}
 */
const Packages = require("../models/packages");

function validateRequiredFields(requiredFields, reqBody) {
  for (const field of requiredFields) {
    if (field.key === 'tags') {
      if (
        !reqBody['tags'] ||
        !Array.isArray(reqBody['tags']) ||
        reqBody['tags'].length === 0
      ) {
        return { validated: false, errorMessage: field.label };
      }
    } else if (field.key === 'type') {
      const allowedTypes = Packages.schema.path('type')?.enumValues || [];
      if (!reqBody['type'] || !allowedTypes.includes(reqBody['type'])) {
        const enumInfo = allowedTypes.length > 0
          ? ` Allowed values: ${allowedTypes.join(', ')}.`
          : '';
        return {
          validated: false,
          errorMessage: `Field 'type' is required.${enumInfo}`
        };
      }
    } else {
      if (!reqBody[field.key]) {
        return { validated: false, errorMessage: field.label };
      }
    }
  }
  return { validated: true, errorMessage: null };
}

/**
 * Handles errors from Zoho API responses and returns a detailed error message.
 * @param {object} response - The Axios response object.
 * @returns {{ errorMessage: string, extractedError: object }} - A readable error message and extracted error details.
 */
const zohoErrorHandler = (response) => {
  const { status, data, config } = response;
  let errorMessage = `Error ${status}: An unexpected error occurred.`;

  // Include specific handling for 400 status code
  if (status === 400 && data && data.message) {
    errorMessage = `Error ${status}: ${data.message}`;
    if (data.code) {
      errorMessage += `\nCode: ${data.code}`;
    }
  } else {
    // Extract the relevant error message if the response includes it
    if (data && data.data) {
      if (Array.isArray(data.data)) {
        data.data.forEach(errorDetail => {
          errorMessage += `\nCode: ${errorDetail.code || 'N/A'}`;
          errorMessage += `\nMessage: ${errorDetail.message || 'No message available'}`;
          if (errorDetail.details) {
            errorMessage += `\nDetails: ${JSON.stringify(errorDetail.details, null, 2)}`;
          }
        });
      }
    } else if (data && data.error) {
      errorMessage = `Error ${status}: ${data.error}`;
      if (data.error_description) {
        errorMessage += `\nDescription: ${data.error_description}`;
      }
    } else if (data && data.message) {
      errorMessage = `Error ${status}: ${data.message}`;
    }
  }

  // Extract error details for easier access
  const extractedError = {
    error: data?.error || 'Unknown error',
    error_description: data?.error_description || 'No description available'
  };

  // Append request details for enhanced debugging
  if (config) {
    errorMessage += `\nRequest URL: ${config.url || 'N/A'}\nRequest Method: ${config.method || 'N/A'}\nRequest Data: ${JSON.stringify(config.data)}`;
  }

  return { errorMessage, extractedError };
};




module.exports = {
  fetchInitialAccessToken,
  fetchToken,
  canadaLeadsApiData,
  australiaLeadsApiData,
  apiKeyMiddleware,
  mcubeApiKeyMiddleware,
  downloadFileWithToken,
  base64ToBlob,
  formatCurrentDate,
  currentDateTime,
  compareTime,
  allWatiTemplates,
  searchLeads,
  leadsApiDataParser,
  leadApiDataParser,
  updateLeadsApiDataParser,
  getAverageRatings,
  leadsUpdateeLeadsApiDataParser,
  searchLeadsNew,
  formatEmailContent,
  createProfessionalEmail,
  capitalizeFn,
  parseMarkdownBullets,
  extractTokenUsage,
  validateRequiredFields,
  zohoErrorHandler
};
