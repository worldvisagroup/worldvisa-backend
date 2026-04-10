"use strict";
/**
 * Presence Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Primary store : Redis (TTL-based heartbeat)
 * Fallback      : MongoDB online_status field (when Redis is unavailable)
 * DB writes     : debounced 5 s, fire-and-forget
 *
 * Redis key schema:
 *   presence:status:{userId}      "online" | "idle" | "offline"   no TTL
 *   presence:heartbeat:{userId}   "1"                              TTL: 60 s
 *   presence:sockets:{userId}     integer count (string)           no TTL
 *   presence:lastseen:{userId}    ISO-8601 timestamp               no TTL
 *   presence:lastactive:{userId}  Unix ms string                   no TTL
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS = void 0;
exports.handleConnect = handleConnect;
exports.handleDisconnect = handleDisconnect;
exports.handleHeartbeat = handleHeartbeat;
exports.handleActivity = handleActivity;
exports.getPresence = getPresence;
exports.getBulkPresence = getBulkPresence;
// CommonJS interop via tsx
const { redis, isRedisConnected, isRedisDisabled } = require('./redis');
const logger = require('../utils/logger');
// ─── Constants ────────────────────────────────────────────────────────────────
const HEARTBEAT_TTL = 60; // seconds — client pings every 25 s
const IDLE_THRESHOLD = 5 * 60000; // 5 minutes in ms
const DB_DEBOUNCE = 5000; // 5 seconds
exports.STATUS = Object.freeze({
    ONLINE: 'online',
    IDLE: 'idle',
    OFFLINE: 'offline',
});
// ─── In-process state ─────────────────────────────────────────────────────────
const dbDebounceTimers = new Map();
const idleTimers = new Map();
// ─── Helpers ──────────────────────────────────────────────────────────────────
function redisAvailable() {
    return !isRedisDisabled() && isRedisConnected() && redis != null;
}
function k(type, userId) {
    return `presence:${type}:${userId}`;
}
function scheduleDbWrite(userId, status) {
    const existing = dbDebounceTimers.get(userId);
    if (existing)
        clearTimeout(existing);
    const timer = setTimeout(() => {
        dbDebounceTimers.delete(userId);
        writeToMongo(userId, status).catch(() => { });
    }, DB_DEBOUNCE);
    if (timer.unref)
        timer.unref();
    dbDebounceTimers.set(userId, timer);
}
async function writeToMongo(userId, status) {
    try {
        const ZohoDmsUser = require('../models/zohoDmsUser');
        const DmsZohoClient = require('../models/dmsZohoClient');
        const isOnline = status !== exports.STATUS.OFFLINE;
        const staffResult = await ZohoDmsUser
            .findByIdAndUpdate(userId, { online_status: isOnline }, { new: false })
            .lean();
        if (staffResult)
            return;
        await DmsZohoClient
            .findByIdAndUpdate(userId, { online_status: isOnline }, { new: false })
            .lean();
    }
    catch (err) {
        logger.warn('[Presence] MongoDB write failed (non-fatal)', { userId, error: err.message });
    }
}
function resetIdleTimer(userId, onIdle) {
    clearIdleTimer(userId);
    const timer = setTimeout(() => {
        idleTimers.delete(userId);
        onIdle(userId);
    }, IDLE_THRESHOLD);
    if (timer.unref)
        timer.unref();
    idleTimers.set(userId, timer);
}
function clearIdleTimer(userId) {
    const t = idleTimers.get(userId);
    if (t) {
        clearTimeout(t);
        idleTimers.delete(userId);
    }
}
async function transitionToIdle(userId) {
    if (!redisAvailable())
        return null;
    try {
        const current = await redis.get(k('status', userId));
        if (current !== exports.STATUS.ONLINE)
            return null;
        await redis.set(k('status', userId), exports.STATUS.IDLE);
        scheduleDbWrite(userId, exports.STATUS.IDLE);
        return exports.STATUS.IDLE;
    }
    catch (err) {
        logger.warn('[Presence] transitionToIdle error', { userId, error: err.message });
        return null;
    }
}
async function getPresenceFromMongo(userId) {
    try {
        const ZohoDmsUser = require('../models/zohoDmsUser');
        const DmsZohoClient = require('../models/dmsZohoClient');
        let doc = await ZohoDmsUser.findById(userId).select('online_status').lean();
        if (!doc)
            doc = await DmsZohoClient.findById(userId).select('online_status').lean();
        return {
            userId,
            status: doc?.online_status ? exports.STATUS.ONLINE : exports.STATUS.OFFLINE,
            lastSeen: null,
        };
    }
    catch {
        return { userId, status: exports.STATUS.OFFLINE, lastSeen: null };
    }
}
/**
 * Lazily correct Redis state when heartbeat TTL expired but status still shows online.
 * Called from getPresence/getBulkPresence — avoids polling.
 */
