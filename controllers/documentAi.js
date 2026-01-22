const { DocumentProcessorServiceClient } = require("@google-cloud/documentai");
/**
 * TODO(developer): Uncomment these variables before running the sample.
 * https://us-documentai.googleapis.com/v1/projects/937736473903/locations/us/processors/b42e3aeb5bccd4b5/processorVersions/pretrained-foundation-model-v1.3-2024-08-31:process
 */
const projectId = "getavisa";
const location = "us"; // Format is 'us' or 'eu'
const processorId = "b42e3aeb5bccd4b5"; // Create processor in Cloud Console
const filePath = "./Images/aadhaar-card-3.pdf";

// Instantiates a client
// apiEndpoint regions available: eu-documentai.googleapis.com, us-documentai.googleapis.com (Required if using eu based processor)
// const client = new DocumentProcessorServiceClient({apiEndpoint: 'eu-documentai.googleapis.com'});
const client = new DocumentProcessorServiceClient();

async function quickstart() {
  // The full resource name of the processor, e.g.:
  // projects/project-id/locations/location/processor/processor-id
  // You must create new processors in the Cloud Console first
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  // Read the file into memory.
  const fs = require("fs").promises;
  const imageFile = await fs.readFile(filePath);

  // Convert the image data to a Buffer and base64 encode it.
  const encodedImage = Buffer.from(imageFile).toString("base64");

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: "application/pdf",
    },
  };

  // Recognizes text entities in the PDF document
  // Recognizes text entities in the PDF document
  const [result] = await client.processDocument(request);

  const { document } = result;
  for (const entity of document.entities) {
    // Fields detected. For a full list of fields for each processor see
    // the processor documentation:
    // https://cloud.google.com/document-ai/docs/processors-list
    const key = entity.type;
    // some other value formats in addition to text are availible
    // e.g. dates: `entity.normalizedValue.dateValue.year`
    const textValue =
      entity.mentionText !== null ? entity.mentionText : '';
    const conf = entity.confidence * 100;
    console.log(
      `* ${JSON.stringify(key)}: ${JSON.stringify(textValue)}`
    );
  }

}

quickstart();
