'use strict';

const { Resend } = require('resend');
const EmailNotification = require('../../models/emailNotification');
const logger = require('../../utils/logger');

// Template renderers
const documentRejectedTpl = require('../../emailTemplates/documentRejected');
const checklistCreatedTpl = require('../../emailTemplates/checklistCreated');
const adminActionSummaryTpl = require('../../emailTemplates/adminActionSummary');
const clientActivitySummaryTpl = require('../../emailTemplates/clientActivitySummary');
const reviewRequestedTpl = require('../../emailTemplates/reviewRequested');

// Types that render via adminActionSummary (admin action → client)
const ADMIN_ACTION_TYPES = new Set([
  'document_approved',
  'document_reviewed',
  'comment_to_client',
]);

// Types that render via clientActivitySummary (client action → admin/lead owner)
const CLIENT_ACTIVITY_TYPES = new Set([
  'document_upload',
  'document_reupload',
  'checklist_requested',
  'comment_by_client',
]);

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable is not set');
  return new Resend(apiKey);
}

function getFromAddress() {
  const name = process.env.EMAIL_FROM_NAME || 'WorldVisa Group';
  const email = process.env.EMAIL_FROM || 'notifications@worldvisagroup.com';
  return `${name} <${email}>`;
}

/**
 * Choose the correct template renderer and invoke it.
 * Returns { html, subject } or null if type is not recognised.
 */
function renderTemplate(notification) {
  const { notificationType, templateData, recipientName, entityParentId, entityName } = notification;

  if (notificationType === 'document_rejected') {
    return documentRejectedTpl.render({
      recipientName,
      documentName: entityName,
      rejectReason: templateData?.rejectReason,
      reviewedBy: templateData?.reviewedBy,
      leadId: entityParentId !== 'system' ? entityParentId : null,
    });
  }

  if (notificationType === 'checklist_created') {
    return checklistCreatedTpl.render({
      recipientName,
      checklistCount: templateData?.checklistCount,
      leadId: entityParentId !== 'system' ? entityParentId : null,
    });
  }

  if (notificationType === 'review_requested') {
    return reviewRequestedTpl.render([notification], { recipientName });
  }

  return null; // batch types handled in renderBatchTemplate
}

/**
 * Choose the correct batch template renderer.
 * Returns { html, subject } or null.
 */
function renderBatchTemplate(notifications) {
  if (!notifications.length) return null;

  const firstType = notifications[0].notificationType;

  if (firstType === 'review_requested') {
    const recipientName = notifications[0].recipientName || '';
    return reviewRequestedTpl.render(notifications, { recipientName });
  }

  if (ADMIN_ACTION_TYPES.has(firstType)) {
    const recipientName = notifications[0].recipientName || '';
    const leadId = notifications[0].entityParentId !== 'system' ? notifications[0].entityParentId : null;
    return adminActionSummaryTpl.render(notifications, { recipientName, leadId });
  }

  if (CLIENT_ACTIVITY_TYPES.has(firstType)) {
    const td = notifications[0].templateData || {};
    return clientActivitySummaryTpl.render(notifications, {
      leadOwnerName: td.leadOwnerName,
      clientName: td.clientName,
      leadId: notifications[0].entityParentId !== 'system' ? notifications[0].entityParentId : null,
    });
  }

  // Mixed batch fallback — use clientActivitySummary layout
  return clientActivitySummaryTpl.render(notifications, {
    clientName: notifications[0].templateData?.clientName,
    leadOwnerName: notifications[0].templateData?.leadOwnerName,
    leadId: notifications[0].entityParentId !== 'system' ? notifications[0].entityParentId : null,
  });
}

/**
 * Send a single immediate notification (document_rejected, checklist_created).
 */
async function sendSingle(notificationId) {
  const record = await EmailNotification.findById(notificationId);
  if (!record) {
    logger.warn('[Email] sendSingle: notification not found', { notificationId });
    return;
  }
  if (record.status === 'sent') return; // already processed

  await EmailNotification.findByIdAndUpdate(notificationId, { status: 'processing' });

  try {
    const rendered = renderTemplate(record);
    if (!rendered) {
      throw new Error(`No template renderer for type: ${record.notificationType}`);
    }

    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: record.recipientEmail,
      subject: record.subject || rendered.subject,
      html: rendered.html,
    });

    if (error) throw new Error(error.message || JSON.stringify(error));

    await EmailNotification.findByIdAndUpdate(notificationId, {
      status: 'sent',
      sentAt: new Date(),
      resendId: data?.id || null,
    });

    logger.info('[Email] Sent immediate notification', {
      notificationId,
      type: record.notificationType,
      to: record.recipientEmail,
      resendId: data?.id,
    });
  } catch (err) {
    const retryCount = (record.error?.retryCount || 0) + 1;
    await EmailNotification.findByIdAndUpdate(notificationId, {
      status: 'failed',
      'error.message': err.message,
      'error.retryCount': retryCount,
      'error.lastRetryAt': new Date(),
    });
    logger.error('[Email] Failed to send immediate notification', {
      notificationId,
      error: err.message,
      retryCount,
    });
    throw err; // Let BullMQ retry
  }
}

/**
 * Send a batched group of notifications as a single email.
 * All records in the batch should share the same recipientEmail, type family, and leadId.
 */
async function sendBatch(notificationIds) {
  if (!notificationIds?.length) return;

  const records = await EmailNotification.find({
    _id: { $in: notificationIds },
    status: { $in: ['pending', 'processing'] },
  }).lean();

  if (!records.length) return;

  const recipientEmail = records[0].recipientEmail;
  const recipientName = records[0].recipientName;
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Mark all as processing
  await EmailNotification.updateMany(
    { _id: { $in: notificationIds } },
    { status: 'processing', batchId, batchedWith: notificationIds }
  );

  try {
    const rendered = renderBatchTemplate(records);
    if (!rendered) {
      throw new Error(`No batch template for types: ${[...new Set(records.map(r => r.notificationType))].join(', ')}`);
    }

    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
    });

    if (error) throw new Error(error.message || JSON.stringify(error));

    await EmailNotification.updateMany(
      { _id: { $in: notificationIds } },
      { status: 'sent', sentAt: new Date(), resendId: data?.id || null }
    );

    logger.info('[Email] Sent batch notification', {
      batchId,
      count: records.length,
      to: recipientEmail,
      resendId: data?.id,
    });
  } catch (err) {
    await EmailNotification.updateMany(
      { _id: { $in: notificationIds } },
      {
        status: 'failed',
        'error.message': err.message,
        $inc: { 'error.retryCount': 1 },
        'error.lastRetryAt': new Date(),
      }
    );
    logger.error('[Email] Failed to send batch notification', {
      batchId,
      count: records.length,
      to: recipientEmail,
      error: err.message,
    });
    throw err; // Let BullMQ retry
  }
}

module.exports = { sendSingle, sendBatch };
