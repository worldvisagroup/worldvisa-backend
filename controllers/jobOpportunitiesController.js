const openaiService = require('../services/openaiService');
const { createProfessionalEmail } = require('../utils/helperFunction');

/**
 * Generate job opportunity content - immediate response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateJobOpportunityContent = async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  
  try {
    const { country, occupation, clientName } = req.body;
    
    console.log(`[${new Date().toISOString()}] Request from ${clientIP}: ${country} - ${occupation}`);
    
    // Generate content using OpenAI with performance optimizations
    const content = await openaiService.generateJobOpportunityContent({
      country,
      occupation,
      clientName: clientName || null,
      clientIP
    });
    
    const processingTime = Date.now() - startTime;
    
    // Return immediate response with just the email body content
    res.json({
      message: "Success",
      content: content,
      metadata: {
        country,
        occupation,
        clientName: clientName || null,
        generatedAt: new Date().toISOString(),
        processingTimeMs: processingTime,
        clientIP: clientIP.replace(/\./g, 'x') // Mask IP for privacy
      }
    });
    
    console.log(`[${new Date().toISOString()}] Success for ${clientIP}: ${processingTime}ms`);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error for ${clientIP} (${processingTime}ms):`, error.message);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    if (error.message.includes('Rate limit exceeded')) {
      statusCode = 429;
    } else if (error.message.includes('Service temporarily unavailable')) {
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
    }
    
    res.status(statusCode).json({
      message: "Failed to generate content",
      error: error.message,
      metadata: {
        processingTimeMs: processingTime,
        clientIP: clientIP.replace(/\./g, 'x'),
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Health check endpoint for monitoring service status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHealthStatus = async (req, res) => {
  try {
    const healthStatus = openaiService.getHealthStatus();
    
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "AI Job Opportunities",
      details: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * Clear cache endpoint for maintenance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clearCache = async (req, res) => {
  try {
    openaiService.clearCache();
    
    res.json({
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to clear cache",
      error: error.message
    });
  }
};

module.exports = {
  generateJobOpportunityContent,
  getHealthStatus,
  clearCache
};
