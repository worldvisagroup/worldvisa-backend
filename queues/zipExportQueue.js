const { Queue } = require('bullmq');
const { connection } = require('../services/redis');

const zipExportQueue = new Queue('zip-export', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

module.exports = zipExportQueue;
