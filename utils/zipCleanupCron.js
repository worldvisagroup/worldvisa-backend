const cron = require('node-cron');
const ZipExportJob = require('../models/zipExportJob');
const { deleteFromR2 } = require('../services/r2Client');

const RETENTION_HOURS = parseInt(process.env.ZIP_RETENTION_HOURS || '24');

async function cleanupExpiredZips() {
  try {
    console.log('[ZIP Cleanup] Starting cleanup of expired ZIPs');

    const cutoffDate = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000);

    // Find expired completed jobs
    const expiredJobs = await ZipExportJob.find({
      status: 'completed',
      completed_at: { $lt: cutoffDate },
      r2_key: { $exists: true, $ne: null },
    });

    console.log(`[ZIP Cleanup] Found ${expiredJobs.length} expired ZIP files`);

    for (const job of expiredJobs) {
      try {
        // Delete from R2
        await deleteFromR2(job.r2_key);
        console.log(`[ZIP Cleanup] Deleted ${job.r2_key} from R2`);

        // Mark as expired in database
        await ZipExportJob.findByIdAndUpdate(job._id, {
          download_url: null,
          r2_key: null,
          status: 'expired',
        });

      } catch (error) {
        console.error(`[ZIP Cleanup] Failed to delete ${job.r2_key}:`, error.message);
      }
    }

    console.log('[ZIP Cleanup] Cleanup completed');

  } catch (error) {
    console.error('[ZIP Cleanup] Error during cleanup:', error);
  }
}

// Run every hour
const task = cron.schedule('0 * * * *', cleanupExpiredZips, {
  scheduled: false,
  timezone: process.env.CRON_TIMEZONE || 'UTC',
});

function startCleanupCron() {
  task.start();
  console.log('[ZIP Cleanup] Cron job started (runs every hour)');

  // Run immediately on startup if enabled
  if (process.env.RUN_CLEANUP_ON_STARTUP === 'true') {
    cleanupExpiredZips();
  }
}

module.exports = { startCleanupCron, cleanupExpiredZips };