async function markOfflineFromExpiry(userId) {
    if (!redisAvailable())
        return;
    try {
        const socketCount = await redis.get(k('sockets', userId));
        if (socketCount && parseInt(socketCount, 10) > 0)
            return; // reconnect in progress
        const pipeline = redis.pipeline();
        pipeline.set(k('status', userId), exports.STATUS.OFFLINE);
        pipeline.set(k('lastseen', userId), new Date().toISOString());
        pipeline.del(k('sockets', userId));
        await pipeline.exec();
        clearIdleTimer(userId);
        scheduleDbWrite(userId, exports.STATUS.OFFLINE);
    }
    catch (err) {
        logger.warn('[Presence] markOfflineFromExpiry error', { userId, error: err.message });
    }
}
// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Call on socket connect.
 * INCR socket counter; on first connection, transitions to online.
 */
async function handleConnect(userId) {
    if (!redisAvailable()) {
        await writeToMongo(userId, exports.STATUS.ONLINE);
        return exports.STATUS.ONLINE;
    }
    try {
        const pipeline = redis.pipeline();
        pipeline.incr(k('sockets', userId));
        pipeline.set(k('status', userId), exports.STATUS.ONLINE);
        pipeline.set(k('lastactive', userId), Date.now().toString());
        pipeline.set(k('lastseen', userId), new Date().toISOString());
        pipeline.set(k('heartbeat', userId), '1', 'EX', HEARTBEAT_TTL);
        const results = await pipeline.exec();
        const socketCount = results[0][1];
        if (socketCount === 1) {
            scheduleDbWrite(userId, exports.STATUS.ONLINE);
        }
        resetIdleTimer(userId, (uid) => transitionToIdle(uid).catch(() => { }));
        return exports.STATUS.ONLINE;
    }
    catch (err) {
        logger.warn('[Presence] handleConnect Redis error', { userId, error: err.message });
        await writeToMongo(userId, exports.STATUS.ONLINE);
        return exports.STATUS.ONLINE;
    }
}
/**
 * Call on socket disconnect.
 * DECR socket counter; transitions to offline only when last socket closes.
 * Returns null when other sockets are still open (no status change).
 */
async function handleDisconnect(userId) {
    if (!redisAvailable()) {
        await writeToMongo(userId, exports.STATUS.OFFLINE);
        return exports.STATUS.OFFLINE;
    }
    try {
        const count = await redis.decr(k('sockets', userId));
        const remaining = Math.max(count, 0);
        if (remaining <= 0) {
            await redis.del(k('sockets', userId));
            const pipeline = redis.pipeline();
            pipeline.set(k('status', userId), exports.STATUS.OFFLINE);
            pipeline.set(k('lastseen', userId), new Date().toISOString());
            pipeline.del(k('heartbeat', userId));
            pipeline.del(k('lastactive', userId));
            await pipeline.exec();
            clearIdleTimer(userId);
            scheduleDbWrite(userId, exports.STATUS.OFFLINE);
            return exports.STATUS.OFFLINE;
        }
        return null; // other tabs still open
    }
    catch (err) {
        logger.warn('[Presence] handleDisconnect Redis error', { userId, error: err.message });
        await writeToMongo(userId, exports.STATUS.OFFLINE);
        return exports.STATUS.OFFLINE;
    }
}
/**
 * Call when client sends presence:heartbeat (every 25 s).
 * Refreshes the TTL key; transitions from idle → online if needed.
 * Returns new status if changed, else null.
 */
