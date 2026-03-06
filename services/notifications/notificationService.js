'use strict';

const EmailNotification = require('../../models/emailNotification');
const logger = require('../../utils/logger');


const IMMEDIATE_TYPES = new Set(['document_rejected', 'checklist_created', 'checklist_requested']);

// Dedupe window for immediate types that can be triggered multiple times for the same lead
const DEDUPE_WINDOW_MS = 15 * 60 * 1000;

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

  // Deduplicate immediate types that can be triggered multiple times for the same lead.
  // Uses an atomic findOneAndUpdate+upsert to prevent race conditions when multiple
  // events fire simultaneously (e.g. bulk checklist assignment).
  const dedupeTypes = ['checklist_created', 'checklist_requested'];
  if (dedupeTypes.includes(notificationType)) {
    const { Types } = require('mongoose');
    const cutoff = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const parentId = entityParentId || 'system';
    const newId = new Types.ObjectId();

    const existing = await EmailNotification.findOneAndUpdate(
      {
        recipientEmail,
        notificationType,
        entityParentId: parentId,
        $or: [
          { status: { $in: ['pending', 'processing'] }, createdAt: { $gte: cutoff } },
          { status: 'sent', sentAt: { $gte: cutoff } },
        ],
      },
      {
        $setOnInsert: {
          _id: newId,
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
        },
      },
      { upsert: true, new: false }
    );

    if (existing) {
      // A recent record already exists — deduplicate
      if (
        notificationType === 'checklist_created' &&
        existing.status === 'pending' &&
        templateData?.checklistCount != null
      ) {
        await EmailNotification.updateOne(
          { _id: existing._id },
          { $set: { templateData: { ...existing.templateData, checklistCount: templateData.checklistCount } } }
        );
      }
      logger.info('[Email] Deduplicated immediate notification', {
        notificationType,
        recipientEmail,
        entityParentId: parentId,
        existingId: existing._id.toString(),
      });
      return null;
    }

    // No match found — new record was atomically inserted with newId
    try {
      const { getEmailQueue } = require('../../queues/emailQueue');
      const queue = getEmailQueue();
      await queue.add('send-immediate', { notificationId: newId.toString() }, { priority: 1 });
    } catch (err) {
      logger.error('[Email] Failed to enqueue immediate notification', {
        error: err.message,
        notificationId: newId.toString(),
      });
    }
    return { _id: newId };
  }

  // Non-dedupe path: document_rejected and all batched types
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
