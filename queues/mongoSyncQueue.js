'use strict';

const { Queue } = require('bullmq');
const { connection } = require('../services/redis');

let mongoSyncQueue = null;

function getMongoSyncQueue() {
  if (!mongoSyncQueue) {
    if (!connection) {
      throw new Error('Redis connection not available for mongo sync queue');
    }
    mongoSyncQueue = new Queue('mongo-opensearch-sync', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    });
  }
  return mongoSyncQueue;
}

module.exports = { getMongoSyncQueue };
