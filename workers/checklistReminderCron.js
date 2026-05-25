'use strict';

const cron = require('node-cron');
const crypto = require('crypto');
const DmsZohoClient = require('../models/dmsZohoClient');
const DmsZohoDocument = require('../models/dmsZohoDocument');
const ZohoDmsUser = require('../models/zohoDmsUser');
const { createEmailNotification } = require('../services/notifications/notificationService');
const logger = require('../utils/logger');

const INSTANCE_ID = crypto.randomUUID();
const LOCK_KEY = 'checklist:reminder:lock';
const LOCK_TTL_SECONDS = 5 * 60;
const REMINDER_INTERVAL_MS = 10 * 24 * 60 * 60 * 1000; // 10 days
const BATCH_SIZE = 50;
const SUBMITTED_STATUSES = ['pending', 'reviewed', 'request_review', 'approved'];

let cronJob = null;

async function runChecklistReminders() {
  const { redis } = require('../services/redis');

  logger.info('[Checklist Reminder] Cron tick', { instanceId: INSTANCE_ID, time: new Date().toISOString() });

  if (!redis) {
    logger.warn('[Checklist Reminder] Redis not available — skipping run');
    return;
  }

  const acquired = await redis.set(LOCK_KEY, INSTANCE_ID, 'EX', LOCK_TTL_SECONDS, 'NX');
  if (!acquired) {
    logger.debug('[Checklist Reminder] Lock not acquired — another instance is processing');
    return;
  }

  logger.info('[Checklist Reminder] Lock acquired', { instanceId: INSTANCE_ID });

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - REMINDER_INTERVAL_MS);
    let lastId = null;
    let totalSent = 0;
    let totalSkipped = 0;

    while (true) {
      const query = {
        'checklist.required': true,
        $or: [
          { last_checklist_reminder_sent_at: null },
          { last_checklist_reminder_sent_at: { $lte: cutoff } },
        ],
      };
      if (lastId) query._id = { $gt: lastId };

      const clients = await DmsZohoClient.find(query)
        .select('name email lead_id checklist last_checklist_reminder_sent_at lead_owner')
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .lean();

      if (!clients.length) break;

      lastId = clients[clients.length - 1]._id;

      // Bulk-fetch case officer display names for this batch
      const uniqueOwners = [...new Set(clients.map((c) => c.lead_owner).filter(Boolean))];
      const staffUsers = await ZohoDmsUser.find({ username: { $in: uniqueOwners } })
        .select('username full_name')
        .lean();
      const nameByUsername = Object.fromEntries(staffUsers.map((u) => [u.username, u.full_name]));

      // Bulk-fetch documents for this batch of leads
      const leadIds = clients.map((c) => c.lead_id).filter(Boolean);
      const documents = await DmsZohoDocument.find({
        record_id: { $in: leadIds },
        status: { $in: SUBMITTED_STATUSES },
      })
        .select('record_id document_type document_category')
        .lean();

      // Group submitted document keys by lead_id
      const submittedByLead = {};
      for (const doc of documents) {
        if (!submittedByLead[doc.record_id]) submittedByLead[doc.record_id] = new Set();
        submittedByLead[doc.record_id].add(`${doc.document_category}:${doc.document_type}`);
      }

      const remindersSent = [];

      for (const client of clients) {
        if (!client.email || !client.lead_id) {
          totalSkipped++;
          continue;
        }

        const submitted = submittedByLead[client.lead_id] ?? new Set();
        const missingDocs = (client.checklist || []).filter(
          (item) =>
            item.required &&
            !submitted.has(`${item.document_category}:${item.document_type}`)
        );

        if (!missingDocs.length) {
          totalSkipped++;
          continue;
        }

        try {
          await createEmailNotification({
            recipientRole: 'client',
            recipientEmail: client.email,
            recipientName: client.name,
            notificationType: 'checklist_reminder',
            entityParentId: client.lead_id,
            subject: 'Reminder: Outstanding Documents Required for Your Visa Application',
            templateData: {
              missingDocuments: missingDocs.map((d) => ({
                document_type: d.document_type,
                document_category: d.document_category,
              })),
              caseOfficerName: nameByUsername[client.lead_owner] || client.lead_owner || null,
            },
          });

          remindersSent.push(client._id);
          totalSent++;
        } catch (err) {
          logger.error('[Checklist Reminder] Failed to create email notification', {
            clientId: client._id,
            leadId: client.lead_id,
            error: err.message,
          });
        }
      }

      // Bulk-update all clients that had a reminder sent
      if (remindersSent.length) {
        const updateTime = new Date();
        await DmsZohoClient.updateMany(
          { _id: { $in: remindersSent } },
          {
            $set: {
              last_checklist_reminder_sent_at: updateTime,
              last_communication_activity: updateTime,
              last_communication_provider: 'email',
            },
          }
        );
      }
    }

    logger.info('[Checklist Reminder] Run complete', { totalSent, totalSkipped });
  } catch (err) {
    logger.error('[Checklist Reminder] Unexpected error during run', { error: err.message, stack: err.stack });
  } finally {
    try {
      const { redis } = require('../services/redis');
      if (redis) await redis.del(LOCK_KEY);
    } catch (_) {
      // ignore lock release errors
    }
  }
}

const SCHEDULE = process.env.CHECKLIST_REMINDER_CRON_SCHEDULE || '0 9 * * *';

const task = cron.schedule(SCHEDULE, runChecklistReminders, {
  scheduled: false,
  timezone: process.env.CRON_TIMEZONE || 'UTC',
});

function startChecklistReminderCron() {
  task.start();
  logger.info(`[Checklist Reminder] Cron started (schedule: ${SCHEDULE})`);
}

module.exports = { startChecklistReminderCron, runChecklistReminders };
