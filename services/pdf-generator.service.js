const puppeteer = require("puppeteer-core");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const {
   getPuppeteerConfig,
   getPuppeteerInfo,
} = require("../utils/puppeteer-config");
const {
   TemplateNotFoundError,
   RenderError,
   PuppeteerError,
   TimeoutError,
} = require("../utils/pdf-errors");

const PDF_TIMEOUT = parseInt(process.env.PDF_TIMEOUT) || 60000;

// Lazy load templates to catch errors properly
let AustraliaReport = null;
let CanadaReport = null;
let GermanyReport = null;
let CombinedReport = null;

function loadAustraliaTemplate() {
   if (!AustraliaReport) {
      const templatePath = path.join(
         __dirname,
         "../dist/templates/australia/AustraliaReport.js"
      );
      if (!fs.existsSync(templatePath)) {
         throw new TemplateNotFoundError(templatePath);
      }
      try {
         AustraliaReport =
            require("../dist/templates/australia/AustraliaReport").AustraliaReport;
      } catch (error) {
         throw new TemplateNotFoundError(templatePath);
      }
   }
   return AustraliaReport;
}

function loadCanadaTemplate() {
   if (!CanadaReport) {
      const templatePath = path.join(
         __dirname,
         "../dist/templates/canada/CanadaReport.js"
      );
      if (!fs.existsSync(templatePath)) {
         throw new TemplateNotFoundError(templatePath);
      }
      try {
         CanadaReport =
            require("../dist/templates/canada/CanadaReport").CanadaReport;
      } catch (error) {
         throw new TemplateNotFoundError(templatePath);
      }
   }
   return CanadaReport;
}

function loadGermanyTemplate() {
   if (!GermanyReport) {
      const templatePath = path.join(
         __dirname,
         "../dist/templates/germany/GermanyReport.js"
      );
      if (!fs.existsSync(templatePath)) {
         throw new TemplateNotFoundError(templatePath);
      }
      try {
         GermanyReport =
            require("../dist/templates/germany/GermanyReport").GermanyReport;
      } catch (error) {
         throw new TemplateNotFoundError(templatePath);
      }
   }
   return GermanyReport;
}

function loadCombinedTemplate() {
   if (!CombinedReport) {
      const templatePath = path.join(
         __dirname,
         "../dist/templates/CombinedReport.js"
      );
      if (!fs.existsSync(templatePath)) {
         throw new TemplateNotFoundError(templatePath);
      }
      try {
         CombinedReport =
            require("../dist/templates/CombinedReport").CombinedReport;
      } catch (error) {
         throw new TemplateNotFoundError(templatePath);
      }
   }
   return CombinedReport;
}

// Backwards compatibility - keep old function name
function loadTemplate() {
   return loadAustraliaTemplate();
}

/**
 * Normalize report data format for backwards compatibility
 * Supports both old (flat) and new (nested) formats
 */
function normalizeReportData(countries, reportData) {
   // If single country
   if (countries.length === 1) {
      const country = countries[0].toLowerCase();

      // Check if data is already nested (new format)
      if (reportData[country]) {
         return reportData; // Already in new format
      }

      // Old format: flat structure - wrap it
      return {
         [country]: reportData,
      };
   }

   // Multi-country: must be nested format
   return reportData;
}

/**
 * Get report type based on countries
 */
function getReportType(countries) {
   if (!countries || countries.length === 0) {
      throw new Error("No countries specified");
   }
   if (countries.length === 1) {
      return "single";
   }
   return "multi";
}

/**
 * Load appropriate template based on countries
 */
function loadReportTemplate(countries) {
   const reportType = getReportType(countries);

   if (reportType === "single") {
      const country = countries[0].toLowerCase();

      if (country === "australia") {
         return loadAustraliaTemplate();
      }
      if (country === "canada") {
         return loadCanadaTemplate();
      }
      if (country === "germany") {
         return loadGermanyTemplate();
      }

      throw new Error(
         `Unknown country: ${country}. Supported countries: australia, canada, germany`
      );
   }

   // Multi-country: use CombinedReport
   return loadCombinedTemplate();
}

