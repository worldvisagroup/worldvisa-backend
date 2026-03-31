'use strict';

const express = require('express');
const router = express.Router();
const { protectClient } = require('../middleware/clerk/clerkAuth');
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

    // Accept both MongoDB _id and Zoho lead_id as valid identity proof
    const isOwner = req.user._id.toString() === userId || req.user.lead_id === userId;
    if (!isOwner) {
      return res.status(403).json({ status: 'fail', message: 'Unauthorized' });
    }

    // protectClient already loaded the full client document — reuse it
    const client = req.user;

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
