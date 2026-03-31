import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { ResendEventData } from '../../types/email.types';
import { UNREAD_CACHE_KEY } from '../../constants/email.constants';

const Email            = require('../../models/email');
const logger           = require('../../utils/logger');
const { addActivityLog } = require('../helper/service/activityLog');
const { redis }        = require('../../services/redis');
const { uploadToR2, getEmailAttachmentKey } = require('../../services/r2Client');


async function invalidateUnreadCache(): Promise<void> {
  if (!redis) return;
  try { await redis.del(UNREAD_CACHE_KEY); } catch { /* non-fatal */ }
}


async function processInboundEmail(emailId: string, eventData: ResendEventData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const headers = { Authorization: `Bearer ${apiKey}` };

  const emailRes = await fetch(
    `https://api.resend.com/emails/receiving/${emailId}`,
    { headers }
  );
  if (!emailRes.ok) {
    throw new Error(`Resend email fetch failed: ${emailRes.status} ${emailRes.statusText}`);
  }
  const emailData = await emailRes.json() as Record<string, any>;

  const attachRes  = await fetch(`https://api.resend.com/emails/receiving/${emailId}/attachments`, { headers });
  const attachBody = attachRes.ok ? await attachRes.json() as Record<string, any> : { data: [] };
  const attachList = Array.isArray(attachBody.data) ? attachBody.data : [];

  const msgId             = (emailData.message_id ?? emailId) as string;
  const storedAttachments: Record<string, any>[] = [];

  for (const att of attachList) {
    const attDisp = ((att.content_disposition ?? '') as string).toLowerCase();
    const attName = ((att.filename ?? '') as string).toLowerCase();
    if (
      attDisp === 'inline'     ||
      att.content_id           ||
      attName.includes('logo') ||
      attName.includes('zoho')
    ) continue;

    const meta: Record<string, any> = {
      filename:               att.filename     ?? 'attachment',
      content_type:           att.content_type ?? 'application/octet-stream',
      size:                   att.size         ?? 0,
      storage_key:            '',
      provider_attachment_id: att.id           ?? null,
    };

    try {
      const fileRes = await fetch(att.download_url);
      if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.status}`);
      const buffer = Buffer.from(await fileRes.arrayBuffer());

      const key = getEmailAttachmentKey({
        direction:    'inbound',
        messageId:    msgId,
        attachmentId: att.id ?? att.filename,
        filename:     att.filename,
      });

      await uploadToR2(key, buffer, meta.content_type);
      storedAttachments.push({ ...meta, size: buffer.length, storage_key: key });
    } catch (err: any) {
      logger.warn('[Email Webhook] Attachment upload failed', {
        email_id: emailId,
        filename: att.filename,
        error:    err.message,
      });
      storedAttachments.push(meta); // soft-fail: keep metadata, leave storage_key empty
    }
  }

  const inReplyTo = (emailData.headers?.['in-reply-to'] ?? null) as string | null;
  let threadId: string | null = null;

  if (inReplyTo) {
    let parent = await Email.findOne({ message_id: inReplyTo }).lean();

    if (!parent && eventData.subject) {
      const baseSubject = eventData.subject.replace(/^(Re\s*:\s*|Fwd?\s*:\s*)+/i, '').trim();
      const senderEmail = eventData.from ?? '';

      parent = await Email.findOne({
        direction: 'outbound',
        subject:   baseSubject,
        to:        senderEmail,
      })
        .sort({ created_at: -1 })
        .lean();
    }

    if (parent) {
      threadId = parent.thread_id ?? parent.message_id ?? inReplyTo;

      const parentUpdates: Record<string, string> = {};
      if (!parent.message_id) parentUpdates.message_id = inReplyTo;
      if (!parent.thread_id)  parentUpdates.thread_id  = threadId!;

      if (Object.keys(parentUpdates).length) {
        Email.updateOne({ _id: parent._id }, { $set: parentUpdates }).catch((err: any) =>
          logger.warn('[Email Webhook] Failed to backfill parent', {
            parent_id: parent._id, error: err.message,
          })
        );
      }
    }
  }

  const rawRefs   = (emailData.headers?.['references'] ?? null) as string | null;
  const references = rawRefs ? rawRefs.split(/\s+/).filter(Boolean) : [];

  const inboundDoc = {
    provider:          'resend',
    provider_email_id: emailId,
    direction:         'inbound',
    email_type:        'client',
    message_id:        eventData.message_id ?? null,
    in_reply_to:       inReplyTo,
    references,
    thread_id:         threadId,
    from:              eventData.from ?? '',
    to:                Array.isArray(eventData.to)  ? eventData.to  : [eventData.to].filter(Boolean),
    cc:                Array.isArray(eventData.cc)  ? eventData.cc  : [],
    bcc:               Array.isArray(eventData.bcc) ? eventData.bcc : [],
    subject:           eventData.subject ?? '',
    html:              emailData.html    ?? null,
    text:              emailData.text    ?? null,
    headers:           emailData.headers ?? {},
    attachments:       storedAttachments,
    last_event:        'received',
    is_read:           false,
    received_at:       eventData.created_at ? new Date(eventData.created_at) : new Date(),
    created_at:        new Date(),
  };

  const upsertResult = await Email.findOneAndUpdate(
    { provider: 'resend', provider_email_id: emailId },
    { $setOnInsert: inboundDoc },
    { upsert: true, new: false }
  );

  if (upsertResult === null) {
    invalidateUnreadCache().catch(() => {});

    const fromEmail = (eventData.from ?? '').toLowerCase().trim();
    if (fromEmail) {
      setImmediate(async () => {
        try {
          const DmsZohoClient = require('../../models/dmsZohoClient');
          const client = await DmsZohoClient.findOne({ email: fromEmail }).select('lead_id name').lean();
          if (client?.lead_id) {
            addActivityLog({
              lead_id:       client.lead_id,
              activity_type: 'email_received',
              summary:       `Email received from ${client.name ?? fromEmail}: "${eventData.subject ?? '(no subject)'}"`,
              actor_type:    'client',
              actor_name:    client.name ?? fromEmail,
              metadata:      { subject: eventData.subject ?? null, from: fromEmail, email_id: emailId },
            });
          }
        } catch { /* non-fatal */ }
      });
    }
  }

  logger.info('[Email Webhook] Inbound email stored', {
    email_id:    emailId,
    attachments: storedAttachments.length,
    thread_id:   threadId,
  });
}


export async function handleResendWebhook(req: Request, res: Response): Promise<void> {
  const secret  = process.env.RESEND_WEBHOOK_SECRET;
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : (req.body ?? '') as string;

  if (secret) {
    const svixHeaders = {
      'svix-id':        req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    };

    if (!svixHeaders['svix-id'] || !svixHeaders['svix-timestamp'] || !svixHeaders['svix-signature']) {
      logger.warn('[Email Webhook] Missing Svix headers');
      res.status(401).send('Missing webhook signature headers');
      return;
    }

    try {
      new Webhook(secret).verify(rawBody, svixHeaders as Record<string, string>);
    } catch (err: any) {
      logger.warn('[Email Webhook] Signature verification failed', { error: err.message });
      res.status(401).send('Invalid webhook signature');
      return;
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('[Email Webhook] RESEND_WEBHOOK_SECRET not set in production — rejecting');
    res.status(500).send('Webhook secret not configured');
    return;
  } else {
    logger.warn('[Email Webhook] RESEND_WEBHOOK_SECRET not set — skipping verification (dev only)');
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn('[Email Webhook] Malformed JSON body');
    res.status(400).send('Invalid JSON');
    return;
  }

  const { type, data } = payload ?? {};
  const emailId = data?.email_id as string | undefined;

  logger.info('[Email Webhook] Event received', { type, email_id: emailId });

  if (type === 'email.received' && emailId) {
    res.status(200).json({ received: true });

    processInboundEmail(emailId, data as ResendEventData).catch((err: any) =>
      logger.error('[Email Webhook] processInboundEmail failed', {
        email_id: emailId,
        error:    err.message,
      })
    );
    return;
  }

  res.status(200).json({ received: true });
}
