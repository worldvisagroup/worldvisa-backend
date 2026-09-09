const express = require('express');
const crypto = require('crypto');
const logger = require('../../../utils/logger');
const { validateGlobalOpportunitiesRequest } = require('../../../middleware/global-opportunities-validation.middleware');
const { buildAndRenderGlobalOpportunitiesReport } = require('../../../services/global-opportunities-content.service');
const { processGoReportJob } = require('../../../workers/goReportWorker');

const router = express.Router();

function apiTokenAuth(req, res, next) {
  const token = req.headers['x-api-token'];
  if (!token || token !== process.env.GO_REPORT_API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API token' });
  }
  next();
}

router.use((req, res, next) => {
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

router.post('/generate-report', apiTokenAuth, validateGlobalOpportunitiesRequest, async (req, res) => {
  const startTime = Date.now();
  const { personalInfo, spouseInfo, visaProfileInfo, resumeText, countries } = req.body;
  const requestId = req.requestId;

  try {
    const normalizedCountries = countries.map((c) => c.toLowerCase());

    logger.info('Global Opportunities report generation requested', {
      requestId,
      userName: personalInfo.name,
      countries: normalizedCountries,
      hasSpouseInfo: !!spouseInfo,
      hasVisaProfileInfo: !!visaProfileInfo,
    });

    const pdfBuffer = await buildAndRenderGlobalOpportunitiesReport({
      personalInfo,
      spouseInfo,
      visaProfileInfo,
      resumeText,
      countries: normalizedCountries,
      requestId,
    });

    const duration = Date.now() - startTime;
    const sizeKB = Math.round(pdfBuffer.length / 1024);

    logger.info('Global Opportunities report generated successfully', {
      requestId,
      userName: personalInfo.name,
      countries: normalizedCountries,
      duration: `${duration}ms`,
      size: `${sizeKB}KB`,
    });

    const sanitizedName = personalInfo.name
      .replace(/[<>:"/\\|?*]+/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    const filename = `global-opportunities-${normalizedCountries.join('-')}-${sanitizedName || 'report'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('X-Countries', normalizedCountries.join(','));
    res.setHeader('X-Generation-Time', `${duration}ms`);
    res.send(pdfBuffer);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Global Opportunities report generation failed', {
      requestId,
      error: error.message,
      errorType: error.constructor.name,
      code: error.code || 'UNKNOWN',
      stack: error.stack,
      duration: `${duration}ms`,
      countries,
    });

    let statusCode = 500;
    if (error.code === 'VALIDATION_ERROR') {
      statusCode = 400;
    } else if (error.code === 'TEMPLATE_NOT_FOUND') {
      statusCode = 503;
    } else if (error.code === 'TIMEOUT_ERROR') {
      statusCode = 504;
    }

    res.status(statusCode).json({
      error: error.name || 'GlobalOpportunitiesGenerationError',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      duration: `${duration}ms`,
      requestId,
    });
  }
});

router.post('/generate-report/start', apiTokenAuth, validateGlobalOpportunitiesRequest, (req, res) => {
  const requestId = req.requestId;
  const { personalInfo, spouseInfo, visaProfileInfo, resumeText, countries, versionId, organizationId, callbackUrl } = req.body;

  if (!versionId || typeof versionId !== 'string') {
    return res.status(400).json({ error: 'Invalid request', message: 'versionId is required' });
  }
  if (!organizationId || typeof organizationId !== 'string') {
    return res.status(400).json({ error: 'Invalid request', message: 'organizationId is required' });
  }
  if (!callbackUrl || typeof callbackUrl !== 'string') {
    return res.status(400).json({ error: 'Invalid request', message: 'callbackUrl is required' });
  }

  const normalizedCountries = countries.map((c) => c.toLowerCase());

  logger.info('Global Opportunities async report generation requested', {
    requestId,
    versionId,
    userName: personalInfo.name,
    countries: normalizedCountries,
  });

  setImmediate(() => {
    processGoReportJob({
      requestId,
      versionId,
      organizationId,
      callbackUrl,
      personalInfo,
      spouseInfo,
      visaProfileInfo,
      resumeText,
      countries: normalizedCountries,
    });
  });

  res.status(202).json({ requestId });
});

module.exports = router;
