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
      "Positive Assessment Report",
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
  doc.image(canadaImageBuffer, -20, doc.page.height / 2.6, {
    width: 700,
    height: 850,
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
    .font("Times-Bold")
    .fontSize(23)
    .fillColor("white")
    .text("Congratulations!", 100, 420)
    .moveDown()
    .fontSize(20)
    .fillColor("white")
    .text("You are Eligible")
    .fontSize(15)
    .text("You have all you need to submit a successful application.")
    .fillColor("white");

  doc
    .rect(50, 515, 500, 190)
    .strokeColor("gray")
    .lineWidth(2) // Border width
    .stroke(); // (x, y, width, height)
  doc.fontSize(15).fillColor("white").text("Eligibility Criteria", 100, 530);
  //Criteria Rectangles
  //Age
  doc.roundedRect(100, 550, 120, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text("Age", 105, 551);
  doc.roundedRect(235, 550, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(ageScore1, 240, 551);
  //Education
  doc.roundedRect(100, 570, 120, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text("Education", 105, 571);
  doc.roundedRect(235, 570, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(educationScore1, 240, 571);
  //Employment
  doc.roundedRect(100, 590, 120, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text("Employment", 105, 591);
  doc.roundedRect(235, 590, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(employmentScore1, 240, 591);
  //Language Ability
  doc.roundedRect(100, 610, 120, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text("Language Ability", 105, 611);
  doc.roundedRect(235, 610, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(languageAbilityScore1, 240, 611);
  //Arranged Employment
  doc.roundedRect(100, 630, 120, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text("Arranged Employment", 105, 631);
  doc.roundedRect(235, 630, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(arrangedEmploymentScore1, 240, 631);
  //Adaptability Factors
  doc.roundedRect(100, 650, 120, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text("Adaptability Factors", 105, 651);
  doc.roundedRect(235, 650, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(adaptabilityFactorScore1, 240, 651);
  //Total Points
  doc.roundedRect(140, 670, 80, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text("Total Points", 150, 671);
  doc.roundedRect(235, 670, 20, 10, 5).fillColor("white").fill();
  doc.fontSize(10).fillColor("black").text(totalPoints1, 240, 671);
  doc
    .fontSize(11)
    .fillColor("white")
    .text(
      "Take advantage of the early bird offers on consultations & services by getting in touch now.",
      0,
      720,
      { align: "center" }
    );
  //doc.image(PhoneImageBuffer, 50, 720, { width: 50, height: 50, align: 'center' });
  doc
    .fontSize(11)
    .fillColor("white")
    .text("+91 7022090909", 0, 745, { align: "center" });
  doc
    .fillColor("white")
    .fontSize(11)
    .text("www.worldvisagroup.com", 0, 765, { align: "center" });
  doc
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
