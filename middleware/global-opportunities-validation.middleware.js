const logger = require('../utils/logger');

const SUPPORTED_COUNTRIES = ['australia', 'canada', 'germany'];

/**
 * Validate Global Opportunities report generation request.
 */
function validateGlobalOpportunitiesRequest(req, res, next) {
  const { personalInfo, resumeText, countries } = req.body;

  if (!personalInfo || typeof personalInfo !== 'object' || !personalInfo.name || !personalInfo.dob) {
    logger.warn('Invalid personalInfo in Global Opportunities request', { personalInfo });
    return res.status(400).json({
      error: 'Invalid request',
      message: 'personalInfo (with name and dob) is required',
    });
  }

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
    logger.warn('Invalid resumeText in Global Opportunities request');
    return res.status(400).json({
      error: 'Invalid request',
      message: 'resumeText is required and must be a non-empty string',
    });
  }

  if (!countries || !Array.isArray(countries) || countries.length === 0) {
    logger.warn('Invalid countries in Global Opportunities request', { countries });
    return res.status(400).json({
      error: 'Invalid request',
      message: 'countries must be a non-empty array',
    });
  }

  const normalizedCountries = countries.map((c) => String(c).toLowerCase());
  const unsupported = normalizedCountries.filter((c) => !SUPPORTED_COUNTRIES.includes(c));
  if (unsupported.length > 0) {
    logger.warn('Unsupported countries in Global Opportunities request', { unsupported });
    return res.status(400).json({
      error: 'Invalid request',
      message: `Unsupported countries: ${unsupported.join(', ')}. Supported: ${SUPPORTED_COUNTRIES.join(', ')}`,
    });
  }

  if (req.body.spouseInfo !== undefined && (typeof req.body.spouseInfo !== 'object' || req.body.spouseInfo === null)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'spouseInfo, if provided, must be an object',
    });
  }

  if (req.body.visaProfileInfo !== undefined && (typeof req.body.visaProfileInfo !== 'object' || req.body.visaProfileInfo === null)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'visaProfileInfo, if provided, must be an object',
    });
  }

  next();
}

module.exports = { validateGlobalOpportunitiesRequest, SUPPORTED_COUNTRIES };