async function generatePDF({ userName, countries, reportData, requestId }) {
   let browser = null;
   const startTime = Date.now();
   let currentStep = "initialization";

   const logContext = requestId ? { requestId } : {};

   try {
      // Step 1: Normalize data format (backwards compatible)
      currentStep = "normalizing data";
      const normalizedData = normalizeReportData(countries, reportData);
      const reportType = getReportType(countries);

      logger.info("Data normalized", {
         ...logContext,
         reportType,
         countries,
         dataFormat:
            reportType === "single" &&
            normalizedData[countries[0].toLowerCase()]
               ? "nested"
               : "flat",
      });

      // Step 2: Load appropriate template
      currentStep = "loading template";
      const Template = loadReportTemplate(countries);
      logger.info("Template loaded successfully", {
         ...logContext,
         reportType,
         template: reportType === "single" ? countries[0] : "combined",
      });

      // Step 3: Render React component to HTML
      currentStep = "rendering HTML";
      logger.info("Rendering React component to HTML", logContext);
      const renderStartTime = Date.now();

      let html;
      try {
         // Single country: pass data directly (normalizedData[country])
         // Multi-country: pass normalizedData, countries, and userName
         if (reportType === "single") {
            const country = countries[0].toLowerCase();
            const countryData = normalizedData[country];
            const reactElement = React.createElement(Template, {
               data: countryData,
            });
            html = renderToStaticMarkup(reactElement);
         } else {
            // Multi-country: pass countries, reportData, and userName
            const reactElement = React.createElement(Template, {
               countries: countries.map((c) => c.toLowerCase()),
               reportData: normalizedData,
               userName: userName,
            });
            html = renderToStaticMarkup(reactElement);
         }
      } catch (error) {
         throw new RenderError(error.message, {
            originalError: error.message,
            reportDataKeys: Object.keys(normalizedData),
            reportType,
            countries,
         });
      }

      const renderDuration = Date.now() - renderStartTime;
      logger.info("HTML rendered", {
         ...logContext,
         htmlLength: html.length,
         renderDuration: `${renderDuration}ms`,
      });

      // Step 3: Launch Puppeteer
      currentStep = "launching browser";
      const puppeteerInfo = getPuppeteerInfo();
      logger.info("Launching Puppeteer browser", {
         ...logContext,
         pathSource: puppeteerInfo.pathSource,
         configuredPath: puppeteerInfo.configuredPath,
      });
      const launchStartTime = Date.now();

      try {
         const puppeteerConfig = getPuppeteerConfig();
         browser = await puppeteer.launch(puppeteerConfig);
      } catch (error) {
         throw new PuppeteerError(
            `Failed to launch browser: ${error.message}`,
            {
               originalError: error.message,
               puppeteerConfig: puppeteerInfo,
               hint: puppeteerInfo.usingAutoDiscovery
                  ? "Ensure Chrome or Chromium is installed on your system"
                  : `Check that the configured path exists: ${puppeteerInfo.configuredPath}`,
            }
         );
      }

      const launchDuration = Date.now() - launchStartTime;
      logger.info("Browser launched", {
         ...logContext,
         launchDuration: `${launchDuration}ms`,
      });

      const page = await browser.newPage();

      // Step 4: Set viewport for A4
      currentStep = "setting viewport";
      await page.setViewport({
         width: 794, // A4 width at 96 DPI
         height: 1123, // A4 height at 96 DPI
      });

      // Step 5: Load HTML content
      currentStep = "loading HTML content";
      const contentStartTime = Date.now();

      try {
         await page.setContent(html, {
            waitUntil: "networkidle0",
            timeout: PDF_TIMEOUT,
         });
      } catch (error) {
         if (
            error.name === "TimeoutError" ||
            error.message.includes("timeout")
         ) {
            throw new TimeoutError("loading HTML content", PDF_TIMEOUT);
         }
         throw new PuppeteerError(`Failed to load HTML: ${error.message}`);
      }

      const contentDuration = Date.now() - contentStartTime;
      logger.info("HTML loaded into browser page", {
         ...logContext,
         contentDuration: `${contentDuration}ms`,
      });

      // Step 6: Generate PDF
      currentStep = "generating PDF";
      const pdfStartTime = Date.now();

      let pdfBuffer;
      try {
         pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: false,
            margin: {
               top: "4mm",
               bottom: "0mm",
               left: "0mm",
               right: "0mm",
            },
            displayHeaderFooter: false,
            timeout: PDF_TIMEOUT,
         });
      } catch (error) {
         if (
            error.name === "TimeoutError" ||
            error.message.includes("timeout")
         ) {
            throw new TimeoutError("PDF generation", PDF_TIMEOUT);
         }
         throw new PuppeteerError(`Failed to generate PDF: ${error.message}`);
      }

      const pdfDuration = Date.now() - pdfStartTime;
      logger.info("PDF generated", {
         ...logContext,
         pdfDuration: `${pdfDuration}ms`,
      });

      await browser.close();
      browser = null;

      const duration = Date.now() - startTime;
      logger.info("PDF generated successfully", {
         ...logContext,
         duration: `${duration}ms`,
         size: `${Math.round(pdfBuffer.length / 1024)}KB`,
         breakdown: {
            render: `${renderDuration}ms`,
            launch: `${launchDuration}ms`,
            content: `${contentDuration}ms`,
            pdf: `${pdfDuration}ms`,
         },
      });

      return Buffer.from(pdfBuffer);
   } catch (error) {
      logger.error("PDF generation error", {
         ...logContext,
         error: error.message,
         errorType: error.constructor.name,
         code: error.code || "UNKNOWN",
         step: currentStep,
         stack: error.stack,
         duration: `${Date.now() - startTime}ms`,
      });

      // Cleanup browser
      if (browser) {
         try {
            await browser.close();
         } catch (closeError) {
            logger.error("Failed to close browser", {
               error: closeError.message,
            });
         }
      }

      // Re-throw custom errors as-is
      if (error.code) {
         throw error;
      }

      // Wrap unknown errors
      throw new PuppeteerError(error.message, {
         step: currentStep,
         originalError: error.message,
      });
   }
}

