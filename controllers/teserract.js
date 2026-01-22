const Tesseract = require('tesseract.js');
const { GetStructuresResults } = require('./gemini');

// anju=https://res.cloudinary.com/djvvz62dw/image/upload/v1727351805/samples/anju-dummy-passport_tth9n6.jpg

// cheda=https://res.cloudinary.com/djvvz62dw/image/upload/v1727351375/samples/sample-passport_vceuia.jpg
Tesseract.recognize(
  'https://res.cloudinary.com/djvvz62dw/image/upload/v1727351375/samples/sample-passport_vceuia.jpg',
  'eng',
).then(({ data: { text } }) => {
  console.log("Cheda", text);
  GetStructuresResults(text);
});

// Tesseract.recognize(
//   'https://res.cloudinary.com/djvvz62dw/image/upload/v1727351805/samples/anju-dummy-passport_tth9n6.jpg',
//   'eng',
// ).then(({ data: { text } }) => {
//   console.log("Anju", text);
//   GetStructuresResults(text);
// })