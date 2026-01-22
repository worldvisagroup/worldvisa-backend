const logger = require('../utils/logger');

/**
    * Validate PDF generation request
 */
function validatePDFRequest(req, res, next) {
  const { userName, countries, reportData } = req.body;

  // Validate userName
  if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
    logger.warn('Invalid userName in request', { userName });
    return res.status(400).json({
      error: 'Invalid request',
      message: 'userName is required and must be a non-empty string',
    });
  }

  // Validate countries
  if (!countries || !Array.isArray(countries) || countries.length === 0) {
    logger.warn('Invalid countries in request', { countries });
    return res.status(400).json({
      error: 'Invalid request',
      message: 'countries must be a non-empty array',
    });
  }

  // Validate reportData
  if (!reportData || typeof reportData !== 'object') {
    logger.warn('Invalid reportData in request');
    return res.status(400).json({
      error: 'Invalid request',
      message: 'reportData is required and must be an object',
    });
  }

  // Normalize countries to lowercase
  const normalizedCountries = countries.map(c => c.toLowerCase());
  const isSingleCountry = normalizedCountries.length === 1;
  const isMultiCountry = normalizedCountries.length > 1;

  // Validate based on number of countries
  if (isSingleCountry) {
    // Single country: accept both old (flat) and new (nested) formats
    const country = normalizedCountries[0];
    const countryData = reportData[country] || reportData; // Support both formats
    
    const requiredFields = ['meta', 'coverPage', 'executiveSummary'];
    const missingFields = requiredFields.filter(field => !countryData[field]);
    
    if (missingFields.length > 0) {
      logger.warn('Missing required fields in reportData', { 
        missingFields,
        country,
        dataFormat: reportData[country] ? 'nested' : 'flat',
      });
      return res.status(400).json({
        error: 'Invalid report data',
        message: `Missing required fields for ${country}: ${missingFields.join(', ')}`,
      });
    }
  } else if (isMultiCountry) {
    // Multi-country: must be nested format with country keys
    const missingCountries = [];
    const countryErrors = [];
    
    normalizedCountries.forEach(country => {
      const countryData = reportData[country];
      
      if (!countryData) {
        missingCountries.push(country);
        return;
      }
      
      // Validate required fields for each country
      const requiredFields = ['meta', 'coverPage', 'executiveSummary'];
      const missingFields = requiredFields.filter(field => !countryData[field]);
      
      if (missingFields.length > 0) {
        countryErrors.push({
          country,
          missingFields,
        });
      }
    });
    
    if (missingCountries.length > 0) {
      logger.warn('Missing country data in multi-country request', { missingCountries });
      return res.status(400).json({
        error: 'Invalid report data',
        message: `Missing data for countries: ${missingCountries.join(', ')}. Multi-country reports require nested data format with country keys.`,
      });
    }
    
    if (countryErrors.length > 0) {
      const errorMessages = countryErrors.map(e => 
        `${e.country}: missing ${e.missingFields.join(', ')}`
      );
      logger.warn('Missing required fields in multi-country request', { countryErrors });
      return res.status(400).json({
        error: 'Invalid report data',
        message: `Missing required fields: ${errorMessages.join('; ')}`,
      });
    }
  }

  next();
}

module.exports = { validatePDFRequest };