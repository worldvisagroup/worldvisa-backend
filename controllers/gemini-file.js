require("dotenv").config();
const fs = require('node:fs');
const path = require("path");

const { GoogleAIFileManager } = require("@google/generative-ai/server")


// Initialize GoogleAIFileManager with your API_KEY.

const uploadToGoogleAi = async () => {
  const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY_HAFEEZ);
  // const uploadResponse = await fileManager.uploadFile(path.join(__dirname, "../images/gemini-paper.pdf"), {
  //   mimeType: "application/pdf",
  //   displayName: "Gemini 1.5 PDF",
  // });

  const listFilesResponse = await fileManager.listFiles();

  for (const file of listFilesResponse.files) {
    console.log(`name: ${file.name} | display name: ${file.displayName}`);
  }
  // const getResponse = await fileManager.getFile(uploadResponse.file.name);

  // View the response.
  // console.log(`Retrieved file ${getResponse.displayName} as ${getResponse.uri}`);

  // View the response.
  // console.log(`Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`);
  // Upload the file and specify a display name.
}
uploadToGoogleAi();