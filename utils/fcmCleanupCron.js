'use strict';

const cron = require('node-cron');
const logger = require('./logger');

const STALE_TOKEN_DAYS = 60;

function startFcmCleanupCron() {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      const DmsZohoClient = require('../models/dmsZohoClient');
      const cutoff = new Date(Date.now() - STALE_TOKEN_DAYS * 24 * 60 * 60 * 1000);

      const result = await DmsZohoClient.updateMany(
        {
          'fcmTokens.lastUsedAt': { $lt: cutoff },
          'fcmTokens.isActive': true,
        },
        {
          $set: { 'fcmTokens.$[elem].isActive': false },
        },
        {
          arrayFilters: [
            { 'elem.lastUsedAt': { $lt: cutoff }, 'elem.isActive': true },
          ],
        }
      );

      logger.info(`[FCM Cleanup] Deactivated stale tokens on ${result.modifiedCount} document(s)`);
    } catch (err) {
      logger.error('[FCM Cleanup] Cron job failed', { error: err.message });
    }
  });

  logger.info(`[FCM Cleanup] Cron scheduled — deactivates tokens unused for ${STALE_TOKEN_DAYS}+ days at 2 AM daily`);
}

module.exports = { startFcmCleanupCron };
