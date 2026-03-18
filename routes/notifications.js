'use strict';

const express = require('express');
const router = express.Router();
const { protectClient } = require('../controllers/dmsZohoClientController');
const DmsZohoClient = require('../models/dmsZohoClient');
const logger = require('../utils/logger');

const MAX_TOKENS_PER_USER = 10;
const VALID_PLATFORMS = ['mobile', 'desktop', 'web'];

router.post('/register-token', protectClient, async (req, res) => {
  try {
    const { userId, token, platform, userAgent } = req.body;

    if (!userId || !token || !platform) {
      return res.status(400).json({ status: 'fail', message: 'Missing required fields: userId, token, platform' });
    }
    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({ status: 'fail', message: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` });
    }
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ status: 'fail', message: 'Unauthorized' });
    }

    const client = await DmsZohoClient.findById(userId);
    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client not found' });
    }

    const now = new Date();
    const existingIndex = client.fcmTokens.findIndex(t => t.token === token);

    if (existingIndex !== -1) {
      client.fcmTokens[existingIndex].updatedAt  = now;
      client.fcmTokens[existingIndex].lastUsedAt = now;
      client.fcmTokens[existingIndex].platform   = platform;
      client.fcmTokens[existingIndex].userAgent  = userAgent || '';
      client.fcmTokens[existingIndex].isActive   = true;
    } else {
      client.fcmTokens.push({
        token,
        platform,
        userAgent: userAgent || '',
        createdAt:  now,
        updatedAt:  now,
        lastUsedAt: now,
        isActive:   true,
      });

      if (client.fcmTokens.length > MAX_TOKENS_PER_USER) {
        client.fcmTokens.sort((a, b) => b.updatedAt - a.updatedAt);
        client.fcmTokens = client.fcmTokens.slice(0, MAX_TOKENS_PER_USER);
      }
    }

    await client.save();

    logger.info('[FCM] Token registered', { userId, platform });
    return res.json({ status: 'success' });

  } catch (err) {
    logger.error('[FCM] register-token error', { error: err.message });
    return res.status(500).json({ status: 'fail', message: 'Internal server error' });
  }
});

module.exports = router;
