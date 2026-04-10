/**
 * Presence Socket Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Registers all presence-related Socket.io listeners for one connected socket.
 * Called once from app.js inside the existing io.on('connection') block.
 *
 * Broadcast strategy:
 *   - `presence:sub:{userId}` — sockets that subscribed via presence:subscribe
 *   - `user:{userId}`         — the user's own sockets (always receive own status)
 *
 * All event handlers are wrapped in try/catch — socket errors must never
 * bubble up and crash the process.
 */

import type { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PresenceStatus,
  PresenceUpdatePayload,
} from '../types/presence.types';
import * as presenceService from '../services/presenceService';

const logger = require('../utils/logger');

// ─── Types ────────────────────────────────────────────────────────────────────

type PresenceServer = Server<ClientToServerEvents, ServerToClientEvents>;
type PresenceSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  userId: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function broadcast(
  io: PresenceServer,
  userId: string,
  status: PresenceStatus,
  lastSeen: string | null,
): void {
  const payload: PresenceUpdatePayload = { userId, status, lastSeen };
  io.to(`presence:sub:${userId}`).emit('presence:update', payload);
  io.to(`user:${userId}`).emit('presence:update', payload);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function registerPresenceHandlers(
  io: PresenceServer,
  socket: PresenceSocket,
): Promise<void> {
  const { userId } = socket;

  // ── CONNECT ──────────────────────────────────────────────────────────────────
  try {
    const newStatus = await presenceService.handleConnect(userId);
    const presence  = await presenceService.getPresence(userId);
    broadcast(io, userId, newStatus, presence.lastSeen);
  } catch (err: any) {
    logger.warn('[PresenceHandler] connect error', { userId, error: err.message });
  }

  // ── presence:heartbeat ───────────────────────────────────────────────────────
  socket.on('presence:heartbeat', async () => {
    try {
      const changedStatus = await presenceService.handleHeartbeat(userId);
      if (changedStatus !== null) {
        const presence = await presenceService.getPresence(userId);
        broadcast(io, userId, changedStatus, presence.lastSeen);
      }
    } catch (err: any) {
      logger.warn('[PresenceHandler] heartbeat error', { userId, error: err.message });
    }
  });

  // ── presence:activity ────────────────────────────────────────────────────────
  socket.on('presence:activity', async () => {
    try {
      const changedStatus = await presenceService.handleActivity(userId);
      if (changedStatus !== null) {
        const presence = await presenceService.getPresence(userId);
        broadcast(io, userId, changedStatus, presence.lastSeen);
      }
    } catch (err: any) {
      logger.warn('[PresenceHandler] activity error', { userId, error: err.message });
    }
  });

  // ── presence:subscribe ───────────────────────────────────────────────────────
  socket.on('presence:subscribe', async ({ userIds } = { userIds: [] }) => {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) return;

      const targets = userIds.slice(0, 50); // hard cap per subscribe call

      for (const uid of targets) {
        socket.join(`presence:sub:${uid}`);
      }

      const presences = await presenceService.getBulkPresence(targets);
      socket.emit('presence:snapshot', { presences });
    } catch (err: any) {
      logger.warn('[PresenceHandler] subscribe error', { userId, error: err.message });
    }
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────────
  socket.on('disconnect', async (reason) => {
    try {
      const changedStatus = await presenceService.handleDisconnect(userId);
      // null = other tabs still open, no broadcast needed
      if (changedStatus !== null) {
        const presence = await presenceService.getPresence(userId);
        broadcast(io, userId, changedStatus, presence.lastSeen);
      }
    } catch (err: any) {
      logger.warn('[PresenceHandler] disconnect error', { userId, reason, error: err.message });
    }
  });
}
