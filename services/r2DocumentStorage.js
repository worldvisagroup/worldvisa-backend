'use strict';

const path = require('path');
const { uploadToR2, copyInR2, deleteFromR2 } = require('./r2Client');

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
 * "visa-applications/{safe-clientname}-{leadId}/deleted-documents/{safe-category}/{document-name}.ext"
 */
function buildDeletedDocumentKey(clientName, leadId, category, documentName, originalFileName) {
  const folder = buildClientFolder(clientName, leadId);
  const safeCategory = sanitizeSegment(category || 'uncategorised');
  const fileName = buildFileName(documentName, originalFileName);
  return `${folder}/deleted-documents/${safeCategory}/${fileName}`;
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
  buildDeletedDocumentKey,
  uploadDocument,
  moveToDeleted,
};
