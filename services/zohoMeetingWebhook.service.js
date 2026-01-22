const axios = require('axios');
const logger = require('../utils/logger');
const { generateZohoSignature } = require('../utils/webhookSignature');

const triggerDevCallback = async (bookingData) => {
  const port = process.env.PORT || 3000;
  const callbackUrl = `http://localhost:${port}/api/worldvisaV2/schedule-meeting/webhook`;
  const secret = process.env.ZOHO_WEBHOOK_SECRET;

  logger.info('Dev webhook simulator triggered', {
    requestId: bookingData.requestId,
    email: bookingData.email,
    callbackUrl
  });

  // Simulate async processing delay (1-2 seconds)
  const delay = 1000 + Math.random() * 1000; // 1-2 seconds
  
  setTimeout(async () => {
    try {
      // Simulate Zoho's response payload
      const payload = {
        requestId: bookingData.requestId,
        status: 'success',
        meetingUrl: `https://meet.zoho.com/dev-simulated-${bookingData.requestId}`,
        timestamp: new Date().toISOString()
      };

      // Generate authentic HMAC signature for testing
      const signature = secret ? generateZohoSignature(payload, secret) : 'dev-no-secret';

      logger.info('Dev simulator calling webhook callback', {
        requestId: bookingData.requestId,
        delay: `${Math.round(delay)}ms`,
        hasSignature: !!secret,
        generatedSignature: signature,
        payload: JSON.stringify(payload)
      });

      // Call the webhook callback endpoint
      await axios.post(callbackUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Zoho-Signature': signature,
          'User-Agent': 'Dev-Webhook-Simulator/1.0'
        },
        timeout: 5000
      });

      logger.info('Dev simulator callback completed', {
        requestId: bookingData.requestId
      });

    } catch (error) {
      logger.error('Dev simulator callback failed', {
        requestId: bookingData.requestId,
        error: error.message,
        callbackUrl
      });
    }
  }, delay);
};

module.exports = {
  triggerDevCallback
};

