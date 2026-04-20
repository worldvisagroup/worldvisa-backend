'use strict';

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

// ─── Singleton client ─────────────────────────────────────────────────────────

const r2Client = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ─── Key builder ──────────────────────────────────────────────────────────────

/**
 * Build a deterministic, collision-safe R2 key for an email attachment.
 *
 * Uses a short SHA-1 slug of attachmentId (or filename fallback) to avoid
 * collisions when two parts share the same filename in the same message.
 *
 * Examples:
 *   email-attachments/inbound/<msgId>/a1b2c3d4-invoice.pdf
 *   email-attachments/outbound/a1b2c3d4-report.xlsx
 */
function getEmailAttachmentKey({ direction, messageId, attachmentId, filename }) {
  const safeName = (filename || 'attachment')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);

  // Short hash prevents collisions without exposing raw IDs in the key
  const slug = crypto
    .createHash('sha1')
    .update(String(attachmentId ?? filename ?? Date.now()))
    .digest('hex')
    .slice(0, 8);

  if (direction === 'inbound' && messageId) {
    return `email-attachments/inbound/${messageId}/${slug}-${safeName}`;
  }

  return `email-attachments/outbound/${slug}-${safeName}`;
}

/**
 * Build an R2 key for a client profile image.
 *
 * Example:
 *   client-profile-images/<lead_id>/<slug>-avatar.png
 */
function getClientProfileImageKey({ lead_id, filename }) {
  const safeName = (filename || 'image')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);

  const slug = crypto
    .randomBytes(8)
    .toString('hex')
    .slice(0, 12);

  return `client-profile-images/${String(lead_id)}/${slug}-${safeName}`;
}

// ─── Upload ───────────────────────────────────────────────────────────────────


async function uploadToR2(key, body, contentType = 'application/octet-stream') {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME env var is not set');

  await r2Client.send(
    new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME,
      Key:         key,
      Body:        body,
      ContentType: contentType,
    })
  );

  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }

  return key; // caller uses getSignedAttachmentUrl(key) at read time
}

// ─── Signed Upload URL (PUT) ──────────────────────────────────────────────────

async function getSignedUploadUrl(key, { contentType, expiresIn = 600 } = {}) {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME env var is not set');

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  };

  if (contentType) {
    params.ContentType = contentType;
  }

  return getSignedUrl(r2Client, new PutObjectCommand(params), { expiresIn });
}

// ─── Signed URL ───────────────────────────────────────────────────────────────


async function getSignedAttachmentUrl(key, { filename, contentType, expiresIn = 3600 } = {}) {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME env var is not set');

  const params = { Bucket: process.env.R2_BUCKET_NAME, Key: key };
  if (filename) {
    params.ResponseContentDisposition = `attachment; filename="${encodeURIComponent(filename)}"`;
  }
  if (contentType) {
    params.ResponseContentType = contentType;
  }

  return getSignedUrl(r2Client, new GetObjectCommand(params), { expiresIn });
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

async function copyInR2(sourceKey, destKey) {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME env var is not set');

  await r2Client.send(
    new CopyObjectCommand({
      Bucket:     process.env.R2_BUCKET_NAME,
      CopySource: `${process.env.R2_BUCKET_NAME}/${sourceKey}`,
      Key:        destKey,
    })
  );
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteFromR2(key) {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME env var is not set');

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key:    key,
    })
  );
}


module.exports = {
  r2Client,
  uploadToR2,
  copyInR2,
  deleteFromR2,
  getSignedAttachmentUrl,
  getSignedUploadUrl,
  getEmailAttachmentKey,
  getClientProfileImageKey,
};