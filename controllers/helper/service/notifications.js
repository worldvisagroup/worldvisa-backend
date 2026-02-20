const logger = require('../../../utils/logger');

/**
 * Helper to add a notification and trigger websocket.
 * @param {Object} params
 * @param {Object} params.req - Express request object (must have req.app and req.user)
 * @param {String} params.message - Notification message (detail)
 * @param {String} [params.title] - Short text for toaster/notification chip
 * @param {String} [params.type='info'] - Notification type
 * @param {String} [params.category='general'] - Notification category
 * @param {String} [params.source='general'] - Origin: document_review, requested_reviews, quality_check, requested_checklist, general
 * @param {String|null} [params.link=null] - Optional link
 * @returns {Promise<Object>} - The created notification document
 */
async function addNotificationAndEmit({
  req,
  leadId = null,
  documentId = null,
  userId,
  message,
  title = null,
  type = 'info',
  category = 'general',
  source = 'general',
  link = null,
  documentName = '',
  applicationType = 'Visa_Applications',
}) {
  const ZohoDmsNotification = require('../../../models/zohoDmsNotification');

  try {
    const notification = new ZohoDmsNotification({
      user: userId,
      message,
      title: title || undefined,
      type,
      link,
      category,
      source,
      leadId,
      documentId,
      documentName,
      applicationType,
    });

    await notification.save();

    try {
      const io = req.app.get('io');
      const notificationPayload = {
        _id: notification._id,
        title: notification.title ?? null,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        source: notification.source ?? 'general',
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        link: notification.link ?? null,
        leadId: notification.leadId ?? null,
        documentId: notification.documentId ?? null,
        documentName: notification.documentName ?? null,
        applicationType: notification.applicationType ?? null,
      };

      io?.to(`user:${userId}`).emit('notification:new', notificationPayload);
    } catch (err) {
      logger.warn('WebSocket emit failed for notification', { error: err?.message, userId });
    }

    return notification;
  } catch (error) {
    logger.error('Error adding notification', { error: error?.message, userId });
    throw error;
  }
}

module.exports = {
  addNotificationAndEmit
};
