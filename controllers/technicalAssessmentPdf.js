const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { capitalizeFn } = require("../utils/helperFunction");

const profileSummaryData = {
  title: 'Profile Summary',
  columns: [
    { label: 'Field', widthPercent: 0.34, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'left' },
    { label: 'Details', widthPercent: 0.66, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'left' }
  ],
  rows: [
    ["ANZSCO Code", "221213  External Auditor"],
    ["Skills Assessment", "CPA Australia  Positive) - dated 28 January 2025"],
    ["Assessed Employment", "Deloitte India, Audit & Assurance In Charge  26 Aug 2019   9 June 2023"],
    ["English Test", "PTE Academic - 90 in all bands  Superior English) - Valid until: 09 Oct 2026"],
    ["Qualification", "Bachelor of Commerce (Honours) from Christ University - Assessed as AQF Bachelor Degree"],
    ["Age", "27 years  DOB 07 May 1998"],
    ["Relationship Status", "Single"]
  ]
}

const profilePointsBreakdown = {
  title: 'Points Breakdown',
  columns: [
    { label: 'Criteria', widthPercent: 0.5, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'left' },
    { label: 'Points', widthPercent: 0.2, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'center' },
    { label: 'Remarks', widthPercent: 0.3, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'left' }
  ],
  rows: [
    ["Age (25-32)", { text: "30", align: "center" }, ""],
    ["English (Superior)", { text: "20", align: "center" }, "PTE Academic"],
    ["Overseas Employment (3 years)", { text: "5", align: "center" }, "Deloitte India"],
    ["Australian Study Requirement", { text: "0", align: "center" }, ""],
    ["Qualifications (Bachelor)", { text: "15", align: "center" }, "Assessed by CPA"],
    ["Single/Partner Skills", { text: "10", align: "center" }, "Single applicant"],
    ["NAATI/CCL", { text: "5", align: "center" }, ""],
    [{ text: "Total", font: "Helvetica-Bold" }, { text: "85", align: "center", font: "Helvetica-Bold" }, { text: "", font: "Helvetica-Bold" }]
  ]
}

const stateNominationAvailabilityData = {
  title: 'State Nomination Availability for ANZSCO 221213',
  columns: [
    { label: 'State/Territory', widthPercent: 0.22, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'left' },
    { label: 'Status', widthPercent: 0.33, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'left' },
    { label: '190 Prospects', widthPercent: 0.22, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'center' },
    { label: '491 Prospects', widthPercent: 0.23, font: 'Helvetica-Bold', size: 12, fill: '#193b61', align: 'center' }
  ],
  rows: [
    [
      { text: "ACT Canberra)", font: "Helvetica-Bold" },
      "Open - Critical Skills List",
      "Competitive at 85 points",
      "Strong at 95 points"
    ],
    [
      { text: "Victoria", font: "Helvetica-Bold" },
      "Regional Shortage",
      "Moderate at 85 points",
      "Strong at 95 points"
    ],
    [
      { text: "New South Wales", font: "Helvetica-Bold" },
      "National Shortage",
      "Good at 85 points",
      "Very strong at 95 points"
    ],
    [
      { text: "South Australia", font: "Helvetica-Bold" },
      "National Shortage",
      "Favorable at 85 points",
      "Favorable at 95 points"
    ],
    [
      { text: "Queensland", font: "Helvetica-Bold" },
      "National Shortage",
      "Good prospects at 85 points",
      "Strong at 95 points"
    ],
    [
      { text: "Tasmania", font: "Helvetica-Bold" },
      "National Shortage",
      "Excellent at 85 points",
      "Excellent at 95 points"
    ],
    [
      { text: "Western Australia", font: "Helvetica-Bold" },
      "National Shortage",
      "Competitive at 85 points",
      "Strong at 95 points"
    ]
  ]
};


const headerLogoPath = path.join(__dirname, "../Images/world-visa-logo.png");
// Use the .webp icon logo but convert to PNG in memory for PDFKit compatibility
const iconLogoPath = path.join(__dirname, "../Images/world-visa-logo-icon.webp");

// Australia flag
const australiaFlagPath = path.join(__dirname, '../Images/australia-map.png');

const freeBadgePath = path.join(__dirname, "../Images/icons/free-badge-xxl.png");

const arrowDownPath = path.join(__dirname, "../Images/icons/arrow-down-grey.png");



let headerLogoBuffer;
let iconLogoPngBuffer; // Will contain PNG buffer of icon logo after conversion
let iconLogoPngOpacityBuffer; // PNG Buffer with alpha for opacity

// Pre-read header logo (PNG)
try {
  headerLogoBuffer = fs.readFileSync(headerLogoPath);
} catch (err) {
  console.error("Could not load logo from", headerLogoPath, err);
  headerLogoBuffer = null;
}

/**
 * Convert WEBP icon logo to PNG buffer
 * Returns a Promise that resolves to a PNG buffer
 */
function convertWebpToPngSync(filePath) {
  try {
    const webpBuffer = fs.readFileSync(filePath);
    return sharp(webpBuffer).png().toBuffer();
  } catch (error) {
    console.error("Error converting WebP to PNG:", error);
    return null;
  }
}

/**
 * Take a PNG buffer and return a buffer with global alpha set (for opacity)
 * @param {Buffer} pngBuffer
 * @param {number} opacity (0-1)
 * @returns {Promise<Buffer>}
 */
function applyPngOpacity(pngBuffer, opacity = 0.18) {
  // Clamp opacity to [0, 1]
  opacity = Math.max(0, Math.min(1, opacity));
  // Using sharp to composite a transparent PNG on top sets global alpha
  return sharp(pngBuffer)
    .ensureAlpha(opacity)
    .composite([{
      input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: "dest-in",
    }])
    .png()
    .toBuffer();
}

let iconLogoPngPromise = convertWebpToPngSync(iconLogoPath);

let iconLogoPngOpacityPromise = (async () => {
  // Wait for PNG
  let basePng = await iconLogoPngPromise;
  if (!basePng) return null;
  // You can tweak opacity here:
  return applyPngOpacity(basePng, 0.18);
})();

async function ensureIconLogoPngBuffer() {
  if (!iconLogoPngBuffer) {
    try {
      iconLogoPngBuffer = await iconLogoPngPromise;
    } catch (e) {
      iconLogoPngBuffer = null;
    }
  }
  if (!iconLogoPngOpacityBuffer) {
    try {
      iconLogoPngOpacityBuffer = await iconLogoPngOpacityPromise;
    } catch (e) {
      iconLogoPngOpacityBuffer = null;
    }
  }
}

