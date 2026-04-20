'use strict';

/**
 * MongoDB → OpenSearch Incremental Sync Cron
 * ─────────────────────────────────────────────────────────────────────────────
 * Enqueues an `incremental-sync` job every 15 minutes.
 * Used as fallback when MongoDB is not a replica set (no change stream support).
 *
 * Disable via env: DISABLE_MONGO_SYNC_CRON=true
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const { getMongoSyncQueue } = require('../queues/mongoSyncQueue');

let cronJob = null;

function startMongoSyncCron() {
  if (cronJob) return;

  if (process.env.DISABLE_MONGO_SYNC_CRON === 'true') {
    logger.info('[MongoSync Cron] Disabled via DISABLE_MONGO_SYNC_CRON env var');
    return;
  }

  cronJob = cron.schedule('*/15 * * * *', async () => {
    try {
      const queue = getMongoSyncQueue();
      await queue.add('incremental-sync', {}, { jobId: `incremental-sync-${Date.now()}` });
      logger.info('[MongoSync Cron] Incremental sync job enqueued');
    } catch (err) {
      logger.error('[MongoSync Cron] Failed to enqueue incremental-sync job', { error: err.message });
    }
  }, {
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE || 'UTC',
  });

  logger.info('[MongoSync Cron] Started — schedule: every 15 minutes');
}

function stopMongoSyncCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info('[MongoSync Cron] Stopped');
  }
}

module.exports = { startMongoSyncCron, stopMongoSyncCron };
