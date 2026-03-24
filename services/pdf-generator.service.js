const FormData = require("form-data");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const {
   TemplateNotFoundError,
   RenderError,
   PuppeteerError,
   TimeoutError,
} = require("../utils/pdf-errors");

const GOTENBERG_URL = process.env.GOTENBERG_API_URL || "http://localhost:3000";

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


function injectGeneratedDate(normalizedData) {
   const generatedDateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
   });
   for (const key of Object.keys(normalizedData)) {
      if (normalizedData[key] && normalizedData[key].meta) {
         normalizedData[key].meta.generatedDate = generatedDateStr;
      }
   }
   return normalizedData;
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
   const startTime = Date.now();
   let currentStep = "initialization";

   const logContext = requestId ? { requestId } : {};

   try {
      // Step 1: Normalize data format (backwards compatible)
      currentStep = "normalizing data";
      const normalizedData = normalizeReportData(countries, reportData);
      injectGeneratedDate(normalizedData);
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

      // Step 3: Send HTML to Gotenberg for PDF generation
      currentStep = "sending to gotenberg";
      logger.info("Sending HTML to Gotenberg", {
         ...logContext,
         htmlLength: html.length,
         gotenbergUrl: GOTENBERG_URL,
      });
      const pdfStartTime = Date.now();

      const form = new FormData();
      form.append("files", Buffer.from(html), {
         filename: "index.html",
         contentType: "text/html",
      });
      // A4 paper size in inches
      form.append("paperWidth", "8.27");
      form.append("paperHeight", "11.69");
      // Match existing margins: top 4mm (~0.16in), rest 0
      form.append("marginTop", "0.16");
      form.append("marginBottom", "0");
      form.append("marginLeft", "0");
      form.append("marginRight", "0");
      form.append("printBackground", "true");
      // Allow time for Cloudinary images to load
      form.append("waitDelay", "1s");

      let gotoRes;
      try {
         gotoRes = await fetch(
            `${GOTENBERG_URL}/forms/chromium/convert/html`,
            {
               method: "POST",
               body: form,
               headers: form.getHeaders(),
               signal: AbortSignal.timeout(PDF_TIMEOUT),
            }
         );
      } catch (error) {
         if (
            error.name === "TimeoutError" ||
            error.message.includes("timeout")
         ) {
            throw new TimeoutError("Gotenberg PDF conversion", PDF_TIMEOUT);
         }
         throw new PuppeteerError(
            `Failed to reach Gotenberg: ${error.message}`,
            {
               hint: `Check GOTENBERG_API_URL env var (currently: ${GOTENBERG_URL})`,
            }
         );
      }

      if (!gotoRes.ok) {
         const errText = await gotoRes.text();
         throw new PuppeteerError(
            `Gotenberg conversion failed (${gotoRes.status}): ${errText}`
         );
      }

      let pdfBuffer = Buffer.from(await gotoRes.arrayBuffer());

      const pdfDuration = Date.now() - pdfStartTime;
      logger.info("PDF generated via Gotenberg", {
         ...logContext,
         pdfDuration: `${pdfDuration}ms`,
      });

      const duration = Date.now() - startTime;
      logger.info("PDF generated successfully", {
         ...logContext,
         duration: `${duration}ms`,
         size: `${Math.round(pdfBuffer.length / 1024)}KB`,
         breakdown: {
            render: `${renderDuration}ms`,
            pdf: `${pdfDuration}ms`,
         },
      });

      return pdfBuffer;
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
