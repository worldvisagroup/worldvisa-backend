'use strict';

const { Worker } = require('bullmq');
const { connection } = require('../services/redis');
const { addNotificationAndEmit } = require('../controllers/helper/service/notifications');
const ChatMessage = require('../models/chatMessage');
const ChatConversation = require('../models/chatConversation');
const ZohoDmsUser = require('../models/zohoDmsUser');
const logger = require('../utils/logger');

const DELAYS = [
  parseInt(process.env.CHAT_REMINDER_DELAY_1_MS || '900000',  10), // 15 min — initial
  parseInt(process.env.CHAT_REMINDER_DELAY_2_MS || '1800000', 10), // 30 min after reminder 1
  parseInt(process.env.CHAT_REMINDER_DELAY_3_MS || '2700000', 10), // 45 min after reminder 2
];

const MAX_REMINDERS = 3;

let worker = null;

function createWorker(app) {
  if (worker) return worker;

  if (!connection) {
    logger.warn('[Chat Reminder Worker] Redis not available — worker not started');
    return { close: async () => {} };
  }

  const mockReq = { app };

  worker = new Worker(
    'chat-reminders',
    async (job) => {
      const { conversationId, triggerMessageId, reminderCount } = job.data;

      // Supersession check — if a newer client message exists, this chain is stale
      const latestClientMsg = await ChatMessage.findOne(
        { conversationId, 'sender.type': 'client', deletedAt: null },
        { _id: 1 },
        { sort: { createdAt: -1 } }
      ).lean();

      if (!latestClientMsg || latestClientMsg._id.toString() !== triggerMessageId) {
        logger.info('[Chat Reminder] Superseded — newer client message exists or trigger deleted', {
          conversationId, triggerMessageId, reminderCount,
        });
        return;
      }

      // Staff-reply check — any staff message after the trigger message means chain is done
      const triggerMsg = await ChatMessage.findById(triggerMessageId, { createdAt: 1 }).lean();
      if (!triggerMsg) {
        logger.info('[Chat Reminder] Trigger message no longer exists', { triggerMessageId });
        return;
      }

      const staffReply = await ChatMessage.findOne(
        { conversationId, 'sender.type': 'staff', createdAt: { $gt: triggerMsg.createdAt }, deletedAt: null },
        { _id: 1 }
      ).lean();

      if (staffReply) {
        logger.info('[Chat Reminder] Staff already replied — stopping chain', { conversationId, reminderCount });
        return;
      }

      // Load conversation to get staff participants and display label
      const conv = await ChatConversation.findById(conversationId, { participants: 1, type: 1, name: 1 }).lean();
      if (!conv) {
        logger.warn('[Chat Reminder] Conversation not found', { conversationId });
        return;
      }

      const staffParticipants = conv.participants.filter(p => p.type === 'staff');
      if (!staffParticipants.length) return;

      const convLabel = conv.type === 'group' ? (conv.name || 'a group chat') : 'a client';
      const title   = `Unread client message (reminder ${reminderCount} of ${MAX_REMINDERS})`;
      const message = `A client message in ${convLabel} is still awaiting your reply.`;
      const link    = `/v2/messages/${conversationId}`;

      // Send in-app notification to each staff participant
      await Promise.allSettled(
        staffParticipants.map(p =>
          addNotificationAndEmit({
            req: mockReq,
            userId: p.id,
            title,
            message,
            type: 'info',
            category: 'chat',
            source: 'chat',
            link,
            sender_type: 'client',
          })
        )
      );

      logger.info('[Chat Reminder] Reminders sent', {
        conversationId, reminderCount, staffCount: staffParticipants.length,
      });

      // Decrement support_ratio for all notified staff (fire-and-forget)
      const decrement = parseInt(process.env.CHAT_REMINDER_RATIO_DECREMENT || '5', 10);
      ZohoDmsUser.updateMany(
        { _id: { $in: staffParticipants.map(p => p.id) } },
        [{ $set: { support_ratio: { $max: [0, { $subtract: [{ $ifNull: ['$support_ratio', 100] }, decrement] }] } } }]
      ).catch(err =>
        logger.warn('[Chat Reminder] support_ratio decrement failed', { error: err.message })
      );

      // Schedule next reminder if not at the max
      if (reminderCount < MAX_REMINDERS) {
        const nextCount = reminderCount + 1;
        const delay     = DELAYS[nextCount - 1];
        try {
          const { getChatReminderQueue } = require('../queues/chatReminderQueue');
          const queue = getChatReminderQueue();
          const jobId = `chat-reminder:${conversationId}:r${nextCount}:${triggerMessageId}`;
          await queue.add('send-reminder', { conversationId, triggerMessageId, reminderCount: nextCount }, { delay, jobId });
          logger.info('[Chat Reminder] Next reminder enqueued', { jobId, delay, nextCount });
        } catch (enqErr) {
          logger.error('[Chat Reminder] Failed to enqueue next reminder', { error: enqErr.message });
        }
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on('completed', (job) => {
    logger.info('[Chat Reminder Worker] Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('[Chat Reminder Worker] Job failed', {
      jobId:   job?.id,
      attempt: job?.attemptsMade,
      error:   err.message,
    });
  });

  worker.on('error', (err) => {
    logger.error('[Chat Reminder Worker] Worker error', { error: err.message });
  });

  logger.info('[Chat Reminder Worker] Worker started');
  return worker;
}

module.exports = { createWorker };
