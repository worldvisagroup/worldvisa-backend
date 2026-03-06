'use strict';

const cron = require('node-cron');
const crypto = require('crypto');
const EmailNotification = require('../models/emailNotification');
const logger = require('../utils/logger');

// Unique ID for this process instance — used for Redis leader-election lock
const INSTANCE_ID = crypto.randomUUID();
const LOCK_KEY = 'email:batch:lock';
const LOCK_TTL_SECONDS = 60;

let cronJob = null;

/**
 * Aggregate due batched EmailNotification records and enqueue them for sending.
 * Protected by a Redis SET NX lock to prevent duplicate runs on multi-instance deploys.
 */
async function runAggregator() {
  const { redis } = require('../services/redis');
  const { getEmailQueue } = require('../queues/emailQueue');

  logger.info('[Email Batch] Aggregator cron tick', { instanceId: INSTANCE_ID, time: new Date().toISOString() });

  if (!redis) {
    logger.warn('[Email Batch] Redis not available — skipping aggregator run');
    return;
  }

  // Leader election: only one instance runs the aggregator at a time
  const acquired = await redis.set(LOCK_KEY, INSTANCE_ID, 'EX', LOCK_TTL_SECONDS, 'NX');
  if (!acquired) {
    logger.debug('[Email Batch] Lock not acquired — another instance is processing');
    return;
  }

  logger.info('[Email Batch] Lock acquired', { instanceId: INSTANCE_ID });

  try {
    const now = new Date();

    // Find all pending batched records whose scheduled window has elapsed
    const due = await EmailNotification.find({
      status: 'pending',
      sendImmediately: false,
      scheduledFor: { $lte: now },
    }).lean();

    if (!due.length) {
      logger.info('[Email Batch] No due records found');
      return;
    }

    logger.info('[Email Batch] Processing due records', { count: due.length });

    // Group by: recipientEmail + notificationType family + entityParentId
    const groups = new Map();
    for (const record of due) {
      const typeFamily = getTypeFamily(record.notificationType);
      const key = `${record.recipientEmail}|${typeFamily}|${record.entityParentId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record._id.toString());
    }

    logger.info('[Email Batch] Groups formed', { groupCount: groups.size });

    const queue = getEmailQueue();
    let enqueued = 0;

    for (const [groupKey, ids] of groups) {
      logger.info('[Email Batch] Marking group as processing', { groupKey, count: ids.length });
      // Mark as processing to prevent double-enqueue
      await EmailNotification.updateMany(
        { _id: { $in: ids }, status: 'pending' },
        { status: 'processing' }
      );

      await queue.add('send-batch', { notificationIds: ids });
      enqueued++;
    }

    logger.info('[Email Batch] Enqueued batch jobs', { groups: enqueued, records: due.length });
  } catch (err) {
    logger.error('[Email Batch] Aggregator error', { error: err.message, stack: err.stack });
  } finally {
    // Release lock only if we still own it
    try {
      const { redis: r } = require('../services/redis');
      const current = await r.get(LOCK_KEY);
      if (current === INSTANCE_ID) await r.del(LOCK_KEY);
    } catch {
      // Non-critical — lock will expire naturally
    }
  }
}

/**
 * Map individual notification types to a "family" for grouping purposes.
 * Records in the same family with the same recipient+lead are grouped into one email.
 */
function getTypeFamily(type) {
  const CLIENT_ACTIVITY = ['document_upload', 'document_reupload', 'checklist_requested', 'comment_by_client'];
  const ADMIN_ACTION = ['document_approved', 'document_reviewed', 'comment_to_client'];

  if (CLIENT_ACTIVITY.includes(type)) return 'client_activity';
  if (ADMIN_ACTION.includes(type)) return 'admin_action';
  if (type === 'review_requested') return 'review_requested';
  return type; // fallback: each type is its own family
}

function startBatchAggregator() {
  if (cronJob) return; // already running

  const intervalMinutes = parseInt(process.env.EMAIL_BATCH_CRON_INTERVAL || '15', 10);
  const cronExpression = `*/${intervalMinutes} * * * *`;
  const timezone = process.env.CRON_TIMEZONE || 'UTC';

  cronJob = cron.schedule(cronExpression, async () => {
    try {
      await runAggregator();
    } catch (err) {
      logger.error('[Email Batch] Unhandled aggregator error', { error: err.message });
    }
  }, { scheduled: true, timezone });

  logger.info('[Email Batch] Aggregator cron started', { intervalMinutes, timezone });
}

function stopBatchAggregator() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
}

module.exports = { startBatchAggregator, stopBatchAggregator, runAggregator };
