const ZipExportJob = require('../models/zipExportJob');
const dmsZohoDocument = require('../models/dmsZohoDocument');
const { uploadToR2, r2Client } = require('../services/r2Client');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { downloadFileFromWorkDrive } = require('../utils/dmsZohoWorkDrive');
const archiver = require('archiver');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function processZipJob(jobId, record_id) {
  // Abort if job was cancelled before we started
  const jobDoc = await ZipExportJob.findById(jobId);
  if (!jobDoc || jobDoc.status === 'failed') return;

  console.log(`[ZIP Worker] Processing job ${jobId} for record ${record_id}`);

  // Update job status to processing
  await ZipExportJob.findByIdAndUpdate(jobId, {
    status: 'processing',
  });

  // Fetch ONLY approved documents with download links
  const documents = await dmsZohoDocument
    .find({ record_id, status: 'approved' })
    .select('file_name storage_type r2_key workdrive_file_id download_url document_link')
    .lean();

  if (!documents || documents.length === 0) {
    throw new Error('No approved documents found for this record');
  }

  const filesWithLinks = documents.filter(doc =>
    (doc.storage_type === 'r2' && doc.r2_key) ||
    doc.workdrive_file_id || doc.download_url || doc.document_link
  );

  if (filesWithLinks.length === 0) {
    throw new Error('No downloadable files found');
  }

  await ZipExportJob.findByIdAndUpdate(jobId, {
    'progress.total': filesWithLinks.length,
  });

  // Create temporary directory for downloads
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-export-'));

  try {
    // Download all files
    console.log(`[ZIP Worker] Downloading ${filesWithLinks.length} files`);

    const downloadPromises = filesWithLinks.map(async (doc, index) => {
      const filename = doc.file_name || `document-${index + 1}`;
      const filePath = path.join(tempDir, filename);

      let writeStream;

      if (doc.storage_type === 'r2' && doc.r2_key) {
        const { Body } = await r2Client.send(
          new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: doc.r2_key })
        );
        writeStream = Body.pipe(fs.createWriteStream(filePath));
      } else {
        const response = doc.workdrive_file_id
          ? await downloadFileFromWorkDrive(doc.workdrive_file_id)
          : await axios.get(doc.download_url || doc.document_link, {
              responseType: 'stream',
              timeout: 60000,
            });

        const contentType = response.headers?.['content-type'] || 'unknown';

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Download failed for ${filename}: HTTP ${response.status}`);
        }

        if (contentType.includes('text/html') || contentType.includes('application/json')) {
          throw new Error(`Download returned wrong content type for ${filename}: ${contentType}`);
        }

        writeStream = response.data.pipe(fs.createWriteStream(filePath));
      }

      return new Promise((resolve, reject) => {
        writeStream.on('finish', async () => {
          await ZipExportJob.findByIdAndUpdate(jobId, {
            $inc: { 'progress.current': 1 },
          });
          resolve(filePath);
        });
        writeStream.on('error', reject);
      });
    });

    const downloadedFiles = await Promise.all(downloadPromises);

    // Create ZIP archive
    console.log(`[ZIP Worker] Creating ZIP archive`);
    const zipPath = path.join(tempDir, 'export.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.pipe(output);

    // Add all files to ZIP
    downloadedFiles.forEach((filePath, index) => {
      const filename = filesWithLinks[index].file_name || `document-${index + 1}`;
      archive.file(filePath, { name: filename });
    });

    await archive.finalize();

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      output.on('error', reject);
    });

    // Upload to R2 using STREAM (not buffer - prevents memory issues)
    console.log(`[ZIP Worker] Uploading to R2`);
    const r2Key = `exports/${record_id}/${Date.now()}.zip`;
    const zipStream = fs.createReadStream(zipPath);
    const downloadUrl = await uploadToR2(r2Key, zipStream);

    // Update job as completed
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await ZipExportJob.findByIdAndUpdate(jobId, {
      status: 'completed',
      download_url: downloadUrl,
      r2_key: r2Key,
      completed_at: new Date(),
      expires_at: expiresAt,
    });

    console.log(`[ZIP Worker] Job ${jobId} completed successfully`);

  } finally {
    // Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function processWithRetry(jobId, record_id, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await processZipJob(jobId, record_id);
      return;
    } catch (error) {
      console.error(`[ZIP Worker] Job ${jobId} attempt ${attempt} failed:`, error.message);
      if (attempt < maxAttempts) {
        const delay = 5000 * Math.pow(2, attempt - 1); // 5s, 10s
        await new Promise(r => setTimeout(r, delay));
      } else {
        await ZipExportJob.findByIdAndUpdate(jobId, {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date(),
        });
      }
    }
  }
}

// No-op stub — kept so app.js import doesn't break during transition
function createWorker() {
  return { close: async () => {} };
}

module.exports = { processWithRetry, createWorker };
