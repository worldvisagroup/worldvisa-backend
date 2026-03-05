'use strict';

const EmailNotification = require('../../models/emailNotification');
const logger = require('../../utils/logger');


const IMMEDIATE_TYPES = new Set(['document_rejected', 'checklist_created', 'checklist_requested']);



const WINDOW_MS_BY_ROLE = {
  client: 60 * 60 * 1000,       // 60 min — admin actions → client
  admin: 60 * 60 * 1000,        // 60 min — client activity → admin/lead owner
  team_leader: 60 * 60 * 1000,  // 60 min — client activity → TL lead owner
  supervisor: 30 * 60 * 1000,   // 30 min — review requests → supervisor
  master_admin: 30 * 60 * 1000, // 30 min — review requests → master_admin
};


function resolveRecipientEmail(role, clientEmail) {
  if (role === 'client') return clientEmail || null;
  if (role === 'master_admin') return process.env.EMAIL_MASTER_ADMIN || null;
  if (role === 'supervisor') return process.env.EMAIL_SUPERVISOR || null;
  // admin, team_leader → shared inbox
  return process.env.EMAIL_ADMIN_TEAM || null;
}


async function createEmailNotification(params) {
  const {
    recipientRole,
    recipientEmail: rawEmail,
    recipientName = '',
    notificationType,
    entityParentId = 'system',
    entityId = null,
    entityName = '',
    subject = '',
    message = '',
    templateData = {},
  } = params;

  const recipientEmail = resolveRecipientEmail(recipientRole, rawEmail);

  if (!recipientEmail) {
    logger.warn('[Email] No email address resolved — skipping', { recipientRole, notificationType });
    return null;
  }

  const sendImmediately = IMMEDIATE_TYPES.has(notificationType);
  const windowMs = WINDOW_MS_BY_ROLE[recipientRole] ?? (30 * 60 * 1000);
  const scheduledFor = sendImmediately ? new Date() : new Date(Date.now() + windowMs);

  const record = await EmailNotification.create({
    recipientEmail,
    recipientName,
    recipientRole,
    notificationType,
    entityParentId,
    entityId,
    entityName,
    sendImmediately,
    scheduledFor,
    subject,
    message,
    templateData,
    status: 'pending',
  });

  if (sendImmediately) {
    try {
      const { getEmailQueue } = require('../../queues/emailQueue');
      const queue = getEmailQueue();
      await queue.add('send-immediate', { notificationId: record._id.toString() }, { priority: 1 });
    } catch (err) {
      logger.error('[Email] Failed to enqueue immediate notification', {
        error: err.message,
        notificationId: record._id.toString(),
      });
    }
  }

  return record;
}

module.exports = { createEmailNotification, resolveRecipientEmail };
