import type { ClerkUserPayload, UserSyncResult, DeleteSyncResult } from '../../types/clerk.types';
export declare function syncUserOnCreated(payload: ClerkUserPayload): Promise<UserSyncResult>;
export declare function syncUserOnUpdated(payload: ClerkUserPayload): Promise<UserSyncResult>;
export declare function syncUserOnDeleted(clerkId: string): Promise<DeleteSyncResult>;
