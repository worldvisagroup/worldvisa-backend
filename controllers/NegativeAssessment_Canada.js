const PDFDocument = require("pdfkit");
const imageSize = require("image-size");
const fs = require("fs");
// const sharp = require('sharp');
const path = require("path");
const imagePath = path.join(__dirname, "../Images/logo.png");
const imageBuffer = fs.readFileSync(imagePath);
const canadaImagePath = path.join(__dirname, "../Images/Bg graphics.png");
const canadaImageBuffer = fs.readFileSync(canadaImagePath);
const canadaFlagImagePath = path.join(__dirname, "../Images/Canada Flag.png");
const canadaFlagImageBuffer = fs.readFileSync(canadaFlagImagePath);
const PhoneImagePath = path.join(__dirname, "../Images/Phone_Img.png");
const PhoneImageBuffer = fs.readFileSync(PhoneImagePath);

function buildPDF(
  ageScore1,
  educationScore1,
  employmentScore1,
  canadaEmploymentScore1,
  languageAbilityScore1,
  arrangedEmploymentScore1,
  adaptabilityFactorScore1,
  totalPoints1,
  name,
  dataCallback,
  endCallback
) {
  const doc = new PDFDocument({
    margins: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
  doc.on("data", dataCallback);
  doc.on("end", endCallback);
  const imageWidth = 250; // Adjust based on the actual width of your image
  const imageHeight = 300; // Adjust based on the actual height of your image

  // Calculate the x-coordinate to align the image to the right
  const pageWidth = doc.page.width;
  const x = pageWidth - imageWidth;
  const canadaFlagDimension = imageSize(canadaFlagImageBuffer);
  doc
    .font("Times-Roman")
    .fontSize(10)
    .fillColor("black")
    .text("As on: " + new Date().toLocaleDateString(), 20, 20);
  doc.image(imageBuffer, x, -100, { width: imageWidth, height: imageHeight });
  doc
    .font("Times-Bold")
    .fontSize(30)
    .text(
      "Negative Assessment Report",
      (doc.page.width - canadaFlagDimension.width) / 2 - 50,
      120,
      { align: "center" }
    );

  doc.image(
    canadaFlagImageBuffer,
    (doc.page.width - canadaFlagDimension.width) / 2 + 70,
    150,
    { width: 350, height: 220 }
  );
  doc.image(canadaImageBuffer, -20, doc.page.height / 2.7, {
    width: 700,
    height: 900,
    align: "center",
  });

  doc
    .font("Times-Bold")
    .fontSize(15)
    .fillColor("white")
    .text(
      "For: " + name,
      (doc.page.width - canadaFlagDimension.width) / 2 - 50,
      370,
      { align: "center" }
    );
  doc
    .font("Times-Italic")
    .fontSize(15)
    .fillColor("white")
    .text(
      "We apologise for the inconvenience, but we recommend your explore an alternative option, coz based on the information you've provided, this doesn't seem to be the best choice.",
      70,
      435,
      { width: 420 }
    )
    .moveDown()
    .text(
      "If you are interested in exploring alternate options, our team of expert advisors and specialists in careers abroad will be happy to assist you.",
      70,
      490,
      { width: 430 }
    );

  doc
    .rect(50, 530, 500, 190)
    .strokeColor("gray")
    .lineWidth(2) // Border width
    .stroke(); // (x, y, width, height)
  doc
    .font("Times-Bold")
    .fontSize(15)
    .fillColor("white")
    .text("Eligibility Criteria", 100, 545);
  //Criteria Rectangles
  //Age
  doc.roundedRect(100, 565, 120, 10, 5).fillColor("white").fill();
  doc.font("Times-Bold").fontSize(10).fillColor("black").text("Age", 105, 566);
  doc.roundedRect(235, 565, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(ageScore1, 240, 566);
  //Education
  doc.roundedRect(100, 585, 120, 10, 5).fillColor("white").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Education", 105, 586);
  doc.roundedRect(235, 585, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(educationScore1, 240, 586);
  //Employment
  doc.roundedRect(100, 605, 120, 10, 5).fillColor("white").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Employment", 105, 606);
  doc.roundedRect(235, 605, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(employmentScore1, 240, 606);
  //Language Ability
  doc.roundedRect(100, 625, 120, 10, 5).fillColor("white").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Language Ability", 105, 626);
  doc.roundedRect(235, 625, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(languageAbilityScore1, 240, 626);
  //Arranged Employment
  doc.roundedRect(100, 645, 120, 10, 5).fillColor("white").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Arranged Employment", 105, 646);
  doc.roundedRect(235, 645, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(arrangedEmploymentScore1, 240, 646);
  //Adaptability Factors
  doc.roundedRect(100, 665, 120, 10, 5).fillColor("white").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Adaptability Factors", 105, 666);
  doc.roundedRect(235, 665, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(adaptabilityFactorScore1, 240, 666);
  //Total Points
  doc.roundedRect(140, 685, 80, 10, 5).fillColor("white").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Total Points", 150, 686);
  doc.roundedRect(235, 685, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(totalPoints1, 240, 686);
  doc
    .font("Times-Bold")
    .fontSize(11)
    .fillColor("white")
    .text(
      "Take advantage of the early bird offers on consultations & services by getting in touch now.",
      0,
      730,
      { align: "center" }
    );
  //doc.image(PhoneImageBuffer, 50, 720, { width: 50, height: 50, align: 'center' });
  doc
    .font("Times-Bold")
    .fontSize(11)
    .fillColor("white")
    .text("+91 7022090909", 0, 745, { align: "center" });
  doc
    .font("Times-Bold")
    .fillColor("white")
    .fontSize(11)
    .text("www.worldvisagroup.com", 0, 765, { align: "center" });
  doc
    .font("Times-Bold")
    .fontSize(7)
    .fillColor("white")
    .text(
      "**The following assessment report is provided for informational purposes only & should not be construed as legal or professional advice**",
      0,
      780,
      { align: "center" }
    );
  doc.end();

  //ageScore1,educationScore,employmentScore,languageAbilityScore,arrangedEmploymentScore,adaptabilityFactorScore,totalPoints,
}

module.exports = { buildPDF };
