const PDFDocument = require("pdfkit");
const imageSize = require("image-size");
const fs = require("fs");
// const sharp = require('sharp');
const path = require("path");
const imagePath = path.join(__dirname, "../Images/logo.png");
const imageBuffer = fs.readFileSync(imagePath);
const blue_background = path.join(__dirname, "../Images/Bg graphics.png");
const background_image = fs.readFileSync(blue_background);
const germanyFlag = path.join(
  __dirname,
  "../Images/germany-flag.png"
);
const germanyFlagImage = fs.readFileSync(germanyFlag);
const PhoneImagePath = path.join(__dirname, "../Images/Phone_Img.png");
const PhoneImageBuffer = fs.readFileSync(PhoneImagePath);

function buildPDF(
  ageScore1,
  educationScore1,
  employmentScore1,
  australiaEmploymentScore1,
  languageAbilityScore1,
  communityLanguageScore1,
  partnerSkillsScore1,
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
  const canadaFlagDimension = imageSize(germanyFlagImage);
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
    germanyFlagImage,
    (doc.page.width - canadaFlagDimension.width) / 2 + 120,
    150,
    { width: 350, height: 220 }
  );
  doc.image(background_image, -20, doc.page.height / 2.7, {
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
      450,
      { align: "center" }
    );

  doc
    .font("Times-Roman")
    .fontSize(12)
    .fillColor("white")
    .text(
      "We apologise for the inconvenience, but we recommend your explore an alternative options, coz based on the information you've provided, this doesn't seem to be the best choice.",
      350,
      525,
      { width: 225, align: "center" }
    )
    .moveDown()
    .font("Times-Roman")
    .fontSize(12)
    .fillColor("white")
    .text(
      "If you are interested in exploring alternate options, our team of expert advisors and specialists in careers abroad will be happy to assist you.",
      { width: 225, align: "center" }
    )
    .moveDown()
    .font("Times-Bold")
    .fontSize(12)
    .fillColor("white")
    .text("+91 7022090909", { width: 225, align: "center" });
  doc
    .rect(65, 520, 250, 150)
    .strokeColor("gray")
    .lineWidth(2) // Border width
    .stroke(); // (x, y, width, height)
  doc
    .font("Times-Bold")
    .fontSize(15)
    .fillColor("white")
    .text("Points Tally", 100, 500);
  //Criteria Rectangles
  //Age
  doc.roundedRect(100, 535, 120, 10, 5).fillColor("gray").fill();
  doc.font("Times-Bold").fontSize(10).fillColor("white").text("Age", 105, 536);
  doc.roundedRect(235, 535, 20, 10, 5).fillColor("gray").fill();
  doc.fontSize(10).fillColor("white").text(ageScore1, 240, 536);

  //Education
  doc.roundedRect(100, 555, 120, 10, 5).fillColor("gray").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("white")
    .text("Education", 105, 556);
  doc.roundedRect(235, 555, 20, 10, 5).fillColor("gray").fill();
  doc.fontSize(10).fillColor("white").text(educationScore1, 240, 556);

  //Employment
  doc.roundedRect(100, 575, 120, 10, 5).fillColor("gray").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("white")
    .text("Employment", 105, 576);
  doc.roundedRect(235, 575, 20, 10, 5).fillColor("gray").fill();
  doc.fontSize(10).fillColor("white").text(employmentScore1, 240, 576);

  //Language Ability
  doc.roundedRect(100, 595, 120, 10, 5).fillColor("gray").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("white")
    .text("Language Ability", 105, 596);
  doc.roundedRect(235, 595, 20, 10, 5).fillColor("gray").fill();
  doc.fontSize(10).fillColor("white").text(languageAbilityScore1, 240, 596);
  //Community Language
  // doc.roundedRect(100, 635, 120, 10, 5)
  //     .fillColor('gray')
  //     .fill()
  // doc.font('Times-Bold').fontSize(10).fillColor('white').text('Community Language', 105, 636)
  // doc.roundedRect(235, 635, 20, 10, 5)
  //     .fillColor('gray')
  //     .fill()
  // doc.fontSize(10).fillColor('white').text(communityLanguageScore1, 240, 636)

  // Total Points
  doc.roundedRect(100, 615, 120, 10, 5).fillColor("gray").fill();
  doc
    .font("Times-Bold")
    .fontSize(10)
    .fillColor("white")
    .text("Total Points", 105, 616);
  doc.roundedRect(235, 615, 20, 10, 5).fillColor("gray").fill();
  doc.fontSize(10).fillColor("white").text(totalPoints1, 240, 616);


  //doc.image(PhoneImageBuffer, 50, 720, { width: 50, height: 50, align: 'center' });
  //doc.font('Times-Bold').fontSize(11).fillColor('white').text('+91 7022090909', 0, 745, { align: 'center' })
  doc
    .font("Times-Bold")
    .fillColor("white")
    .fontSize(12)
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
