'use strict';

const admin = require('./firebaseAdmin');
const logger = require('../../utils/logger');

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);


async function sendToUser(userId, { title, body, icon, data = {} }) {
  const DmsZohoClient = require('../../models/dmsZohoClient');

  const client = await DmsZohoClient.findById(userId);
  if (!client) {
    logger.warn('[FCM] Client not found', { userId });
    return { sent: 0, dead: 0 };
  }

  const activeTokens = client.fcmTokens.filter(t => t.isActive);
  if (activeTokens.length === 0) {
    return { sent: 0, dead: 0 };
  }

  const stringData = {};
  for (const [k, v] of Object.entries(data)) {
    stringData[k] = String(v);
  }

  const messages = activeTokens.map(t => ({
    token: t.token,
    notification: {
      title,
      body,
      ...(icon && { imageUrl: icon }),
    },
    webpush: {
      notification: {
        icon: icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: stringData.tag || 'worldvisa-notification',
        renotify: true,
        requireInteraction: false,
      },
      fcmOptions: {
        link: stringData.url || '/',
      },
    },
    data: {
      url: '/',
      tag: 'worldvisa-notification',
      ...stringData,
    },
  }));

  const batchResponse = await admin.messaging().sendEach(messages);

  const deadTokens = [];
  const now = new Date();

  batchResponse.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const code = resp.error?.code;
      if (DEAD_TOKEN_CODES.has(code)) {
        deadTokens.push(activeTokens[idx].token);
      } else {
        logger.error('[FCM] Non-dead send error', { code, error: resp.error?.message, userId });
      }
    } else {
      const entry = client.fcmTokens.find(t => t.token === activeTokens[idx].token);
      if (entry) entry.lastUsedAt = now;
    }
  });

  if (deadTokens.length > 0) {
    await DmsZohoClient.updateOne(
      { _id: userId },
      {
        $set: {
          'fcmTokens.$[elem].isActive': false,
          'fcmTokens.$[elem].updatedAt': now,
        },
      },
      { arrayFilters: [{ 'elem.token': { $in: deadTokens } }] }
    );
    logger.info(`[FCM] Marked ${deadTokens.length} dead token(s) for user ${userId}`);
  } else {
    await client.save();
  }

  return { sent: batchResponse.successCount, dead: deadTokens.length };
}


async function sendToUsers(userIds, payload) {
  const BATCH_SIZE = 100;
  const results = { sent: 0, dead: 0, errors: 0 };

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (uid) => {
        try {
          const r = await sendToUser(uid, payload);
          results.sent += r.sent;
          results.dead += r.dead;
        } catch (err) {
          results.errors++;
          logger.error('[FCM] sendToUser failed', { userId: uid, error: err.message });
        }
      })
    );
  }

  return results;
}

module.exports = { sendToUser, sendToUsers };
