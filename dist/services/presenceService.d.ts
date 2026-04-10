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
import type { PresenceStatus, PresenceData, PresenceUpdatePayload } from '../types/presence.types';
export declare const STATUS: Readonly<Record<'ONLINE' | 'IDLE' | 'OFFLINE', PresenceStatus>>;
/**
 * Call on socket connect.
 * INCR socket counter; on first connection, transitions to online.
 */
export declare function handleConnect(userId: string): Promise<PresenceStatus>;
/**
 * Call on socket disconnect.
 * DECR socket counter; transitions to offline only when last socket closes.
 * Returns null when other sockets are still open (no status change).
 */
export declare function handleDisconnect(userId: string): Promise<PresenceStatus | null>;
/**
 * Call when client sends presence:heartbeat (every 25 s).
 * Refreshes the TTL key; transitions from idle → online if needed.
 * Returns new status if changed, else null.
 */
export declare function handleHeartbeat(userId: string): Promise<PresenceStatus | null>;
/**
 * Call when client sends presence:activity (typing, clicks, etc).
 * Resets idle timer; transitions from idle → online if needed.
 * Returns new status if changed, else null.
 */
export declare function handleActivity(userId: string): Promise<PresenceStatus | null>;
/**
 * Get current presence for a single user.
 * Redis → MongoDB fallback. Lazily corrects stale online when heartbeat expired.
 */
export declare function getPresence(userId: string): Promise<PresenceUpdatePayload>;
/**
 * Get current presence for multiple users in a single Redis pipeline round-trip.
 * Falls back to parallel MongoDB queries when Redis is unavailable.
 */
export declare function getBulkPresence(userIds: string[]): Promise<Record<string, PresenceData>>;
