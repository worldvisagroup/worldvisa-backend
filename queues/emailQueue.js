const { Queue } = require('bullmq');
const { connection } = require('../services/redis');

let emailQueue = null;

function getEmailQueue() {
  if (!emailQueue) {
    if (!connection) {
      throw new Error('Redis connection not available for email queue');
    }
    emailQueue = new Queue('email-notifications', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return emailQueue;
}

module.exports = { getEmailQueue };
