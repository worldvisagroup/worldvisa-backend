const express = require('express');
const { generatePDFWithRetry, validateTemplates } = require('../../../services/pdf-generator.service');
const { validatePDFRequest } = require('../../../middleware/pdfvalidation.middleware');
const logger = require('../../../utils/logger');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getPuppeteerConfig, getPuppeteerInfo, validatePuppeteerConfig } = require('../../../utils/puppeteer-config');

const router = express.Router();

// Middleware to generate request ID
router.use((req, res, next) => {
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

/**
 * GET /health
 * Health check endpoint for PDF generation service
 * 
 * Returns:
 * {
 *   status: 'healthy' | 'unhealthy',
 *   timestamp: string,
 *   checks: {
 *     templates: boolean,
 *     puppeteer: boolean,
 *     distFolder: boolean
 *   },
 *   version: string
 * }
 */
router.get('/health', async (req, res) => {
  const checks = {
    templates: false,
    puppeteer: false,
    distFolder: false,
  };

  let overallStatus = 'healthy';
  const errors = [];

  try {
    // Check 1: Validate dist folder exists
    const distPath = path.join(__dirname, '../../../dist');
    checks.distFolder = fs.existsSync(distPath);
    if (!checks.distFolder) {
      errors.push('dist folder not found - run "npm run build:templates"');
      overallStatus = 'unhealthy';
    }

    // Check 2: Validate templates can be loaded
    checks.templates = validateTemplates();
    if (!checks.templates) {
      errors.push('Templates validation failed');
      overallStatus = 'unhealthy';
    }

    // Check 3: Verify Puppeteer configuration and launch
    let puppeteerInfo = null;
    let puppeteerValidation = { valid: false, warnings: [], errors: [] };
    
    try {
      puppeteerInfo = getPuppeteerInfo();
      puppeteerValidation = validatePuppeteerConfig();
      
      // Add configuration validation warnings
      if (puppeteerValidation.warnings.length > 0) {
        logger.warn('Puppeteer configuration warnings', {
          warnings: puppeteerValidation.warnings,
        });
      }
    } catch (error) {
      logger.error('Failed to get Puppeteer info', { error: error.message });
      errors.push(`Puppeteer configuration check failed: ${error.message}`);
      overallStatus = 'unhealthy';
      puppeteerInfo = { error: error.message, hint: 'Check Puppeteer configuration' };
    }

    try {
      if (!puppeteerInfo || puppeteerInfo.error) {
        throw new Error(puppeteerInfo?.error || 'Puppeteer info not available');
      }
      
      const puppeteerConfig = getPuppeteerConfig();
      const browser = await puppeteer.launch({
        ...puppeteerConfig,
        timeout: 10000,
      });
      
      // Get actual executable path from browser
      const browserVersion = await browser.version();
      await browser.close();
      
      checks.puppeteer = true;
      checks.puppeteerConfig = {
        usingPuppeteerCore: puppeteerInfo.usingPuppeteerCore,
        pathSource: puppeteerInfo.pathSource,
        chromePath: puppeteerInfo.chromePath,
        pathExists: puppeteerInfo.pathExists,
        environment: puppeteerInfo.environment,
        isHeroku: puppeteerInfo.isHeroku,
        browserVersion,
      };

      if (puppeteerValidation.warnings.length > 0) {
        checks.puppeteerConfig.warnings = puppeteerValidation.warnings;
      }

    } catch (error) {
      checks.puppeteer = false;
      checks.puppeteerConfig = {
        usingPuppeteerCore: puppeteerInfo?.usingPuppeteerCore || false,
        pathSource: puppeteerInfo?.pathSource || 'unknown',
        chromePath: puppeteerInfo?.chromePath || null,
        pathExists: puppeteerInfo?.pathExists || false,
        environment: puppeteerInfo?.environment || 'unknown',
        isHeroku: puppeteerInfo?.isHeroku || false,
        error: error.message,
      };
      errors.push(`Puppeteer launch failed: ${error.message}`);
      
      // Add helpful hints based on the configuration
      if (puppeteerInfo?.hint) {
        errors.push(`Hint: ${puppeteerInfo.hint}`);
      }
      
      // Add validation errors if any
      if (puppeteerValidation?.errors && puppeteerValidation.errors.length > 0) {
        errors.push(...puppeteerValidation.errors);
      }
      
      overallStatus = 'unhealthy';
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      version: require('../../../package.json').version || '1.0.0',
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);

    logger.info('Health check completed', { status: overallStatus, checks });

  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks,
    });
  }
});


router.post('/generate-pdf', validatePDFRequest, async (req, res) => {
  const startTime = Date.now();
  const { userName, countries, reportData } = req.body;
  const requestId = req.requestId;

  try {
    const reportType = countries.length === 1 ? 'single' : 'multi';
    const normalizedCountries = countries.map(c => c.toLowerCase());
    
    logger.info('PDF generation requested', { 
      requestId,
      userName, 
      countries: normalizedCountries,
      reportType,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      reportDataSize: JSON.stringify(reportData).length,
    });

    // Generate PDF with retry logic (max 2 retries)
    const pdfBuffer = await generatePDFWithRetry({
      userName,
      countries: normalizedCountries,
      reportData,
      requestId,
    }, 2);

    const duration = Date.now() - startTime;
    const sizeKB = Math.round(pdfBuffer.length / 1024);

    logger.info('PDF generated successfully', {
      requestId,
      userName,
      reportType,
      countries: normalizedCountries,
      duration: `${duration}ms`,
      size: `${sizeKB}KB`,
      throughput: `${(sizeKB / (duration / 1000)).toFixed(2)} KB/s`,
    });

    // Generate filename based on report type
    let filename;
    if (reportType === 'single') {
      filename = `worldvisa-${normalizedCountries[0]}-report-${Date.now()}.pdf`;
    } else {
      filename = `worldvisa-${normalizedCountries.join('-')}-report-${Date.now()}.pdf`;
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Report-Type', reportType);
    res.setHeader('X-Countries', normalizedCountries.join(','));
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Generation-Time', `${duration}ms`);
    res.setHeader('X-PDF-Size', `${sizeKB}KB`);
    res.setHeader('X-Max-Retries', '2');
    res.setHeader('X-Request-ID', requestId);

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('PDF generation failed', {
      requestId,
      error: error.message,
      errorType: error.constructor.name,
      code: error.code || 'UNKNOWN',
      stack: error.stack,
      duration: `${duration}ms`,
      userName,
      countries,
      ip: req.ip,
      details: error.details || {},
    });

    // Determine status code based on error type
    let statusCode = 500;
    if (error.code === 'VALIDATION_ERROR') {
      statusCode = 400;
    } else if (error.code === 'TEMPLATE_NOT_FOUND') {
      statusCode = 503; // Service unavailable
    } else if (error.code === 'TIMEOUT_ERROR') {
      statusCode = 504; // Gateway timeout
    }

    // Send error response
    const errorResponse = {
      error: error.name || 'PDFGenerationError',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      duration: `${duration}ms`,
      requestId,
    };

    // Include details and hints if available
    if (error.details) {
      errorResponse.details = error.details;
    }

    res.status(statusCode).json(errorResponse);
  }
});

module.exports = router;