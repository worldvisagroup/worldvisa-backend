'use strict';

const { Resend } = require('resend');
const EmailNotification = require('../../models/emailNotification');
const Email = require('../../models/email');
const DmsZohoClient = require('../../models/dmsZohoClient');
const logger = require('../../utils/logger');
const { getEmailAttachmentKey, uploadToR2 } = require('../r2Client');

// Template renderers
const documentRejectedTpl = require('../../emailTemplates/documentRejected');
const checklistCreatedTpl = require('../../emailTemplates/checklistCreated');
const checklistRequestedTpl = require('../../emailTemplates/checklistRequested');
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
  'comment_by_client',
]);

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY environment variable is not set');
  return new Resend(apiKey);
}

function getFromAddress() {
  const name = process.env.EMAIL_FROM_NAME_AUSTRALIA || 'WorldVisa Australia';
  const email = process.env.EMAIL_FROM_AUSTRALIA || 'australia@worldvisa.in';
  return `${name} <${email}>`;
}

function createEmailRecord(opts) {
  const {
    provider_email_id,
    from,
    to,
    subject,
    html,
    text = null,
    client_id = null,
    attachments = [],
  } = opts;
  const toArr = Array.isArray(to) ? to : (to ? [to] : []);
  const attachmentList = Array.isArray(attachments) ? attachments : [];
  Email.create({
    provider: 'resend',
    provider_email_id: provider_email_id || null,
    direction: 'outbound',
    email_type: 'system',
    from,
    to: toArr,
    subject: subject || '',
    html: html || null,
    text,
    attachments: attachmentList,
    last_event: 'sent',
    is_read: true,
    created_at: new Date(),
    client_id,
  }).catch((err) => {
    logger.error('[Email] Failed to create Email record', { error: err.message, provider_email_id });
  });
}


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

  if (notificationType === 'checklist_requested') {
    return checklistRequestedTpl.render({
      recipientName,
      clientName: templateData?.clientName,
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
    const attachmentList = Array.isArray(record.attachments) ? record.attachments : [];
    const resendAttachments = attachmentList
      .filter((a) => a && a.storage_url)
      .map((a) => ({
        filename: a.filename || 'attachment',
        url: a.storage_url,
        contentType: a.content_type || 'application/octet-stream',
      }));

    const sendPayload = {
      from: getFromAddress(),
      to: record.recipientEmail,
      subject: record.subject || rendered.subject,
      html: rendered.html,
    };
    if (resendAttachments.length) Object.assign(sendPayload, { attachments: resendAttachments });

    const { data, error } = await resend.emails.send(sendPayload);

    if (error) throw new Error(error.message || JSON.stringify(error));

    const sentAt = new Date();
    await EmailNotification.findByIdAndUpdate(notificationId, {
      status: 'sent',
      sentAt,
      resendId: data?.id || null,
    });

    if (record.recipientRole === 'client') {
      DmsZohoClient.findOneAndUpdate(
        { email: record.recipientEmail },
        { last_communication_activity: sentAt }
      ).catch(() => {});
    }

    let clientId = null;
    if (record.recipientRole === 'client') {
      const client = await DmsZohoClient.findOne({ email: record.recipientEmail }, { _id: 1 }).lean();
      clientId = client?._id || null;
    }
    createEmailRecord({
      provider_email_id: data?.id,
      from: getFromAddress(),
      to: [record.recipientEmail],
      subject: record.subject || rendered.subject,
      html: rendered.html,
      client_id: clientId,
      attachments: attachmentList,
    });

    logger.info('[Email] Sent immediate notification', {
      notificationId,
      type: record.notificationType,
      to: record.recipientEmail,
      resendId: data?.id,
    });
  } catch (err) {
    await EmailNotification.findByIdAndUpdate(notificationId, {
      status: 'failed',
      'error.message': err.message,
      $inc: { 'error.retryCount': 1 },
      'error.lastRetryAt': new Date(),
    });
    logger.error('[Email] Failed to send immediate notification', {
      notificationId,
      error: err.message,
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

  // Idempotency: batch was already sent (e.g. previous attempt succeeded, then crash before DB update)
  const any = await EmailNotification.find(
    { _id: { $in: notificationIds } },
    { status: 1 }
  ).lean();
  if (any.length && any.every((r) => r.status === 'sent')) return;

  const records = await EmailNotification.find({
    _id: { $in: notificationIds },
    status: { $in: ['pending', 'processing', 'failed'] },
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
    const attachmentList = Array.isArray(records[0]?.attachments) ? records[0].attachments : [];
    const resendAttachments = attachmentList
      .filter((a) => a && a.storage_url)
      .map((a) => ({
        filename: a.filename || 'attachment',
        url: a.storage_url,
        contentType: a.content_type || 'application/octet-stream',
      }));

    const sendPayload = {
      from: getFromAddress(),
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
    };
    if (resendAttachments.length) Object.assign(sendPayload, { attachments: resendAttachments });

    const { data, error } = await resend.emails.send(sendPayload);

    if (error) throw new Error(error.message || JSON.stringify(error));

    const sentAt = new Date();
    await EmailNotification.updateMany(
      { _id: { $in: notificationIds } },
      { status: 'sent', sentAt, resendId: data?.id || null }
    );

    if (records[0]?.recipientRole === 'client') {
      DmsZohoClient.findOneAndUpdate(
        { email: recipientEmail },
        { last_communication_activity: sentAt }
      ).catch(() => {});
    }

    let clientId = null;
    if (records[0]?.recipientRole === 'client') {
      const client = await DmsZohoClient.findOne({ email: recipientEmail }, { _id: 1 }).lean();
      clientId = client?._id || null;
    }
    createEmailRecord({
      provider_email_id: data?.id,
      from: getFromAddress(),
      to: [recipientEmail],
      subject: rendered.subject,
      html: rendered.html,
      client_id: clientId,
      attachments: attachmentList,
    });

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

const MAX_ATTACHMENTS_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB (Resend allows 40 MB per email)

async function sendEmailFromFrontend(opts) {
  const {
    to,
    subject,
    html = null,
    text = null,
    cc = null,
    bcc = null,
    client_id = null,
    in_reply_to = null,
    message_id = null,
    attachments = [],
  } = opts;

  const toArr = Array.isArray(to) ? to : (to ? String(to).split(',').map((e) => e.trim()).filter(Boolean) : []);
  if (!toArr.length) throw new Error('Missing or invalid "to"');
  if (!subject || typeof subject !== 'string' || !subject.trim()) throw new Error('Missing or invalid "subject"');
  if (!html || typeof html !== 'string' || !html.trim()) throw new Error('Missing or invalid "html"');

  // Resolve thread_id for replies so the outbound email is grouped with its conversation
  let threadId = null;
  let replyReferences = [];
  if (in_reply_to) {
    const parent = await Email.findOne(
      { $or: [{ message_id: in_reply_to }, { provider_email_id: in_reply_to }] },
      { _id: 1, thread_id: 1, message_id: 1, references: 1 }
    ).lean();
    if (parent) {
      threadId = parent.thread_id || parent._id.toString();
      // Backfill thread_id on the parent if it was a standalone email (e.g. inbound with no prior thread)
      if (!parent.thread_id) {
        await Email.updateOne({ _id: parent._id }, { $set: { thread_id: threadId } });
      }
      // Build full References chain: all ancestor IDs + parent's own message_id
      replyReferences = [
        ...(Array.isArray(parent.references) ? parent.references : []),
        parent.message_id,
      ].filter(Boolean);
    }
  }

  const storedAttachments = [];
  let totalSize = 0;
  for (const att of attachments) {
    if (!att || !Buffer.isBuffer(att.buffer) || !att.filename) continue;
    totalSize += att.buffer.length;
    if (totalSize > MAX_ATTACHMENTS_TOTAL_BYTES) throw new Error('Total attachment size exceeds 25 MB');
    const key = getEmailAttachmentKey({ direction: 'outbound', filename: att.filename });
    const storage_url = await uploadToR2(key, att.buffer, att.mimetype || 'application/octet-stream');
    storedAttachments.push({
      filename: att.filename,
      content_type: att.mimetype || 'application/octet-stream',
      size: att.buffer.length,
      storage_url,
    });
  }

  const resend = getResend();
  const ccArr = cc ? (Array.isArray(cc) ? cc : String(cc).split(',').map((e) => e.trim()).filter(Boolean)) : [];
  const bccArr = bcc ? (Array.isArray(bcc) ? bcc : String(bcc).split(',').map((e) => e.trim()).filter(Boolean)) : [];
  const headers = {};
  if (in_reply_to) {
    headers['In-Reply-To'] = in_reply_to;
    if (replyReferences.length) headers['References'] = replyReferences.join(' ');
  }

  const payload = {
    from: getFromAddress(),
    to: toArr,
    subject: subject.trim(),
    ...(html && html.trim() ? { html: html.trim() } : {}),
    ...(text && text.trim() ? { text: text.trim() } : {}),
    ...(ccArr.length ? { cc: ccArr } : {}),
    ...(bccArr.length ? { bcc: bccArr } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  };
  if (storedAttachments.length) {
    payload.attachments = storedAttachments.map((a) => ({ filename: a.filename, path: a.storage_url }));
  }

  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(error.message || JSON.stringify(error));

  // message_id is NOT fetched here — Resend's email.sent webhook delivers the final
  // RFC Message-ID (assigned by SES) and patches the Email doc asynchronously.
  await Email.create({
    provider: 'resend',
    provider_email_id: data?.id || null,
    direction: 'outbound',
    email_type: 'client',
    from: getFromAddress(),
    to: toArr,
    cc: ccArr,
    bcc: bccArr,
    subject: subject.trim(),
    html: html && html.trim() ? html.trim() : null,
    text: text && text.trim() ? text.trim() : null,
    attachments: storedAttachments,
    last_event: 'sent',
    is_read: true,
    ...(client_id != null      ? { client_id }                  : {}),
    ...(threadId               ? { thread_id: threadId }         : {}),
    ...(in_reply_to            ? { in_reply_to }                 : {}),
    ...(replyReferences.length ? { references: replyReferences } : {}),
  }).catch((err) => {
    logger.error('[Email] Failed to create Email record (send from frontend)', { error: err.message, provider_email_id: data?.id });
  });

  return { id: data?.id };
}

module.exports = { sendSingle, sendBatch, sendEmailFromFrontend };
