const logger = require('../../../utils/logger');


async function getSenderProfileImageUrl(senderType, senderId) {
  if (!senderType || !senderId) return null;
  try {
    if (senderType === 'staff') {
      const ZohoDmsUser = require('../../../models/zohoDmsUser');
      const u = await ZohoDmsUser.findById(senderId).select('profile_image_url').lean();
      return u?.profile_image_url ?? null;
    }
    return null;
  } catch {
    return null;
  }
}


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
  sender_type = null,
  sender_id = null,
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
      sender_type: sender_type || undefined,
      sender_id: sender_id || undefined,
    });

    await notification.save();

    // WebSocket emit (non-fatal if it fails)
    try {
      const io = req.app.get('io');
      const senderProfileImageUrl = (notification.sender_id && notification.sender_type)
        ? await getSenderProfileImageUrl(notification.sender_type, notification.sender_id)
        : null;
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
        sender_profile_image_url: senderProfileImageUrl,
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
          const adminUser = await ZohoDmsUser.findById(userId).select('username role email').lean();
          if (adminUser) {
            recipientRole = adminUser.role;
            recipientName = adminUser.username;
            recipientEmail = adminUser.email || null;
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
