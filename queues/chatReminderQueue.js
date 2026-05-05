'use strict';

const { Queue } = require('bullmq');
const { connection } = require('../services/redis');

let chatReminderQueue = null;

function getChatReminderQueue() {
  if (!chatReminderQueue) {
    if (!connection) {
      throw new Error('Redis connection not available for chat reminder queue');
    }
    chatReminderQueue = new Queue('chat-reminders', {
      connection,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    });
  }
  return chatReminderQueue;
}

module.exports = { getChatReminderQueue };
