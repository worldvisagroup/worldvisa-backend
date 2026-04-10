export type PresenceStatus = 'online' | 'idle' | 'offline';
export interface PresenceData {
    status: PresenceStatus;
    lastSeen: string | null;
}
export interface PresenceUpdatePayload {
    userId: string;
    status: PresenceStatus;
    lastSeen: string | null;
}
export interface PresenceSnapshotPayload {
    presences: Record<string, PresenceData>;
}
export interface ServerToClientEvents {
    'presence:update': (payload: PresenceUpdatePayload) => void;
    'presence:snapshot': (payload: PresenceSnapshotPayload) => void;
}
export interface ClientToServerEvents {
    'presence:heartbeat': () => void;
    'presence:activity': () => void;
    'presence:subscribe': (payload: {
        userIds: string[];
    }) => void;
}
