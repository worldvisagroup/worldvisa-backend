'use strict';

const cron = require('node-cron');
const crypto = require('crypto');
const DmsZohoAusStage2Documents = require('../models/dmsZohoAusStage2Documents');
const DmsZohoClient = require('../models/dmsZohoClient');
const { createEmailNotification } = require('../services/notifications/notificationService');
const logger = require('../utils/logger');

const INSTANCE_ID = crypto.randomUUID();
const LOCK_KEY = 'stage2:expiry:lock';
const LOCK_TTL_SECONDS = 5 * 60;
const REMINDER_INTERVAL_MS = 15 * 24 * 60 * 60 * 1000; // 15 days
const WARNING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;    // 30 days before expiry
const BATCH_SIZE = 50;

async function runStage2ExpiryReminders() {
  const { redis } = require('../services/redis');

  logger.info('[Stage2 Expiry] Cron tick', { instanceId: INSTANCE_ID, time: new Date().toISOString() });

  if (!redis) {
    logger.warn('[Stage2 Expiry] Redis not available — skipping run');
    return;
  }

  const acquired = await redis.set(LOCK_KEY, INSTANCE_ID, 'EX', LOCK_TTL_SECONDS, 'NX');
  if (!acquired) {
    logger.debug('[Stage2 Expiry] Lock not acquired — another instance is processing');
    return;
  }

  logger.info('[Stage2 Expiry] Lock acquired', { instanceId: INSTANCE_ID });

  try {
    const now = new Date();
    const reminderCutoff = new Date(now.getTime() - REMINDER_INTERVAL_MS);
    const warningStart = new Date(now.getTime() + WARNING_WINDOW_MS);
    let lastId = null;
    let totalSent = 0;
    let totalSkipped = 0;

    while (true) {
      const query = {
        outcome: 'English Language Test',
        expiry_at: { $exists: true, $ne: null, $lte: warningStart },
        $or: [
          { last_expiry_reminder_sent_at: null },
          { last_expiry_reminder_sent_at: { $lte: reminderCutoff } },
        ],
      };
      if (lastId) query._id = { $gt: lastId };

      const docs = await DmsZohoAusStage2Documents.find(query)
        .select('record_id document_name expiry_at last_expiry_reminder_sent_at')
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .lean();

      if (!docs.length) break;

      lastId = docs[docs.length - 1]._id;

      // Bulk-fetch clients for this batch
      const leadIds = [...new Set(docs.map((d) => d.record_id).filter(Boolean))];
      const clients = await DmsZohoClient.find({
        lead_id: { $in: leadIds },
        application_state: { $regex: /^active$/i },
      })
        .select('name email lead_id')
        .lean();

      const clientByLeadId = {};
      for (const c of clients) clientByLeadId[c.lead_id] = c;

      const caseOfficerEmail = process.env.EMAIL_FROM_AUSTRALIA || 'australia@worldvisa.in';
      const processedIds = [];

      for (const doc of docs) {
        const client = clientByLeadId[doc.record_id];
        if (!client?.email) {
          totalSkipped++;
          continue;
        }

        const msUntilExpiry = new Date(doc.expiry_at).getTime() - now.getTime();
        const daysUntilExpiry = Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));
        const notificationType =
          daysUntilExpiry > 0 ? 'language_test_expiry_warning' : 'language_test_expiry_overdue';

        const templateData = {
          clientName: client.name,
          documentName: doc.document_name,
          expiryDate: doc.expiry_at,
          daysUntilExpiry,
          leadId: doc.record_id,
          caseOfficerEmail,
        };

        let sent = false;

        // Send to client
        try {
          await createEmailNotification({
            recipientRole: 'client',
            recipientEmail: client.email,
            recipientName: client.name,
            notificationType,
            entityParentId: doc.record_id,
            templateData,
          });
          sent = true;
        } catch (err) {
          logger.error('[Stage2 Expiry] Failed to notify client', {
            docId: doc._id,
            leadId: doc.record_id,
            error: err.message,
          });
        }

        // Send to case officer shared inbox
        try {
          await createEmailNotification({
            recipientRole: 'admin',
            recipientEmail: caseOfficerEmail,
            recipientName: 'WorldVisa Australia Team',
            notificationType,
            entityParentId: doc.record_id,
            templateData,
          });
          sent = true;
        } catch (err) {
          logger.error('[Stage2 Expiry] Failed to notify case officer', {
            docId: doc._id,
            leadId: doc.record_id,
            error: err.message,
          });
        }

        if (sent) {
          processedIds.push(doc._id);
          totalSent++;
        } else {
          totalSkipped++;
        }
      }

      if (processedIds.length) {
        await DmsZohoAusStage2Documents.updateMany(
          { _id: { $in: processedIds } },
          { $set: { last_expiry_reminder_sent_at: now } }
        );
      }
    }

    logger.info('[Stage2 Expiry] Run complete', { totalSent, totalSkipped });
  } catch (err) {
    logger.error('[Stage2 Expiry] Unexpected error', { error: err.message, stack: err.stack });
  } finally {
    try {
      const { redis } = require('../services/redis');
      if (redis) await redis.del(LOCK_KEY);
    } catch (_) {
      // ignore lock release errors
    }
  }
}

const SCHEDULE = process.env.STAGE2_EXPIRY_CRON_SCHEDULE || '0 9 * * *';

const task = cron.schedule(SCHEDULE, runStage2ExpiryReminders, {
  scheduled: false,
  timezone: process.env.CRON_TIMEZONE || 'UTC',
});

function startStage2ExpiryReminderCron() {
  task.start();
  logger.info(`[Stage2 Expiry] Cron started (schedule: ${SCHEDULE})`);
}

module.exports = { startStage2ExpiryReminderCron, runStage2ExpiryReminders };
