'use strict';

const path = require('path');
const { uploadToR2, copyInR2, deleteFromR2 } = require('./r2Client');
const crypto = require('crypto');

// ─── Key builders ─────────────────────────────────────────────────────────────

function sanitizeSegment(str) {
  return String(str)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function buildFileName(documentName, originalFileName) {
  const ext = path.extname(originalFileName || '').toLowerCase();
  return `${sanitizeSegment(documentName || 'document')}${ext}`;
}

function buildVersionedFileName(documentName, originalFileName) {
  const ext = path.extname(originalFileName || '').toLowerCase();
  const base = sanitizeSegment(documentName || 'document');
  const suffix = crypto.randomBytes(6).toString('hex');
  return `${base}-${suffix}${ext}`;
}

/**
 * "visa-applications/{safe-clientname}-{leadId}"
 */
function buildClientFolder(clientName, leadId) {
  const safeClient = sanitizeSegment(clientName);
  return `visa-applications/${safeClient}-${leadId}`;
}

/**
 * "visa-applications/{safe-clientname}-{leadId}/{safe-category}/{document-name}.ext"
 * e.g. visa-applications/john-doe-REC123/identity/name-change-affidavit.pdf
 */
function buildDocumentKey(clientName, leadId, category, documentName, originalFileName) {
  const folder = buildClientFolder(clientName, leadId);
  const safeCategory = sanitizeSegment(category || 'uncategorised');
  const fileName = buildFileName(documentName, originalFileName);
  return `${folder}/${safeCategory}/${fileName}`;
}

/**
 * Like buildDocumentKey, but produces a unique filename per upload.
 * Useful for re-uploads so public URLs never serve cached older bytes.
 */
function buildVersionedDocumentKey(clientName, leadId, category, documentName, originalFileName) {
  const folder = buildClientFolder(clientName, leadId);
  const safeCategory = sanitizeSegment(category || 'uncategorised');
  const fileName = buildVersionedFileName(documentName, originalFileName);
  return `${folder}/${safeCategory}/${fileName}`;
}

/**
 * "visa-applications/{safe-clientname}-{leadId}/deleted-documents/{safe-category}/{document-name}-{timestamp}.ext"
 * Timestamp suffix ensures repeated rejections of the same document type never overwrite each other.
 */
function buildDeletedDocumentKey(clientName, leadId, category, documentName, originalFileName) {
  const folder = buildClientFolder(clientName, leadId);
  const safeCategory = sanitizeSegment(category || 'uncategorised');
  const ext = path.extname(originalFileName || '').toLowerCase();
  const base = sanitizeSegment(documentName || 'document');
  const ts = Date.now();
  return `${folder}/deleted-documents/${safeCategory}/${base}-${ts}${ext}`;
}

/**
 * Build the public-facing URL for an R2 key.
 * Falls back to returning the raw key when R2_PUBLIC_URL is not configured.
 */
function buildDeletedFileUrl(key) {
  if (!process.env.R2_PUBLIC_URL) return key;
  return `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}

// ─── Operations ───────────────────────────────────────────────────────────────

/**
 * Upload a document buffer to R2. Returns the stored key.
 */
async function uploadDocument(key, buffer, mimeType) {
  await uploadToR2(key, buffer, mimeType);
  return key;
}

/**
 * Copy currentKey to deleted-documents prefix, then delete the original.
 * Used for soft-deletes and re-upload archiving.
 */
async function moveToDeleted(currentKey, clientName, leadId, category, documentName, originalFileName) {
  const deletedKey = buildDeletedDocumentKey(clientName, leadId, category, documentName, originalFileName);
  await copyInR2(currentKey, deletedKey);
  await deleteFromR2(currentKey);
  return deletedKey;
}

module.exports = {
  sanitizeSegment,
  buildClientFolder,
  buildDocumentKey,
  buildVersionedDocumentKey,
  buildDeletedDocumentKey,
  buildDeletedFileUrl,
  uploadDocument,
  moveToDeleted,
};
