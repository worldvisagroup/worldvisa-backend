'use strict';

const { Worker } = require('bullmq');
const { connection } = require('../services/redis');
const EmailService = require('../services/notifications/emailService');
const logger = require('../utils/logger');

let worker = null;

function createWorker() {
  if (worker) return worker;

  if (!connection) {
    logger.warn('[Email Worker] Redis connection not available — worker not started');
    return { close: async () => {} };
  }

  const concurrency = parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5', 10);

  worker = new Worker(
    'email-notifications',
    async (job) => {
      if (job.name === 'send-immediate') {
        await EmailService.sendSingle(job.data.notificationId);
      } else if (job.name === 'send-batch') {
        await EmailService.sendBatch(job.data.notificationIds);
      } else {
        logger.warn('[Email Worker] Unknown job name', { jobName: job.name, jobId: job.id });
      }
    },
    { connection, concurrency }
  );

  worker.on('completed', (job) => {
    logger.info('[Email Worker] Job completed', { jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, err) => {
    logger.error('[Email Worker] Job failed', {
      jobId: job?.id,
      jobName: job?.name,
      attempt: job?.attemptsMade,
      error: err.message,
    });
  });

  worker.on('error', (err) => {
    logger.error('[Email Worker] Worker error', { error: err.message });
  });

  logger.info('[Email Worker] Worker started', { concurrency });
  return worker;
}

module.exports = { createWorker };
