const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Normalize date and time to ISO format
 * Handles both ISO 8601 and separate date/time formats
 */
const normalizeDateTime = (date, time) => {
  try {
    if (date.includes('T')) {
      return new Date(date).toISOString();
    }
    
    let normalizedTime = time;
    const timeParts = time.split(':');
    if (timeParts.length === 2) {
      normalizedTime = `${time}:00`;
    } else if (timeParts.length === 3) {
      const seconds = timeParts[2];
      if (!seconds.includes('.')) {
        normalizedTime = time; 
      }
    }
    
    const combinedDateTime = `${date}T${normalizedTime}`;
    const normalized = new Date(combinedDateTime);
    
    if (isNaN(normalized.getTime())) {
      throw new Error('Invalid date/time combination');
    }
    
    return normalized.toISOString();
  } catch (error) {
    throw new Error(`Failed to normalize date/time: ${error.message}`);
  }
};

/**
 * Schedule a meeting
 * POST /api/worldvisaV2/schedule-meeting
 */
const scheduleMeeting = async (req, res) => {
  const startTime = Date.now();
  const requestId = req.requestId || crypto.randomBytes(8).toString('hex');
  
  try {
    const {
      usersName,
      preferredDate,
      preferredTime,
      phoneNumber,
      email,
      source
    } = req.body;

    const normalizedDateTime = normalizeDateTime(preferredDate, preferredTime);

    const bookingData = {
      requestId,
      usersName,
      preferredDate: normalizedDateTime,
      preferredTime,
      phoneNumber,
      email,
      source: source || 'unknown',
      normalizedDateTime
    };

    logger.info('Meeting booking requested', {
      requestId,
      usersName,
      email,
      phoneNumber,
      preferredDate: normalizedDateTime,
      source: bookingData.source,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Call own webhook endpoint (fire-and-forget, non-blocking)
    // Webhook handler will trigger Zoho meeting creation
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/worldvisaV2/schedule-meeting/webhook`;
    
    axios.post(webhookUrl, {
      action: 'create_meeting',
      ...bookingData
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      logger.warn('Webhook trigger failed - continuing anyway', {
        requestId,
        error: err.message,
        webhookUrl
      });
    });

    const duration = Date.now() - startTime;

    // Always return async response - meetingUrl will come via webhook callback
    res.status(200).json({
      success: true,
      status: 'processing',
      requestId,
      timestamp: new Date().toISOString()
    });

    logger.info('Meeting booking request accepted - processing asynchronously', {
      requestId,
      email,
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Meeting booking request failed', {
      requestId,
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack,
      duration: `${duration}ms`,
      email: req.body?.email,
      ip: req.ip
    });

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    
    if (error.message.includes('normalize') || error.message.includes('Invalid')) {
      statusCode = 400; // Bad Request
      errorCode = 'INVALID_DATE_TIME';
    }

    const errorResponse = {
      success: false,
      error: errorCode,
      message: error.message,
      requestId
    };

    res.status(statusCode).json(errorResponse);
  }
};

module.exports = {
  scheduleMeeting
};

