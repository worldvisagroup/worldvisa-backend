const crypto = require('crypto');
const logger = require('./logger');

const generateZohoSignature = (payload, secret) => {
  try {
    if (!secret) {
      throw new Error('Webhook secret is required for signature generation');
    }

    // Convert payload to canonical JSON string (sorted keys for consistency)
    const sortKeys = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;
      if (Array.isArray(obj)) return obj.map(sortKeys);
      
      return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
          result[key] = sortKeys(obj[key]);
          return result;
        }, {});
    };
    
    const sortedPayload = sortKeys(payload);
    const payloadString = JSON.stringify(sortedPayload);
    
    // Create HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    
    return hmac.digest('hex');
  } catch (error) {
    logger.error('Failed to generate webhook signature', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Validate HMAC-SHA256 signature for incoming webhook
 * Uses constant-time comparison to prevent timing attacks
 * 
 */
const validateZohoSignature = (payload, receivedSignature, secret) => {
  try {
    if (!secret) {
      logger.error('Webhook secret not configured');
      return false;
    }

    if (!receivedSignature) {
      logger.error('No signature provided in webhook request');
      return false;
    }

    // Generate expected signature
    const expectedSignature = generateZohoSignature(payload, secret);
    
    // Use constant-time comparison to prevent timing attacks
    // crypto.timingSafeEqual requires equal-length buffers
    if (expectedSignature.length !== receivedSignature.length) {
      return false;
    }

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(receivedSignature);
    
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    logger.error('Signature validation error', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

module.exports = {
  generateZohoSignature,
  validateZohoSignature
};

