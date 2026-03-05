const logger = require('../../../utils/logger');

/**
 * Helper to add a notification and trigger websocket.
 * Optionally creates an email notification record (non-blocking).
 *
 * @param {Object} params
 * @param {Object} params.req - Express request object (must have req.app and req.user)
 * @param {String} params.message - Notification message (detail)
 * @param {String} [params.title] - Short text for toaster/notification chip
 * @param {String} [params.type='info'] - Notification type
 * @param {String} [params.category='general'] - Notification category
 * @param {String} [params.source='general'] - Origin: document_review, requested_reviews, quality_check, requested_checklist, general
 * @param {String|null} [params.link=null] - Optional link
 * @param {String|null} [params.emailNotificationType=null] - If set, triggers an email notification
 * @param {String|null} [params.emailSubject=null] - Email subject line override
 * @param {Object} [params.emailTemplateData={}] - Extra data for email template rendering
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
  // Email notification params (optional — set to trigger email delivery)
  emailNotificationType = null,
  emailSubject = null,
  emailTemplateData = {},
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

    // WebSocket emit (non-fatal if it fails)
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

    // Email notification — fully non-blocking, never throws to caller
    if (emailNotificationType) {
      setImmediate(async () => {
        try {
          const ZohoDmsUser = require('../../../models/zohoDmsUser');
          const DmsZohoClient = require('../../../models/dmsZohoClient');
          const NotificationService = require('../../../services/notifications/notificationService');

          let recipientEmail = null;
          let recipientName = '';
          let recipientRole = null;

          // Try admin/staff user first
          const adminUser = await ZohoDmsUser.findById(userId).select('username role').lean();
          if (adminUser) {
            recipientRole = adminUser.role;
            recipientName = adminUser.username;
            // Email resolved from role via env vars inside notificationService
          } else {
            // Fall back to client user
            const clientUser = await DmsZohoClient.findById(userId).select('name email').lean();
            if (clientUser) {
              recipientRole = 'client';
              recipientName = clientUser.name || '';
              recipientEmail = clientUser.email || null;
            }
          }

          if (!recipientRole) {
            logger.warn('[Email] Cannot resolve recipient role — skipping email', { userId });
            return;
          }

          await NotificationService.createEmailNotification({
            recipientRole,
            recipientEmail,  // only used for client; admin roles resolved from env
            recipientName,
            notificationType: emailNotificationType,
            entityParentId: leadId || 'system',
            entityId: documentId ? String(documentId) : null,
            entityName: documentName || '',
            subject: emailSubject || message,
            message,
            templateData: {
              leadId,
              documentId,
              documentName,
              applicationType,
              ...emailTemplateData,
            },
          });
        } catch (err) {
          logger.error('[Email] Notification creation failed', {
            error: err?.message,
            userId,
            emailNotificationType,
          });
        }
      });
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
