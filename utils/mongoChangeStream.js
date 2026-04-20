'use strict';

/**
 * MongoDB Change Stream → OpenSearch Real-time Sync
 * ─────────────────────────────────────────────────────────────────────────────
 * Watches DmsZohoClient for insert / update / replace / delete events and
 * immediately syncs them to OpenSearch.
 *
 * Replaces the 15-minute incremental cron — changes appear in OpenSearch
 * within milliseconds of the MongoDB write.
 *
 * Resume token is stored in Redis so no events are lost across restarts.
 *
 * Disable via env: DISABLE_MONGO_CHANGE_STREAM=true
 */

const logger = require('../utils/logger');
const { redis } = require('../services/redis');

const RESUME_TOKEN_KEY = 'mongo_cs_resume_token';
const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

let changeStream = null;
let reconnectTimer = null;
let stopped = false;

const WATCH_PIPELINE = [
  { $match: { operationType: { $in: ['insert', 'update', 'replace', 'delete'] } } },
];

async function getResumeToken() {
  if (!redis) return null;
  try {
    const token = await redis.get(RESUME_TOKEN_KEY);
    return token ? JSON.parse(token) : null;
  } catch {
    return null;
  }
}

async function saveResumeToken(token) {
  if (!redis || !token) return;
  try {
    await redis.set(RESUME_TOKEN_KEY, JSON.stringify(token), 'EX', 7 * 24 * 60 * 60);
  } catch {
    // non-fatal
  }
}

async function openStream(attempt = 0) {
  if (stopped) return;

  // Lazy-load to avoid circular deps at module load time
  const DmsZohoClient = require('../models/dmsZohoClient');
  const { upsertApplication, deleteApplication } = require('../services/opensearchService');

  const resumeToken = await getResumeToken();
  const options = { fullDocument: 'updateLookup' };
  if (resumeToken) options.resumeAfter = resumeToken;

  try {
    changeStream = DmsZohoClient.watch(WATCH_PIPELINE, options);

    changeStream.on('change', async (event) => {
      try {
        await saveResumeToken(event._id);

        if (event.operationType === 'delete') {
          const leadId = event.documentKey?._id?.toString();
          if (leadId) await deleteApplication(leadId);
        } else {
          const doc = event.fullDocument;
          if (doc?.lead_id) await upsertApplication(doc);
        }
      } catch (err) {
        logger.error('[MongoChangeStream] Failed to sync event', {
          operationType: event.operationType,
          error: err.message,
        });
      }
    });

    changeStream.on('error', async (err) => {
      // Standalone MongoDB does not support change streams — stop silently
      if (err.message?.includes('replica set') || err.message?.includes('oplog')) {
        logger.warn('[MongoChangeStream] MongoDB is not a replica set — change stream disabled. Using incremental cron instead.');
        stopped = true;
        await closeStream();
        return;
      }
      logger.error('[MongoChangeStream] Stream error — will reconnect', { error: err.message });
      await closeStream();
      scheduleReconnect(attempt + 1);
    });

    changeStream.on('close', () => {
      if (!stopped) {
        logger.warn('[MongoChangeStream] Stream closed unexpectedly — will reconnect');
        scheduleReconnect(attempt + 1);
      }
    });

    logger.info('[MongoChangeStream] Started', { resumed: Boolean(resumeToken) });
    attempt = 0; // reset backoff on success
  } catch (err) {
    if (err.message?.includes('replica set') || err.message?.includes('oplog')) {
      logger.warn('[MongoChangeStream] MongoDB is not a replica set — change stream disabled. Using incremental cron instead.');
      stopped = true;
      return;
    }
    logger.error('[MongoChangeStream] Failed to open stream', { error: err.message });
    scheduleReconnect(attempt + 1);
  }
}

function scheduleReconnect(attempt) {
  if (stopped) return;
  const delay = Math.min(RECONNECT_BASE_MS * 2 ** Math.min(attempt - 1, 4), RECONNECT_MAX_MS);
  logger.info(`[MongoChangeStream] Reconnecting in ${delay}ms (attempt ${attempt})`);
  reconnectTimer = setTimeout(() => openStream(attempt), delay);
}

async function closeStream() {
  if (changeStream) {
    try { await changeStream.close(); } catch { /* ignore */ }
    changeStream = null;
  }
}

function startChangeStream() {
  if (process.env.DISABLE_MONGO_CHANGE_STREAM === 'true') {
    logger.info('[MongoChangeStream] Disabled via DISABLE_MONGO_CHANGE_STREAM env var');
    return;
  }
  stopped = false;
  openStream(0);
}

async function stopChangeStream() {
  stopped = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  await closeStream();
  logger.info('[MongoChangeStream] Stopped');
}

module.exports = { startChangeStream, stopChangeStream };