/**
 * Get X to center an image of width `imgWidth` on the PDF page
 */
function centerImageX(doc, imgWidth) {
  return (doc.page.width - imgWidth) / 2;
}

/**
 * Insert logo into header, centered horizontally, scaled to 50% width
 * @param {PDFDocument} doc
 * @param {Buffer} logo
 */
function insertLogoHeaderCentered(doc, logo) {
  const maxLogoWidth =
    (doc.page.width - doc.page.margins.left - doc.page.margins.right) * 0.5;
  // Insert the logo header image
  doc.image(
    logo,
    centerImageX(doc, maxLogoWidth),
    28,
    { width: maxLogoWidth }
  );
  // Add a margin bottom of 100px by adjusting doc.y
  doc.y = Math.max(doc.y, 28 + (logo ? (maxLogoWidth * (logo.height / logo.width) || 0) : 0) + 60);
}

/**
 * Insert icon logo centered at 75% width and 400px height. Vertical center, with opacity.
 * @param {PDFDocument} doc
 * @param {Buffer} iconLogoPngOpacity
 */
function insertIconLogoCentered(doc, iconLogoPngOpacity) {
  const maxIconWidth =
    (doc.page.width - doc.page.margins.left - doc.page.margins.right) * 0.95;
  const iconHeight = 220;
  // Center horizontally
  const x = centerImageX(doc, maxIconWidth);

  // Center vertically within content area
  const contentAreaHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  const y = doc.page.margins.top + (contentAreaHeight - iconHeight) / 2;

  doc.image(
    iconLogoPngOpacity,
    x,
    y,
    { width: maxIconWidth, height: iconHeight }
  );
}

// Color and bold "Australia PR jackpot!" in dark blue, rest normal
const prefix = "You've just hit the ";
const highlighted = "Australia PR jackpot!";
const fontName = 'Helvetica';
const boldFont = 'Helvetica-Bold';
const fontSize = 18;
const color = '#000';
const blue = '#193b61'; // dark blue
// Center "You've just hit the Australia PR jackpot!" on a single line, prevent any wrapping

