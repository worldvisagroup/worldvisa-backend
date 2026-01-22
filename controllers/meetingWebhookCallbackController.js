const axios = require('axios');
const logger = require('../utils/logger');
const { validateZohoSignature } = require('../utils/webhookSignature');
const { triggerDevCallback } = require('../services/zohoMeetingWebhook.service');

/**
 * Handle meeting webhook requests
 * POST /api/worldvisaV2/schedule-meeting/webhook
 * 
 * This endpoint handles two cases:
 * 1. Backend calling to create meeting (action: 'create_meeting')
 * 2. Zoho calling back with meeting URL (status: 'success'/'failed')
 */
const handleZohoCallback = async (req, res) => {
  const payload = req.body;
  const requestId = payload.requestId || 'unknown';

  // CASE 1: Backend calling to create meeting
  if (payload.action === 'create_meeting') {
    return handleCreateMeetingRequest(req, res, payload);
  }

  // CASE 2: Zoho calling back with meeting URL
  if (payload.status === 'success' || payload.status === 'failed') {
    return handleZohoCallbackResponse(req, res, payload);
  }

  // Unknown action/format
  logger.warn('Unknown webhook payload format', {
    requestId,
    payloadKeys: Object.keys(payload),
    ip: req.ip
  });

  return res.status(400).json({
    success: false,
    error: 'Unknown action or invalid payload format',
    requestId
  });
};

/**
 * Handle meeting creation request from backend
 * Triggers Zoho Deluge function or dev simulator
 */
const handleCreateMeetingRequest = async (req, res, payload) => {
  const requestId = payload.requestId || 'unknown';
  const startTime = Date.now();

  try {
    logger.info('Meeting creation request received', {
      requestId,
      email: payload.email,
      ip: req.ip
    });

    // Return immediately (non-blocking)
    res.status(200).json({
      success: true,
      message: 'Meeting creation triggered',
      requestId
    });

    const webhookUrl = process.env.ZOHO_MEETING_WEBHOOK_URL;

    // Development mode: no URL set or localhost
    if (!webhookUrl || webhookUrl.includes('localhost') || webhookUrl.includes('127.0.0.1')) {
      logger.info('Using dev webhook simulator', { requestId });
      
      // Trigger dev simulator (fire-and-forget)
      triggerDevCallback({
        requestId: payload.requestId,
        usersName: payload.usersName,
        normalizedDateTime: payload.normalizedDateTime,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        source: payload.source
      });
    } else {
      // Production mode: call Zoho Deluge function
      logger.info('Calling Zoho Deluge function', {
        requestId,
        webhookUrl: webhookUrl.substring(0, 50) + '...'
      });

      const zohoPayload = {
        requestId: payload.requestId,
        usersName: payload.usersName,
        normalizedDateTime: payload.normalizedDateTime,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        source: payload.source || 'unknown'
      };

      // Fire-and-forget call to Zoho
      axios.post(webhookUrl, zohoPayload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WorldVisaGroup-API/2.0'
        }
      }).then(response => {
        const duration = Date.now() - startTime;
        logger.info('Zoho Deluge function called successfully', {
          requestId,
          responseTime: `${duration}ms`,
          statusCode: response.status
        });
      }).catch(error => {
        const duration = Date.now() - startTime;
        logger.warn('Zoho Deluge function call failed', {
          requestId,
          error: error.message,
          errorCode: error.code,
          duration: `${duration}ms`,
          timeout: error.code === 'ECONNABORTED'
        });
      });
    }

  } catch (error) {
    logger.error('Error handling meeting creation request', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    // Already sent response, so just log
  }
};

/**
 * Handle Zoho callback response (meeting created)
 * POST /api/worldvisaV2/schedule-meeting/webhook
 * 
 * This endpoint receives callbacks from Zoho after meeting creation
 * It's purely for observability - validates, logs, and returns 200
 * 
 * Expected payload:
 * {
 *   requestId: string,
 *   status: 'success' | 'failed',
 *   meetingUrl?: string,
 *   errorMessage?: string,
 *   timestamp?: string
 * }
 * 
 * Expected header:
 * X-Zoho-Signature: HMAC-SHA256 signature
 */
const handleZohoCallbackResponse = async (req, res) => {
  const startTime = Date.now();
  const signature = req.headers['x-zoho-signature'];
  const payload = req.body;
  const requestId = payload.requestId || 'unknown';

  try {
    logger.info('Zoho webhook callback received', {
      requestId,
      hasSignature: !!signature,
      status: payload.status,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Validate webhook secret is configured
    const secret = process.env.ZOHO_WEBHOOK_SECRET;
    if (!secret) {
      logger.error('Webhook callback received but ZOHO_WEBHOOK_SECRET not configured', {
        requestId,
        ip: req.ip
      });
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured',
        requestId
      });
    }

    // Validate signature
    const isValidSignature = validateZohoSignature(payload, signature, secret);
    
    if (!isValidSignature) {
      // Debug logging for signature mismatch
      const { generateZohoSignature } = require('../utils/webhookSignature');
      const expectedSignature = generateZohoSignature(payload, secret);
      
      // Direct console output for debugging
      console.log('\n🔴 SIGNATURE VALIDATION FAILED:');
      console.log('Received signature:', signature);
      console.log('Expected signature:', expectedSignature);
      console.log('Match:', signature === expectedSignature);
      console.log('Payload:', JSON.stringify(payload));
      console.log('Secret exists:', !!secret);
      console.log('\n');
      
      logger.error('Zoho callback signature validation failed', {
        requestId,
        ip: req.ip,
        hasSignature: !!signature,
        receivedSignature: signature,
        expectedSignature: expectedSignature,
        payloadKeys: Object.keys(payload),
        payload: JSON.stringify(payload)
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
        requestId
      });
    }

    // Signature valid - log the result
    const duration = Date.now() - startTime;

    if (payload.status === 'success') {
      logger.info('Zoho meeting created successfully via webhook', {
        requestId,
        meetingUrl: payload.meetingUrl,
        timestamp: payload.timestamp,
        duration: `${duration}ms`
      });
    } else if (payload.status === 'failed') {
      logger.error('Zoho meeting creation failed via webhook', {
        requestId,
        errorMessage: payload.errorMessage,
        timestamp: payload.timestamp,
        duration: `${duration}ms`
      });
    } else {
      logger.warn('Zoho callback received with unknown status', {
        requestId,
        status: payload.status,
        payload: JSON.stringify(payload),
        duration: `${duration}ms`
      });
    }

    // Always return 200 for valid signatures (idempotent)
    // This prevents Zoho from retrying the webhook
    res.status(200).json({
      success: true,
      message: 'Webhook received',
      requestId
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Webhook callback processing error', {
      requestId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      ip: req.ip
    });

    // Even on error, return 200 if signature was valid
    // This prevents retry storms
    res.status(200).json({
      success: true,
      message: 'Webhook received with processing error',
      requestId
    });
  }
};

module.exports = {
  handleZohoCallback
};

