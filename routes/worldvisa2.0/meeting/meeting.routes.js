const express = require('express');
const crypto = require('crypto');
const logger = require('../../../utils/logger');
const { apiKeyMiddleware } = require('../../../utils/helperFunction');
const { validateMeetingBooking } = require('../../../middleware/meeting.validation.middleware');
const { scheduleMeeting } = require('../../../controllers/meetingBookingController');
const { handleZohoCallback } = require('../../../controllers/meetingWebhookCallbackController');

const router = express.Router();

/**
 * Middleware to generate request ID for tracking
 */
router.use((req, res, next) => {
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

/**
 * POST /api/worldvisaV2/schedule-meeting
 * 
 * Schedule a Zoho meeting
 * 
 * @route POST /api/worldvisaV2/schedule-meeting
 * @access Private (requires API key)
 
 * @example
 * // Request
 * POST /api/worldvisaV2/schedule-meeting
 * {
 *   "usersName": "John Doe",
 *   "preferredDate": "2024-12-25",
 *   "preferredTime": "10:30",
 *   "phoneNumber": "+1234567890",
 *   "email": "john@example.com",
 *   "source": "website"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "meetingUrl": "https://meet.zoho.com/mock-abc123xyz",
 *   "requestId": "a1b2c3d4e5f6",
 *   "timestamp": "2024-12-25T10:30:00.000Z"
 * }
 */
router.post('/', apiKeyMiddleware, validateMeetingBooking, scheduleMeeting);

/**
 * POST /api/worldvisaV2/schedule-meeting/webhook
 * 
 * Webhook callback endpoint for Zoho meeting creation
 * 
 * @route POST /api/worldvisaV2/schedule-meeting/webhook
 * @access Public (secured by HMAC signature validation)
 * 
 * @body {string} requestId - Original request ID from booking
 * @body {string} status - 'success' | 'failed'
 * @body {string} meetingUrl - Meeting URL (if success)
 * @body {string} errorMessage - Error message (if failed)
 * @body {string} timestamp - Callback timestamp
 * 
 * @header {string} X-Zoho-Signature - HMAC-SHA256 signature for authentication
 * 
 * @returns {object} 200 - Callback received
 * @returns {object} 401 - Invalid signature
 * 
 * @example
 * // Request
 * POST /api/worldvisaV2/schedule-meeting/webhook
 * Headers: { "X-Zoho-Signature": "abc123..." }
 * {
 *   "requestId": "a1b2c3d4e5f6",
 *   "status": "success",
 *   "meetingUrl": "https://meet.zoho.com/abc123xyz",
 *   "timestamp": "2024-12-25T10:30:00.000Z"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "message": "Webhook received",
 *   "requestId": "a1b2c3d4e5f6"
 * }
 */
router.post('/webhook', handleZohoCallback);

/**
 * Health check endpoint for meeting booking service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'meeting-booking',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

module.exports = router;

