const { Worker } = require('bullmq');
const { connection } = require('../services/redis');
const ZipExportJob = require('../models/zipExportJob');
const dmsZohoDocument = require('../models/dmsZohoDocument');
const { uploadToR2 } = require('../services/r2Client');
const archiver = require('archiver');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

let worker = null;

function createWorker() {
  if (worker) {
    return worker;
  }

  worker = new Worker(
    'zip-export',
    async (job) => {
      const { jobId, record_id } = job.data;

      try {
        console.log(`[ZIP Worker] Processing job ${jobId} for record ${record_id}`);

        // Update job status to processing
        await ZipExportJob.findByIdAndUpdate(jobId, {
          status: 'processing',
        });

        // Fetch ONLY approved documents with download links
        const documents = await dmsZohoDocument
          .find({ record_id, status: 'approved' })
          .select('file_name download_url document_link')
          .lean();

        if (!documents || documents.length === 0) {
          throw new Error('No approved documents found for this record');
        }

        const filesWithLinks = documents.filter(doc => doc.download_url || doc.document_link);

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
            const downloadUrl = doc.download_url || doc.document_link;
            const filename = doc.file_name || `document-${index + 1}`;
            const filePath = path.join(tempDir, filename);

            const response = await axios.get(downloadUrl, {
              responseType: 'stream',
              timeout: 60000, // 1 minute per file
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
              writer.on('finish', async () => {
                // Update progress
                await ZipExportJob.findByIdAndUpdate(jobId, {
                  $inc: { 'progress.current': 1 },
                });
                resolve(filePath);
              });
              writer.on('error', reject);
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

      } catch (error) {
        console.error(`[ZIP Worker] Job ${jobId} failed:`, error);

        // Update job as failed
        await ZipExportJob.findByIdAndUpdate(jobId, {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date(),
        });

        throw error; // Let BullMQ handle retries
      }
    },
    {
      connection,
      concurrency: parseInt(process.env.MAX_CONCURRENT_ZIP_JOBS || '3'),
      removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
      removeOnFail: { count: 50 },      // Keep last 50 failed jobs
      attempts: 3,                       // Retry failed jobs 3 times
      backoff: {
        type: 'exponential',
        delay: 5000,                     // Start with 5 second delay
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`[ZIP Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ZIP Worker] Job ${job.id} failed:`, err.message);
  });

  return worker;
}

module.exports = { createWorker };