async function handleHeartbeat(userId) {
    if (!redisAvailable())
        return null;
    try {
        // Only refresh the Redis TTL key — do NOT reset the idle timer.
        // Heartbeat keeps the connection alive; idle detection is driven by user activity only.
        await redis.set(k('heartbeat', userId), '1', 'EX', HEARTBEAT_TTL);
        return null;
    }
    catch (err) {
        logger.warn('[Presence] handleHeartbeat Redis error', { userId, error: err.message });
        return null;
    }
}
/**
 * Call when client sends presence:activity (typing, clicks, etc).
 * Resets idle timer; transitions from idle → online if needed.
 * Returns new status if changed, else null.
 */
async function handleActivity(userId) {
    if (!redisAvailable())
        return null;
    try {
        await redis.set(k('lastactive', userId), Date.now().toString());
        const current = await redis.get(k('status', userId));
        if (current === exports.STATUS.IDLE) {
            await redis.set(k('status', userId), exports.STATUS.ONLINE);
            resetIdleTimer(userId, (uid) => transitionToIdle(uid).catch(() => { }));
            scheduleDbWrite(userId, exports.STATUS.ONLINE);
            return exports.STATUS.ONLINE;
        }
        resetIdleTimer(userId, (uid) => transitionToIdle(uid).catch(() => { }));
        return null;
    }
    catch (err) {
        logger.warn('[Presence] handleActivity Redis error', { userId, error: err.message });
        return null;
    }
}
/**
 * Get current presence for a single user.
 * Redis → MongoDB fallback. Lazily corrects stale online when heartbeat expired.
 */
async function getPresence(userId) {
    if (redisAvailable()) {
        try {
            const [status, lastSeen, heartbeat] = await Promise.all([
                redis.get(k('status', userId)),
                redis.get(k('lastseen', userId)),
                redis.get(k('heartbeat', userId)),
            ]);
            let effectiveStatus = status || exports.STATUS.OFFLINE;
            // Heartbeat TTL expired but status still says online — correct lazily
            if (effectiveStatus === exports.STATUS.ONLINE && !heartbeat) {
                markOfflineFromExpiry(userId).catch(() => { });
                effectiveStatus = exports.STATUS.OFFLINE;
            }
            return { userId, status: effectiveStatus, lastSeen: lastSeen || null };
        }
        catch (err) {
            logger.warn('[Presence] getPresence Redis error, falling back to MongoDB', {
                userId,
                error: err.message,
            });
        }
    }
    return getPresenceFromMongo(userId);
}
/**
 * Get current presence for multiple users in a single Redis pipeline round-trip.
 * Falls back to parallel MongoDB queries when Redis is unavailable.
 */
async function getBulkPresence(userIds) {
    if (userIds.length === 0)
        return {};
    if (redisAvailable()) {
        try {
            const pipeline = redis.pipeline();
            for (const uid of userIds) {
                pipeline.get(k('status', uid));
                pipeline.get(k('lastseen', uid));
                pipeline.get(k('heartbeat', uid));
            }
            const results = await pipeline.exec();
            const out = {};
            for (let i = 0; i < userIds.length; i++) {
                const uid = userIds[i];
                const status = results[i * 3][1];
                const lastSeen = results[i * 3 + 1][1];
                const heartbeat = results[i * 3 + 2][1];
                let effectiveStatus = status || exports.STATUS.OFFLINE;
                if (effectiveStatus === exports.STATUS.ONLINE && !heartbeat) {
                    effectiveStatus = exports.STATUS.OFFLINE;
                    markOfflineFromExpiry(uid).catch(() => { });
                }
                out[uid] = { status: effectiveStatus, lastSeen: lastSeen || null };
            }
            return out;
        }
        catch (err) {
            logger.warn('[Presence] getBulkPresence Redis error, falling back to MongoDB', {
                error: err.message,
            });
        }
    }
    // MongoDB fallback — parallel queries
    const settled = await Promise.allSettled(userIds.map(getPresenceFromMongo));
    return Object.fromEntries(userIds.map((uid, i) => {
        const r = settled[i];
        return r.status === 'fulfilled'
            ? [uid, { status: r.value.status, lastSeen: r.value.lastSeen }]
            : [uid, { status: exports.STATUS.OFFLINE, lastSeen: null }];
    }));
}