/**
 * Generate PDF with retry logic
 */
async function generatePDFWithRetry(options, maxRetries = 2) {
   let lastError = null;
   const logContext = options.requestId ? { requestId: options.requestId } : {};

   for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
         return await generatePDF(options);
      } catch (error) {
         lastError = error;
         logger.warn(`PDF generation attempt ${attempt}/${maxRetries} failed`, {
            ...logContext,
            error: error.message,
            errorCode: error.code,
            attempt,
         });

         if (attempt < maxRetries) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise((resolve) => setTimeout(resolve, delay));
         }
      }
   }

   throw lastError || new Error("PDF generation failed after retries");
}

function validateTemplates() {
   const templates = {
      australia: false,
      canada: false,
      germany: false,
      combined: false,
   };

   const errors = [];

   // Validate Australia template
   try {
      loadAustraliaTemplate();
      templates.australia = true;
   } catch (error) {
      errors.push(`Australia template: ${error.message}`);
   }

   // Validate Canada template
   try {
      loadCanadaTemplate();
      templates.canada = true;
   } catch (error) {
      errors.push(`Canada template: ${error.message}`);
   }

   // Validate Germany template
   try {
      loadGermanyTemplate();
      templates.germany = true;
   } catch (error) {
      errors.push(`Germany template: ${error.message}`);
   }

   // Validate Combined template
   try {
      loadCombinedTemplate();
      templates.combined = true;
   } catch (error) {
      errors.push(`Combined template: ${error.message}`);
   }

   const allValid =
      templates.australia &&
      templates.canada &&
      templates.germany &&
      templates.combined;

   if (allValid) {
      logger.info("All PDF templates validated successfully", { templates });
      return true;
   } else {
      logger.error("PDF template validation failed", {
         templates,
         errors,
      });
      return false;
   }
}

module.exports = {
   generatePDF,
   generatePDFWithRetry,
   validateTemplates,
};