const createPDFWithName = async (name, allSectionsData) => {
  await ensureIconLogoPngBuffer();

  return new Promise((resolve, reject) => {
    try {
      if (!headerLogoBuffer) {
        throw new Error('Header logo buffer not found. Is the logo file missing?');
      }
      if (!iconLogoPngBuffer || !iconLogoPngOpacityBuffer) {
        throw new Error('Icon logo PNG buffer not found. Icon logo may be missing or conversion failed.');
      }

      const doc = new PDFDocument({
        margins: {
          top: 50,
          left: 50,
          right: 50,
          bottom: 50,
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));


      // 4 Pages: first page = hero content, others as before
      for (let i = 0; i < 9; i++) {
        if (i > 0) doc.addPage();
        // --- PAGE HEADER ---
        insertLogoHeaderCentered(doc, headerLogoBuffer);

        // Move down a bit after logo
        doc.moveDown(1);

        if (i === 0) {
          pdfPage1(doc, name);
          addPageNumber(doc, i);
        } else if (i === 1) {
          // Centered icon logo on page 2
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);

          // Heading: "TECHNICAL EVALUATION & PATHWAY ASSESSMENT – AUSTRALIA"
          doc
            .font('Helvetica-Bold')
            .fontSize(20)
            .fillColor('#000')
            .text('TECHNICAL EVALUATION & PATHWAY\nASSESSMENT – AUSTRALIA', {
              align: 'left',
              lineGap: 1,
              characterSpacing: 0.5,
              paragraphGap: 0,
            });
          doc.moveDown(0.5);

          // Subheading: "Confidential | Prepared by World Visa (MARA-Registered Panel)"
          doc
            .font('Helvetica')
            .fontSize(12)
            .fillColor('#222')
            .text('Confidential | Prepared by World Visa (MARA-Registered Panel)', {
              align: 'left',
              lineGap: 0,
              paragraphGap: 0
            });

          doc.moveDown(2);
          // Profile Summary AI Markdown table
          if (allSectionsData?.profileSummaryTable?.content) {
            // Helper function to parse markdown table to tableData {columns, rows}
            const parsedTable = markdownTableToTableData(allSectionsData.profileSummaryTable.content);

            if (parsedTable) {
              // Draw table title
              const title = allSectionsData.profileSummaryTable.title;
              drawTableWithTitle(doc, {
                ...parsedTable,
                title
              });
            } else {
              // fallback: render as monospaced plain text if parsing fails
              doc.font('Courier').fontSize(11).text(allSectionsData.profileSummaryTable.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No AI content available.", { align: 'center' });
          }

          doc.moveDown(2);


          if (allSectionsData?.profileSummarySnapshots?.content) {

            renderBulletSectionWithTitle(doc, allSectionsData.profileSummarySnapshots.content, allSectionsData.profileSummarySnapshots.tile)
          }

          addPageNumber(doc, i);

        } else if (i === 2) {
          // Centered icon logo on page 3
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);
          // Draw the state nomination availability table after centered icon logo
          if (allSectionsData?.prPathwayTable?.content) {
            // Helper function to parse markdown table to tableData {columns, rows}
            const parsedTable = markdownTableToTableData(allSectionsData.prPathwayTable.content);

            if (parsedTable) {
              // Draw table title
              const title = allSectionsData.prPathwayTable.title;
              drawTableWithTitle(doc, {
                ...parsedTable,
                title
              });
            } else {
              // fallback: render as monospaced plain text if parsing fails
              doc.font('Courier').fontSize(11).text(allSectionsData.prPathwayTable.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No AI content available.", { align: 'center' });
          }

          doc.moveDown(2);

          if (allSectionsData?.prPathwayEligibilityTable?.content) {
            const parsedEligibilityTable = markdownTableToTableData(allSectionsData.prPathwayEligibilityTable.content);

            if (parsedEligibilityTable) {
              const tableWithCalculatedTotals = calculatePrEligibilityTotals(parsedEligibilityTable);
              
              const tableTitle = allSectionsData.prPathwayEligibilityTable.title;
              const subheading = allSectionsData.prPathwayEligibilityTable.subheading;
              drawTableWithTitle(doc, {
                ...tableWithCalculatedTotals,
                title: tableTitle,
                subheading: subheading
              });
            } else {
              doc.font('Courier').fontSize(11).text(allSectionsData.prPathwayEligibilityTable.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No AI eligibility table available.", { align: 'center' });
          }

          doc.moveDown(1);

          addPageNumber(doc, i);


        } else if (i === 3) {
          // Centered icon logo on page 4
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);

          if (allSectionsData?.crossStateNominationMatrix?.content) {
            // Try to parse the markdown table
            const parsedStateNominationTable = markdownTableToTableData(allSectionsData.crossStateNominationMatrix.content);

            if (parsedStateNominationTable) {
              const tableTitle = allSectionsData.crossStateNominationMatrix.title;
              const subheading = allSectionsData.crossStateNominationMatrix.subheading;
              drawTableWithTitle(doc, {
                ...parsedStateNominationTable,
                title: tableTitle,
                subheading: subheading
              });
            } else {
              // fallback: render as monospaced plain text if parsing fails
              doc.font('Courier').fontSize(11).text(allSectionsData.crossStateNominationMatrix.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No state nomination matrix available.", { align: 'center' });
          }

          addPageNumber(doc, i);


        } else if (i === 4) {
          // Centered icon logo on page 3
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);

          // If "labourMarketOutlookByRegion" table is present, try to parse and render as a table:
          if (allSectionsData?.labourMarketOutlookByRegion?.content) {
            // Try to parse the markdown table
            const parsedLabourMarketTable = markdownTableToTableData(allSectionsData.labourMarketOutlookByRegion.content);

            if (parsedLabourMarketTable) {
              const tableTitle = allSectionsData.labourMarketOutlookByRegion.title;
              const subheading = allSectionsData.labourMarketOutlookByRegion.subheading;
              drawTableWithTitle(doc, {
                ...parsedLabourMarketTable,
                title: tableTitle,
                subheading: subheading
              });
            } else {
              // fallback: render as monospaced plain text if parsing fails
              doc.font('Courier').fontSize(11).text(allSectionsData.labourMarketOutlookByRegion.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No labour market outlook by region available.", { align: 'center' });
          }

          addPageNumber(doc, i);

        } else if (i === 5) {
          // Centered icon logo on page 3
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);

          if (allSectionsData?.salaryBenchmarks?.content) {
            // Try to parse the markdown table
            const parsedSalaryBenchmarksTable = markdownTableToTableData(allSectionsData.salaryBenchmarks.content);

            if (parsedSalaryBenchmarksTable) {
              const tableTitle = allSectionsData.salaryBenchmarks.title;
              const subheading = allSectionsData.salaryBenchmarks.subheading;
              drawTableWithTitle(doc, {
                ...parsedSalaryBenchmarksTable,
                title: tableTitle,
                subheading: subheading
              });
            } else {
              // fallback: render as monospaced plain text if parsing fails
              doc.font('Courier').fontSize(11).text(allSectionsData.salaryBenchmarks.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No salary benchmarks available.", { align: 'center' });
          }

          doc.moveDown(3);

          if (allSectionsData?.stepByStepPlanAndSLA?.content) {
            // Try to parse the markdown table
            const parsedStepByStepPlanTable = markdownTableToTableData(allSectionsData.stepByStepPlanAndSLA.content);

            if (parsedStepByStepPlanTable) {
              const tableTitle = allSectionsData.stepByStepPlanAndSLA.title;
              const subheading = allSectionsData.stepByStepPlanAndSLA.subheading;
              drawTableWithTitle(doc, {
                ...parsedStepByStepPlanTable,
                title: tableTitle,
                subheading: subheading
              });
            } else {
              // fallback: render as monospaced plain text if parsing fails
              doc.font('Courier').fontSize(11).text(allSectionsData.stepByStepPlanAndSLA.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No step-by-step plan & SLA available.", { align: 'center' });
          }

          addPageNumber(doc, i);

        } else if (i === 6) {
          // Centered icon logo on page 3
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);

          if (allSectionsData?.riskRegisterMitigations?.content) {
            // Try to parse the markdown table
            const parsedRiskRegisterTable = markdownTableToTableData(allSectionsData.riskRegisterMitigations.content);

            if (parsedRiskRegisterTable) {
              const tableTitle = allSectionsData.riskRegisterMitigations.title;
              const subheading = allSectionsData.riskRegisterMitigations.subheading;
              drawTableWithTitle(doc, {
                ...parsedRiskRegisterTable,
                title: tableTitle,
                subheading: subheading
              });
            } else {
              // fallback: render as monospaced plain text if parsing fails
              doc.font('Courier').fontSize(11).text(allSectionsData.riskRegisterMitigations.content, { align: 'left' });
            }
          } else {
            doc.font('Helvetica-Oblique').fontSize(12).fillColor('#999').text("No risk register available.", { align: 'center' });
          }

          doc.moveDown(1);

          if (allSectionsData?.outcomeForecast?.content) {
            renderBulletSectionWithTitle(
              doc,
              allSectionsData.outcomeForecast.content,
              allSectionsData.outcomeForecast.title
            );
          }

          addPageNumber(doc, i);

        } else if (i === 7) {
          // Centered icon logo on page 3
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);

          doc.moveDown(1);

          doc
            .font('Helvetica-Bold')
            .fontSize(20)
            .fillColor('#000')
            .text('Why the MARA Advantage Matters', { align: 'left' });

          if (allSectionsData?.whyMaraAdvantage?.title && allSectionsData?.whyMaraAdvantage?.content) {
            doc.moveDown(1);
            doc
              .font('Helvetica-Bold')
              .fontSize(15)
              .fillColor('#000')
              .text(allSectionsData.whyMaraAdvantage.title, { align: 'left' });
            doc.moveDown(0.5);
          }

          if (allSectionsData?.whyMaraAdvantage?.content) {
            doc
              .font('Helvetica')
              .fontSize(13)
              .fillColor('#222')
              .text(allSectionsData.whyMaraAdvantage.content, { align: 'left' });
          }

          doc.moveDown(2);

          // Render the "Legal Authority & Accountability" section if present
          if (allSectionsData.legalAuthorityAccountability.title && allSectionsData?.legalAuthorityAccountability?.content) {
            doc
              .font('Helvetica-Bold')
              .fontSize(15)
              .fillColor('#000')
              .text(
                allSectionsData.legalAuthorityAccountability.title || 'Legal Authority & Accountability',
                { align: 'left' }
              );
            doc.moveDown(0.5);
            doc
              .font('Helvetica')
              .fontSize(13)
              .fillColor('#222')
              .text(allSectionsData.legalAuthorityAccountability.content, { align: 'left' });
          }

          doc.moveDown(2);

          // Render the "Up-to-Date Expertise" section if present
          if (allSectionsData?.upToDateExpertise?.title && allSectionsData?.upToDateExpertise?.content) {
            doc
              .font('Helvetica-Bold')
              .fontSize(15)
              .fillColor('#000')
              .text(
                allSectionsData.upToDateExpertise.title || 'Up-to-Date Expertise',
                { align: 'left' }
              );
            doc.moveDown(0.5);
            doc
              .font('Helvetica')
              .fontSize(13)
              .fillColor('#222')
              .text(allSectionsData.upToDateExpertise.content, { align: 'left' });
          }

          doc.moveDown(1);

          if (allSectionsData?.riskMitigation?.content && Array.isArray(allSectionsData.riskMitigation.content)) {
            renderBulletSectionWithTitle(
              doc,
              allSectionsData.riskMitigation.content,
              allSectionsData.riskMitigation.title || "Risk Mitigation"
            );
          }

          doc.moveDown(1);

          if (allSectionsData?.timeCostPeaceOfMind?.content && Array.isArray(allSectionsData.timeCostPeaceOfMind.content)) {
            renderBulletSectionWithTitle(
              doc,
              allSectionsData.timeCostPeaceOfMind.content,
              allSectionsData.timeCostPeaceOfMind.title || "Time, Cost, Peace of Mind"
            );
          }

          addPageNumber(doc, i);

        } else if (i === 8) {
          // Centered icon logo on page 3
          insertIconLogoCentered(doc, iconLogoPngOpacityBuffer);

          if (allSectionsData?.maraSummary?.title) {
            doc
              .font('Helvetica-Bold')
              .fontSize(15)
              .fillColor('#000')
              .text(allSectionsData.maraSummary.title, { align: 'left' });
            doc.moveDown(0.5);
          }
          if (allSectionsData?.maraSummary?.content) {
            doc
              .font('Helvetica')
              .fontSize(13)
              .fillColor('#222')
              .text(allSectionsData.maraSummary.content, { align: 'left' });
          }

          doc.moveDown(2);

          if (allSectionsData?.worldVisaAdvantage?.title) {
            doc
              .font('Helvetica-Bold')
              .fontSize(15)
              .fillColor('#000')
              .text(allSectionsData.worldVisaAdvantage.title, { align: 'left' });
            doc.moveDown(0.5);
          }
          if (allSectionsData?.worldVisaAdvantage?.content) {
            doc
              .font('Helvetica')
              .fontSize(13)
              .fillColor('#222')
              .text(allSectionsData.worldVisaAdvantage.content, { align: 'left' });
          }

          doc.moveDown(2);

          // Box padding in points
          const boxPaddingX = 28;
          const boxPaddingY = 18;
          const boxInnerGap = 12;

          // Calculate box content width
          const boxContentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 2 * boxPaddingX;

          // Store initial Y for box top
          const boxStartY = doc.y;

          // --- Prepare for inside-the-box rendering
          let y = doc.y + boxPaddingY;

          // "Next Steps" heading inside box
          doc.save();
          doc.font('Helvetica-Bold')
            .fontSize(16)
            .fillColor('#193b61');
          doc.text('Next Steps', doc.page.margins.left + boxPaddingX, y, { width: boxContentWidth, align: 'left' });

          y = doc.y + 4; // move down a little from heading

          // Subheading
          doc.font('Helvetica')
            .fontSize(13)
            .fillColor('#222');
          doc.text(
            'Ready to discuss your case in detail? Schedule a free strategy consultation to review your profile and plan the best pathway forward.',
            doc.page.margins.left + boxPaddingX,
            y,
            { width: boxContentWidth, align: 'left' }
          );
          y = doc.y + boxInnerGap;

          // Draw a "button" for 'Book a Meeting' link, inside the box (centered horizontally)
          const bookingLabel = 'Book a Meeting';
          const bookingUrl = 'https://worldvisa.zohobookings.in/#/71920000001160146';
          const buttonPaddingY = 8; // px
          const buttonPaddingX = 18; // px
          const buttonFontSize = 13;
          const buttonFont = 'Helvetica-Bold';

          doc.font(buttonFont).fontSize(buttonFontSize);
          const labelWidth = doc.widthOfString(bookingLabel);
          const labelHeight = doc.currentLineHeight();
          const buttonWidth = labelWidth + 2 * buttonPaddingX;
          const buttonHeight = labelHeight + 2 * buttonPaddingY;

          const boxX = doc.page.margins.left;
          const buttonX = boxX + boxPaddingX + (boxContentWidth - buttonWidth) / 2;
          const buttonY = y;

          // Draw button rectangle (rounded)
          const buttonRadius = 6;
          doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, buttonRadius)
            .fillAndStroke('#1565c0', '#1253a0'); // Fill blue, stroke darker blue

          // Draw the link text over the button (centered)
          doc
            .fillColor('#fff')
            .font(buttonFont)
            .fontSize(buttonFontSize)
            .text(
              bookingLabel,
              buttonX,
              buttonY + buttonPaddingY,
              {
                width: buttonWidth,
                height: labelHeight,
                align: 'center',
                link: bookingUrl,
                underline: false,
                continued: false,
              }
            );

          // Restore after all in-box drawing
          doc.restore();

          // Compute box's full height:
          const boxEndY = buttonY + buttonHeight + boxPaddingY;

          // Draw the outer rectangle (rounded box)
          const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
          doc.save();
          doc.lineWidth(2);
          doc.roundedRect(
            boxX,
            boxStartY,
            boxWidth,
            boxEndY - boxStartY,
            12 // roundness
          );
          doc.stroke('#a8bcd7');
          doc.restore();

          // Move doc.y to after box
          doc.y = boxEndY + 6;

          doc.moveDown(2);

          addPageNumber(doc, i);
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateTechnicalAssessmentPDF = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({
        error: 'Name parameter is required'
      });
    }

    const pdfBuffer = await createPDFWithName(name);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="technical-assessment-${name.replace(/\s+/g, '-').toLowerCase()}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
};

module.exports = {
  createPDFWithName,
  generateTechnicalAssessmentPDF
};

function pdfPage1(doc, name) {
  // Party popper image + Congratulations header (in one line)
  try {
    const partyPopperPath = path.join(__dirname, '../Images/party-popper.png');
    if (fs.existsSync(partyPopperPath)) {
      const imgWidth = 28, imgHeight = 28;
      // Calculate combined width (image + gap + text)
      const congratsText = "Congratulations!";
      const congratsFont = boldFont;
      const congratsFontSize = 22;
      doc.font(congratsFont).fontSize(congratsFontSize);
      const textWidth = doc.widthOfString(congratsText);
      const gap = 10;
      const totalWidth = imgWidth + gap + textWidth;
      const xStart = (doc.page.width - totalWidth) / 2;
      const y = doc.y;

      // Draw the image
      doc.image(partyPopperPath, xStart, y, { width: imgWidth, height: imgHeight });

      // Draw the text right after the image
      doc.font(congratsFont)
        .fontSize(congratsFontSize)
        .text(congratsText, xStart + imgWidth + gap, y + (imgHeight - doc.currentLineHeight()) / 2, {
          width: textWidth,
          align: 'left',
          lineBreak: false,
          continued: false
        });

      doc.moveDown(0.5);
    } else {
      // fallback: show only text centered
      doc
        .font('Helvetica')
        .fontSize(13)
        .text("Congratulations!", { align: 'center' })
        .moveDown(0.5);
    }
  } catch (err) {
    // fallback: show only text centered
    doc
      .font(boldFont)
      .fontSize(18)
      .text("Congratulations!", { align: 'center' })
      .moveDown(1.5);
  }

  doc.moveDown(0.5);

  // Insert "Hafeez Ur Rehman" text, centered and styled beneath the Congratulations section
  {
    const authorText = capitalizeFn(name);
    const fontName = 'Helvetica-Bold';
    const fontSize = 24;
    doc.font(fontName).fontSize(fontSize).fillColor('#2d7fff');
    // Calculate text width and x position to truly center the text
    const authorTextWidth = doc.widthOfString(authorText);
    const x = doc.page.margins.left + ((doc.page.width - doc.page.margins.left - doc.page.margins.right) - authorTextWidth) / 2;
    // Do NOT set width; just print at calculated X, which prevents forced wrapping
    doc.text(authorText, x, doc.y, {
      align: 'left',
      lineBreak: false,
      continued: false,
      ellipsis: false,
      // width removed to prevent dropping/forced wrapping
    });
    doc.moveDown(2);
  }

  // Subheading - manually center
  {
    const subheading = "You've just moved from";
    const fontName = 'Helvetica';
    const fontSize = 11;
    doc.font(fontName).fontSize(fontSize).fillColor('#444');
    const textWidth = doc.widthOfString(subheading);
    const x = (doc.page.width - textWidth) / 2;
    doc.text(subheading, x, doc.y, {
      align: 'left',
      continued: false,
      lineBreak: true,
      width: textWidth
    });
    doc.moveDown(1);
  }

  // "Maybe to Momentum" bold, bigger - manually center
  {
    const heading = "Maybe to Momentum";
    const fontName = 'Helvetica-Bold';
    const fontSize = 20;
    doc.font(fontName).fontSize(fontSize).fillColor('#000');
    const textWidth = doc.widthOfString(heading);
    const x = (doc.page.width - textWidth) / 2;
    doc.text(heading, x, doc.y, {
      align: 'left',
      continued: false,
      lineBreak: true,
      width: textWidth
    });
  }

  doc.moveDown(1.5);


  {

    // Compute widths separately to center the full line
    doc.font(fontName).fontSize(fontSize);
    const prefixWidth = doc.widthOfString(prefix + 20);
    doc.font(boldFont).fontSize(fontSize);
    const highlightWidth = doc.widthOfString(highlighted);

    const sentenceWidth = prefixWidth + highlightWidth;
    const x = (doc.page.width - sentenceWidth) / 2;
    const currentY = doc.y;

    let cursorX = x;

    // Draw prefix
    doc
      .font(fontName)
      .fontSize(fontSize)
      .fillColor(color)
      .text(prefix, cursorX, currentY, {
        align: 'left',
        lineBreak: false,
        width: 200,
        continued: true
      });

    doc.moveDown(1.5);

    cursorX += prefixWidth;

    // Draw highlighted span
    // Set a large enough width and disable lineBreak to prevent wrapping
    doc
      .font(boldFont)
      .fontSize(fontSize)
      .fillColor(blue)
      .text(highlighted, cursorX - 18, currentY - 22, {
        align: 'left',
        lineBreak: false,
        width: 100, // Set to a large width to avoid wrapping.
        continued: false
      });

    doc.font('Helvetica').fillColor('#000');
    doc.moveDown(1);
  }

  // --- Australia map with flag image or fallback emoji ---
  try {
    // Use australiaFlagPath as imported from the top of the file
    if (fs.existsSync(australiaFlagPath)) {
      const imgWidth = 200, imgHeight = 200;
      const x = centerImageX(doc, imgWidth);
      doc.image(australiaFlagPath, x, doc.y, { width: imgWidth, height: imgHeight });
      doc.moveDown(1);
    } else {
      doc
        .fontSize(38)
        .text("🇦🇺", { align: 'center' })
        .moveDown(1);
    }
  } catch (err) {
    doc
      .fontSize(38)
      .text("🇦🇺", { align: 'center' })
      .moveDown(1);
  }

  // Technical evaluation info in a light gray rounded box
  const boxX = doc.page.margins.left;
  const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const boxY = doc.y + 2;
  const boxHeight = 30;

  // Draw box
  doc.save();
  doc
    .roundedRect(boxX, boxY, boxWidth, boxHeight, 9)
    .fillOpacity(0.04)
    .fill('#000')
    .restore();

  // Set text in box
  const innerY = boxY + 10;
  const innerX = boxX + 12;
  const innerWidth = boxWidth - 24;
  doc
    .font(boldFont)
    .fontSize(14)
    .fillColor('#000')
    .text(
      "This technical evaluation tells you all about your Job profile analysis",
      innerX,
      innerY,
      {
        align: 'center',
        width: innerWidth
      }
    ).moveDown(1);

  doc.moveDown(2); // Space after box

  // Show the FREE badge image next to the Congratulations text

  // Text to display and its style settings
  const congratsText = "Congratulations! You’ve won a FREE one-on-one consultation with a top immigration expert boasting 25+ years of experience!";
  const textFont = 'Helvetica-Bold';
  const textFontSize = 16;

  // Determine text height for a single line (approximation, as actual text may be multiple lines)
  doc.font(textFont).fontSize(textFontSize);
  const testTextHeight = doc.heightOfString(congratsText, {
    width: doc.page.width - 120, // reserve area for badge and left/right
    align: 'left',
    lineGap: 2
  });

  let badgeImgHeight = 32, badgeImgWidth = 32;
  const badgeX = doc.page.margins.left + 11;
  // Vertically center the badge alongside the text by computing center offset
  // Align the *center* of the badge to the vertical center of the text block
  const badgeY = doc.y + (testTextHeight - badgeImgHeight) / 2;

  // Draw "FREE" badge image if it exists, else fallback to old red seal
  if (fs.existsSync(freeBadgePath)) {
    // Draw badge image rotated 40 degrees anti-clockwise, centered to text line
    doc.save();
    doc.rotate(-40, { origin: [badgeX + badgeImgWidth / 2, badgeY + badgeImgHeight / 2] });
    doc.image(freeBadgePath, badgeX, badgeY, {
      width: badgeImgWidth,
      height: badgeImgHeight
    });
    doc.restore();
  } else {
    // fallback: draw red circle with "!"
    doc.save();
    // Center the circle similarly
    doc.circle(
      badgeX + badgeImgWidth / 2,
      badgeY + badgeImgHeight / 2,
      badgeImgHeight / 2 - 6
    ).fillAndStroke('#e51e1e', '#c51e1e');
    doc.restore();
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#fff')
      .text('!', badgeX + (badgeImgWidth - 10) / 2, badgeY + (badgeImgHeight - 10) / 2 - 2, { width: 10, align: 'center' });
  }

  // Draw the "Congratulations..." text beside the badge image/circle, vertically aligned middle to badge
  const textX = badgeX + badgeImgWidth + 12;
  const textY = doc.y;
  doc
    .font(textFont)
    .fontSize(textFontSize)
    .fillColor('#000')
    .text(
      congratsText,
      textX,
      textY,
      {
        width: doc.page.width - textX - 20,
        align: 'left',
        lineGap: 2
      }
    ).moveDown(2);



  // Optionally, add a small mention for "View complete report" at the bottom center with an arrow down icon
  const bottomText = "View complete report";
  // Calculate text width and position to center both text and icon together
  doc.font('Helvetica').fontSize(12);
  const textWidth = doc.widthOfString(bottomText);
  const iconSize = 15;
  const gap = 6; // gap between text and icon
  const totalWidth = textWidth + gap + iconSize;

  // Calculate x such that the combined text + icon is centered
  const centerX = (doc.page.width - totalWidth) / 2;
  const baselineY = doc.page.height - doc.page.margins.bottom;

  // Draw the text
  doc
    .fillColor('#888')
    .text(bottomText, centerX, baselineY, {
      lineBreak: false
    });

  // Draw the arrowDown icon right after the text, vertically centered
  doc.image(
    arrowDownPath,
    centerX + textWidth + gap,
    baselineY - 2 + doc.currentLineHeight() / 2 - iconSize / 2,
    { width: iconSize, height: iconSize }
  );

  doc.moveDown(2);

  // --- Rest of text (existing code) can optionally be appended after, but as per instructions, just add hero content
}

function pdfPage2(doc) {
  // Draw the profile summary table and properly advance Y as per drawTableWithTitle's return value
  const profileTableArea = drawTableWithTitle(doc, profileSummaryData);

  // Move doc.y to just below the profile table for correct vertical positioning
  doc.y = profileTableArea.belowY + 16; // add a space (16 points) between the two tables

  // Draw the points breakdown table just after the profile table
  const pointsTableArea = drawTableWithTitle(doc, profilePointsBreakdown);

  // Optionally advance doc.y if more content should follow
  doc.y = pointsTableArea.belowY;
}

function pdfPage3(doc) {
  // Draw the state nomination availability table using the provided data structure
  const tableArea = drawTableWithTitle(doc, stateNominationAvailabilityData);

  // Optionally advance doc.y for further content after the table
  doc.y = tableArea.belowY;
}





/**
 * Draws a generic table with a title and dynamic rows.
 * @param {PDFDocument} doc PDFKit document instance
 * @param {Object} data Object with shape: { title: string, columns: Array, rows: Array }
 * columns: [{ label: string, widthPercent: number, [font], [fill], [align], [size] }]
 * rows: [ [cell, cell, cell...], ... ], where each cell can be just a text or an object:
 *        { text: string, [font], [fill], [align], [size] }
 * Example:
 * {
 *   title: "My Table",
 *   columns: [
 *     { label: "Name", widthPercent: 0.3 },
 *     { label: "Age", widthPercent: 0.2, align: "center" },
 *     { label: "Details", widthPercent: 0.5 }
 *   ],
 *   rows: [
 *     [ "Jon", { text: 33, align: "center" }, "Engineer" ],
 *     ...
 *   ]
 * }
 */
function drawTableWithTitle(doc, data) {
  const { title, columns, rows } = data;

  // Table columns info
  const startX = doc.page.margins.left;
  const startY = doc.y;

  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // --- COLUMN WIDTH COMPUTATION ---

  // Always sum widthPercent if present, fallback to equal division
  let colWidths;
  if (columns.every(col => typeof col.width === "number")) {
    // Fixed width columns
    colWidths = columns.map(col => col.width);
  } else if (columns.every(col => typeof col.widthPercent === "number")) {
    // All columns specify widthPercent
    const totalPercent = columns.reduce((sum, col) => sum + col.widthPercent, 0);
    colWidths = columns.map((col, i) => {
      // Use full tableWidth
      return Math.round((col.widthPercent / totalPercent) * tableWidth);
    });
    // Adjust last column for rounding error so columns add up to tableWidth
    const totalAssigned = colWidths.reduce((a, b) => a + b, 0);
    if (totalAssigned !== tableWidth) {
      colWidths[colWidths.length - 1] += (tableWidth - totalAssigned);
    }
  } else {
    // fallback evenly divided
    colWidths = Array(columns.length).fill(Math.floor(tableWidth / columns.length));
    // last column gets the remainder for perfect fit
    const assigned = colWidths.reduce((a, b) => a + b, 0);
    colWidths[colWidths.length - 1] += (tableWidth - assigned);
  }

  // Draw table title
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#193b61')
    .text(title, startX, startY);

  let y = doc.y + 10;

  // --------- BACKGROUND WHITE FOR TABLE ---------
  // Determine total table height beforehand
  let headerHeight = 0;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    doc.font(col.font || 'Helvetica-Bold').fontSize(col.size || 12).fillColor(col.fill || '#333');
    const colHeaderHeight = doc.heightOfString(col.label, {
      width: colWidths[i] - 12,
      align: col.align || 'left'
    });
    headerHeight = Math.max(headerHeight, colHeaderHeight);
  }
  headerHeight += 14; // vertical padding

  // Now, precompute heights for all rows:
  let allRowHeights = [];
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    let maxCellHeight = 0;
    for (let i = 0; i < columns.length; i++) {
      let cell = row[i];
      let effectiveFont = 'Helvetica';
      let effectiveSize = 11;
      if (typeof cell === 'object' && cell.text !== undefined) {
        effectiveFont = cell.font || columns[i].font || 'Helvetica';
        effectiveSize = cell.size || columns[i].size || 11;
      } else {
        effectiveFont = columns[i].font || 'Helvetica';
        effectiveSize = columns[i].size || 11;
      }
      doc.font(effectiveFont).fontSize(effectiveSize);
      const cellText = typeof cell === 'object' && cell.text !== undefined ? cell.text : cell;
      const cellHeight = doc.heightOfString(cellText, {
        width: colWidths[i] - 12,
        align: (typeof cell === 'object' ? cell.align : undefined) || columns[i].align || 'left'
      });
      maxCellHeight = Math.max(maxCellHeight, cellHeight);
    }
    allRowHeights.push(maxCellHeight + 14);
  }
  const tableHeight = headerHeight + allRowHeights.reduce((a, b) => a + b, 0);

  // Draw white background
  doc.save()
    .fillColor('#fff')
    .rect(startX, y, tableWidth, tableHeight)
    .fill()
    .restore();

  // Draw header shaded bg
  doc.save()
    .fillColor('#193b61')
    .fillOpacity(0.08)
    .rect(startX, y, tableWidth, headerHeight)
    .fill()
    .restore();

  // WRITE HEADER TEXT
  let headerX = startX;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    doc
      .font(col.font || 'Helvetica-Bold')
      .fontSize(col.size || 12)
      .fillColor(col.fill || '#333')
      .text(col.label, headerX + 8, y + 7, {
        width: colWidths[i] - 12,
        align: col.align || 'left',
        continued: false
      });
    headerX += colWidths[i];
  }

  // Draw bottom border for header
  doc
    .moveTo(startX, y + headerHeight)
    .lineTo(startX + tableWidth, y + headerHeight)
    .lineWidth(0.7)
    .strokeColor('#ccd8e5')
    .stroke();

  let currentY = y + headerHeight;

  // RENDER TABLE ROWS
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const rowHeight = allRowHeights[rowIdx];

    // Alternate row shading
    if (rowIdx % 2 === 1) {
      doc.save()
        .fillColor('#f8fbfd')
        .rect(startX, currentY, tableWidth, rowHeight)
        .fill()
        .restore();
    }

    // Write each cell, use absolute x offset to ensure strict columns alignment
    let cellX = startX;
    for (let i = 0; i < columns.length; i++) {
      let cell = row[i];
      let effectiveFont = columns[i].font || 'Helvetica';
      let effectiveFill = columns[i].fill || '#222';
      let effectiveSize = columns[i].size || 11;
      let effectiveAlign = columns[i].align || 'left';
      let cellText = cell;
      if (typeof cell === 'object' && cell.text !== undefined) {
        cellText = cell.text;
        if (cell.font) effectiveFont = cell.font;
        if (cell.fill) effectiveFill = cell.fill;
        if (cell.size) effectiveSize = cell.size;
        if (cell.align) effectiveAlign = cell.align;
      }
      doc
        .font(effectiveFont)
        .fontSize(effectiveSize)
        .fillColor(effectiveFill)
        .text(cellText, cellX + 8, currentY + 7, {
          width: colWidths[i] - 12,
          align: effectiveAlign,
          continued: false
        });

      // Vertical divider between columns
      if (i < columns.length - 1) {
        doc
          .moveTo(cellX + colWidths[i], currentY)
          .lineTo(cellX + colWidths[i], currentY + rowHeight)
          .lineWidth(0.55)
          .strokeColor(rowIdx === 0 ? '#ccd8e5' : '#e6e6ea')
          .stroke();
      }
      cellX += colWidths[i];
    }

    // Horizontal dashed divider (not after last row)
    if (rowIdx < rows.length - 1) {
      doc
        .moveTo(startX, currentY + rowHeight)
        .lineTo(startX + tableWidth, currentY + rowHeight)
        .lineWidth(0.45)
        .dash(2, { space: 2 })
        .strokeColor('#d2d3de')
        .stroke()
        .undash();
    }
    currentY += rowHeight;
  }

  // Draw border around table
  doc
    .rect(startX, y, tableWidth, currentY - y)
    .lineWidth(0.8)
    .strokeColor('#c7c9d9')
    .stroke();

  doc.font('Helvetica').fontSize(11).fillColor('#000');

  return {
    x: startX,
    y: y,
    width: tableWidth,
    height: currentY - y,
    belowY: currentY + 8
  };
}

/**
 * Calculates age points based on age ranges.
 * @param {number} age - The age in years
 * @returns {number} Points for the age
 */
function calculateAgePoints(age) {
  if (age >= 18 && age <= 24) return 25;
  if (age >= 25 && age <= 32) return 30;
  if (age >= 33 && age <= 39) return 25;
  if (age >= 40 && age <= 44) return 15;
  if (age >= 45) return -65;
  return 0;
}

/**
 * Extracts age from description text.
 * Handles formats like "Age: 43", "43 years old", "Age 43", etc.
 * @param {string} description - The description text
 * @returns {number|null} Extracted age or null if not found
 */
function extractAgeFromDescription(description) {
  if (!description) return null;
  
  // Try to find age pattern: number followed by "years" or after "Age" or "Age:"
  const patterns = [
    /(?:age|age:)\s*(\d+)/i,
    /(\d+)\s*(?:years?|yrs?|year)/i,
    /^(\d+)$/  // If description is just a number
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const age = parseInt(match[1], 10);
      if (!isNaN(age) && age > 0 && age < 150) {
        return age;
      }
    }
  }
  
  return null;
}

/**
 * Calculates PR eligibility points totals programmatically.
 * Also recalculates age points if age can be extracted from description.
 * Extracts component points, sums them, and updates total rows for subclasses 189, 190, 491.
 * 
 * @param {Object} tableData - Parsed table data with columns and rows
 * @returns {Object} Updated table data with corrected totals
 */
function calculatePrEligibilityTotals(tableData) {
  if (!tableData || !tableData.rows || tableData.rows.length === 0) {
    return tableData;
  }

  // Clone the table data to avoid mutating the original
  const updatedTableData = {
    ...tableData,
    rows: tableData.rows.map(row => [...row]) // Deep clone rows
  };

  const rows = updatedTableData.rows;
  
  // Separate component rows from total rows and track their positions
  const componentRows = [];
  const totalRowsMap = {
    189: null,
    190: null,
    491: null
  };
  let ageRowIndex = null;
  
  rows.forEach((row, index) => {
    if (row.length >= 3) {
      const componentName = (row[0] || '').trim();
      
      // Skip header row if present
      if (componentName.toLowerCase() === 'component') {
        return;
      }
      
      // Check for total rows
      if (componentName.includes('Total Points')) {
        if (componentName.includes('189')) {
          totalRowsMap[189] = index;
        } else if (componentName.includes('190')) {
          totalRowsMap[190] = index;
        } else if (componentName.includes('491')) {
          totalRowsMap[491] = index;
        }
      } else {
        // Component row (exclude header row if present)
        // Track Age row separately for recalculation
        if (componentName.toLowerCase() === 'age') {
          ageRowIndex = index;
        }
        componentRows.push({ row, index });
      }
    }
  });

  // Recalculate age points if Age row exists
  if (ageRowIndex !== null && ageRowIndex < rows.length) {
    const ageRow = rows[ageRowIndex];
    if (ageRow.length >= 2) {
      const description = (ageRow[1] || '').trim();
      const extractedAge = extractAgeFromDescription(description);
      
      if (extractedAge !== null) {
        const correctAgePoints = calculateAgePoints(extractedAge);
        // Update the Points column (index 2) with correct age points
        if (ageRow.length < 3) {
          ageRow.push('');
        }
        ageRow[2] = correctAgePoints.toString();
      }
    }
  }

  // Calculate base total (S) by summing all component points
  let baseTotal = 0;
  componentRows.forEach(({ row }) => {
    if (row.length >= 3) {
      const pointsStr = (row[2] || '').trim();
      const points = parseInt(pointsStr, 10);
      if (!isNaN(points)) {
        baseTotal += points;
      }
    }
  });

  // Calculate subclass totals
  const total189 = baseTotal;
  const total190 = baseTotal + 5;
  const total491 = baseTotal + 15;

  // Update existing total rows or add new ones
  const totalRows = [
    { subclass: 189, value: total189 },
    { subclass: 190, value: total190 },
    { subclass: 491, value: total491 }
  ];

  totalRows.forEach(({ subclass, value }) => {
    const index = totalRowsMap[subclass];
    const totalRow = [`Total Points (Subclass ${subclass})`, '', value.toString()];
    
    if (index !== null && index < rows.length) {
      // Update existing total row
      rows[index] = totalRow;
    } else {
      // Add new total row at the end
      rows.push(totalRow);
    }
  });

  return updatedTableData;
}

function markdownTableToTableData(markdown, title) {
  // Handle if markdown is undefined or not a string (e.g., object from openaiService)
  let tableString = '';
  if (typeof markdown === 'string') {
    tableString = markdown;
  } else if (markdown && typeof markdown.table === 'string') {
    tableString = markdown.table;
  } else if (markdown && typeof markdown.toString === 'function') {
    tableString = markdown.toString();
  } else {
    return { title, columns: [], rows: [] };
  }

  // Now safe to call trim, etc.
  const lines = tableString.trim().split('\n').filter(line => line.startsWith('|'));
  if (lines.length < 2) {
    return { title, columns: [], rows: [] };
  }
  const columns = lines[0].split('|').slice(1, -1).map(label => ({
    label: label.trim(), widthPercent: 0.5
  }));
  const rows = lines.slice(2).map(line =>
    line.split('|').slice(1, -1).map(cell => cell.trim())
  );
  return { title, columns, rows };
}

/**
 * Renders a section with a title and a list of bullet points parsed from markdown.
 * - Bullet lines are rendered as circles + left-aligned bold text.
 * - Both markdown string and array of lines are supported.
 *
 * @param {PDFDocument} doc - The PDFKit document.
 * @param {string|string[]} markdown - Markdown bullet list (lines starting with "- " or "* "), or array thereof.
 * @param {string} title - Section heading to display above bullets.
 */
function renderBulletSectionWithTitle(doc, markdown, title) {
  // Ensure section title is a non-empty string; fallback if needed
  const sectionTitle =
    typeof title === 'string' && title.trim().length > 0
      ? title.trim()
      : 'Snapshot';

  // Force section title to show: set new line, style, text, and update doc.y
  doc.moveDown(1);
  doc.font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#333');
  // Draw title, get where we will be after drawing title
  const titleTextHeight = doc.heightOfString(sectionTitle, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    align: 'left',
  });
  doc.text(
    sectionTitle,
    doc.page.margins.left,
    doc.y,
    {
      align: 'left',
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right
    }
  );
  doc.y += 0.5 * doc.currentLineHeight();

  // Prepare bullet lines
  let bulletLines = [];
  if (Array.isArray(markdown)) {
    bulletLines = markdown;
  } else if (typeof markdown === 'string') {
    bulletLines = markdown
      .replace(/^```(?:markdown)?/gm, '') // remove block code fences
      .replace(/```$/gm, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- ') || line.startsWith('* '));
  }

  const bulletIndent = 18;
  const leftX = doc.page.margins.left;
  doc.font('Helvetica')
    .fontSize(12)
    .fillColor('#222');

  // Set initial Y for bullets
  let bulletY = doc.y;
  const bulletSize = 4;
  const bulletLineSpacing = 7;

  for (let idx = 0; idx < bulletLines.length; idx++) {
    const line = bulletLines[idx].replace(/^[-*]\s/, '');

    // Draw the bullet circle
    doc
      .circle(leftX + bulletSize / 2, bulletY + 7, bulletSize / 2)
      .fillColor('#666')
      .fill();

    // Render bullet text
    doc
      .fillColor('#222')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(line, leftX + bulletIndent, bulletY, {
        continued: false,
        align: 'left',
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right - bulletIndent
      });

    // Advance Y position for next bullet
    const textHeight = doc.heightOfString(line, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right - bulletIndent,
      align: 'left',
      font: 'Helvetica-Bold',
      fontSize: 12
    });
    bulletY += textHeight + bulletLineSpacing;
    doc.y = bulletY;
  }
}

function addPageNumber(doc, index) {
  // (Page numbers start at 1, so index is 0-based.)
  const pageNumber = index + 1;
  const pageNumberText = `Page ${pageNumber}`;
  doc.save();
  doc.font('Helvetica')
    .fontSize(11)
    .fillColor('#888');
  const pageWidth = doc.page.width;
  const marginBottom = doc.page.margins.bottom || 36;
  // Place the page number a bit above the true bottom margin
  const yPageNum = doc.page.height - marginBottom / 2;
  const textWidth = doc.widthOfString(pageNumberText);
  const xPageNum = (pageWidth - textWidth) / 2;
  doc.text(pageNumberText, xPageNum, yPageNum, {
    lineBreak: false
  });
  doc.restore();
}

