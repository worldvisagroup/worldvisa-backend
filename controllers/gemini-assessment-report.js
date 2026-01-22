require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_HAFEEZ);

// ...
// For text-only input, use the gemini-pro model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// ...

const CreateEligibilityPrompt = (userDetails) => {
  const { age, experience, education, language_ability, spouse } = userDetails;
  const { spouse_language_ability, spouse_education, spouse_experience } =
    spouse;

  const prompt = `Act as an Expert Immigration Consultant, your work is to Evaluate the eligibility for these contries: [ Australia]. here is the basic input data:
  Age: {{age}}
  Work Experience: {{indian_experience}}
  Education: {{education}}
  Language Ability: {{language_ability}}
  Spouse (language_ability, education and work_experience): {{spouse}}
  what output should include:
  1. Points based on point system (sources: https://www.aeccglobal.com.au/blog/the-pr-point-system-in-australia)
  2. format: json (include all the points for all the factors)
  3. mention the sources from where you have taken the eligibility criteria
  here are the user details, you will generate eligibility reports based on this information:
  age: ${age}
  indian_experience: ${experience}
  education: ${education}
  language ability: ${language_ability},
  spouse: {
    language_ability: ${spouse_language_ability},
    education: ${spouse_education},
    work_education: ${spouse_experience}
  }
  `;
  return prompt;
};

const user = {
  age: 30,
  experience: "5 years",
  education: "Bachelor of Science in Computer Science",
  language_ability: "Proficient English",
  spouse: {
    spouse_language_ability: "Superior",
    spouse_education: "Bachelors degree",
    spouse_experience: "3 years",
  },
};

async function CheckAiEligibility() {
  const prompt = CreateEligibilityPrompt(user);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  console.log(response.text());
}

CheckAiEligibility();
