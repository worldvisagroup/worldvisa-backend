require("dotenv").config();

// Make sure to include these imports:
const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_HAFEEZ);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const GetStructuresResults = async (textToExtract) => {
  const prompt = `Extract the User's crucial details from this content and give the response in a structures way [subject]: [anwer], there will be no mobile number or email address in the text. please skip the content which can be extracted or it is harmful, don't throw an error

  Content: ${textToExtract}
  `;
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

module.exports = {
  GetStructuresResults
}


