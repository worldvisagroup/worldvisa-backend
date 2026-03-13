'use strict';

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
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

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a Buffer or Readable stream to R2.
 *
 * - Public bucket  (R2_PUBLIC_URL set)  → returns stable CDN URL
 * - Private bucket (R2_PUBLIC_URL unset) → returns the key
 *
 * Always store the KEY in MongoDB, never a signed URL.
 * If you have a public bucket and store the full URL today, you can still
 * switch to private + signed URLs later without a data migration — just
 * store the key and build the URL at read time.
 */
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

// ─── Signed URL ───────────────────────────────────────────────────────────────

/**
 * Generate a pre-signed GET URL for a private R2 object.
 * Call this at read time — never store the result in the database.
 *
 * @param {string} key              - R2 object key (as stored in MongoDB)
 * @param {number} [expiresIn=3600] - TTL in seconds (default 1h, max 7 days)
 * @returns {Promise<string>}       - Pre-signed URL
 */
async function getSignedAttachmentUrl(key, expiresIn = 3600) {
  if (!process.env.R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME env var is not set');

  return getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
    { expiresIn }
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

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  r2Client,
  uploadToR2,
  deleteFromR2,
  getSignedAttachmentUrl, // ← new export — used by gmailSyncService.hydrateAttachmentUrls()
  getEmailAttachmentKey,
};