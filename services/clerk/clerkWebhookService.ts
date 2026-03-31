import { USER_STATUS } from '../../constants/user_status';
import type {
  ClerkUserPayload,
  UserSyncResult,
  DeleteSyncResult,
} from '../../types/clerk.types';

const ZohoDmsUser: any = require('../../models/zohoDmsUser');
const DmsZohoClient: any = require('../../models/dmsZohoClient');

function resolvePrimaryEmail(payload: ClerkUserPayload): string | null {
  const primary = payload.email_addresses.find(
    (addr) => addr.id === payload.primary_email_address_id
  );
  return primary?.email_address ?? null;
}

function isEmailVerified(payload: ClerkUserPayload): boolean {
  const primary = payload.email_addresses.find(
    (addr) => addr.id === payload.primary_email_address_id
  );
  return primary?.verification?.status === 'verified';
}

export async function syncUserOnCreated(payload: ClerkUserPayload): Promise<UserSyncResult> {
  const email = resolvePrimaryEmail(payload);
  if (!email) throw Object.assign(new Error('No primary email in Clerk payload'), { status: 400 });

  const baseUpdate = {
    clerk_id: payload.id,
    profile_image_url: payload.image_url ?? null,
    email_verified: isEmailVerified(payload),
    account_status: USER_STATUS.ACTIVE,
    full_name: [payload.first_name, payload.last_name].filter(Boolean).join(' ') || null,
  };

  // For staff: preserve the username set at invite time (stored in Clerk public_metadata)
  // This ensures the username matches the Zoho CRM lead_owner name, not the Clerk display name
  const staffUsername = payload.public_metadata?.username;
  const staffUpdate = staffUsername ? { ...baseUpdate, username: staffUsername } : { ...baseUpdate };

  const clientUpdate = {
    ...baseUpdate,
    username: [payload.first_name, payload.last_name].filter(Boolean).join(' ') || null,
  };

  const [staffResult, clientResult] = await Promise.all([
    ZohoDmsUser.findOneAndUpdate({ email }, staffUpdate),
    DmsZohoClient.findOneAndUpdate({ email }, clientUpdate),
  ]);

  return {
    email,
    staffUpdated: staffResult !== null,
    clientUpdated: clientResult !== null,
  };
}

export async function syncUserOnUpdated(payload: ClerkUserPayload): Promise<UserSyncResult> {
  const email = resolvePrimaryEmail(payload);
  if (!email) throw Object.assign(new Error('No primary email in Clerk payload'), { status: 400 });

  // Do not touch account_status — preserve current status
  const update = {
    profile_image_url: payload.image_url ?? null,
    email_verified: isEmailVerified(payload),
    full_name: [payload.first_name, payload.last_name].filter(Boolean).join(' ') || null,
  };

  const [staffResult, clientResult] = await Promise.all([
    ZohoDmsUser.findOneAndUpdate({ email }, update),
    DmsZohoClient.findOneAndUpdate({ email }, update),
  ]);

  return {
    email,
    staffUpdated: staffResult !== null,
    clientUpdated: clientResult !== null,
  };
}

export async function syncUserOnDeleted(clerkId: string): Promise<DeleteSyncResult> {
  const update = { account_status: USER_STATUS.DELETED };

  const [staffResult, clientResult] = await Promise.all([
    ZohoDmsUser.findOneAndUpdate({ clerk_id: clerkId }, update),
    DmsZohoClient.findOneAndUpdate({ clerk_id: clerkId }, update),
  ]);

  return {
    staffUpdated: staffResult !== null,
    clientUpdated: clientResult !== null,
  };
}
