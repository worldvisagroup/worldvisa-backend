/**
 * Helper to add a notification and trigger websocket.
 * @param {Object} params
 * @param {Object} params.req - Express request object (must have req.app and req.user)
 * @param {String} params.message - Notification message
 * @param {String} [params.type='info'] - Notification type
 * @param {String} [params.category] - Notification category
 * @param {String|null} [params.link=null] - Optional link
 * @returns {Promise<Object>} - The created notification document
 */
async function addNotificationAndEmit({ req, leadId = null, documentId = null, userId, message, type = 'info', category = 'general', link = null, documentName = '', applicationType = 'Visa_Applications' }) {
  const ZohoDmsNotification = require('../../../models/zohoDmsNotification');

  try {
    const notification = new ZohoDmsNotification({
      user: userId,
      message,
      type,
      link,
      category,
      leadId,
      documentId,
      documentName,
      applicationType
    });

    await notification.save();


    try {
      const io = req.app.get('io');
      const notificationPayload = {
        _id: notification._id,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      };
      if (notification.type) notificationPayload.type = notification.type;
      if (notification.category) notificationPayload.category = notification.category;
      if (notification.link) notificationPayload.link = notification.link;
      if (notification.leadId) notificationPayload.leadId = notification.leadId;
      if (notification.documentId) notificationPayload.documentId = notification.documentId;
      if (notification.documentName) notificationPayload.documentName = notification.documentName;
      if (notification.applicationType) notificationPayload.applicationType = notification.applicationType;

      io?.to(`user:${userId}`).emit('notification:new', notificationPayload);
    } catch (err) {
      // Optionally log error, but don't throw
      console.log("got error on websocket for add notification: ", err);
    }

    return notification;
  } catch (error) {
    console.log(`Error occurred when adding the notification:`, error);
    throw error; // Re-throw to let the calling function handle it
  }
}

module.exports = {
  addNotificationAndEmit
};
