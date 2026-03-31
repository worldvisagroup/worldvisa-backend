import clerkClient from '../../lib/clerk';
import crypto from 'crypto';
import { CLIENT_ROLE, STAFF_ROLES, StaffRole } from '../../constants/roles';
import { USER_STATUS } from '../../constants/user_status';
const ZohoDmsUser: any = require('../../models/zohoDmsUser');
const DmsZohoClient: any = require('../../models/dmsZohoClient');

interface InvitationResult {
  invitationId: string;
  userUpdated: boolean;
}

interface BootstrapInviteInput {
  email: string;
  role: StaffRole;
  username: string;
  bootstrapToken: string | undefined;
}

const redirectUrl = process.env.NODE_ENV === 'production' ? `${process.env.FRONTEND_URL}` : "http://localhost:3001";

function isValidBootstrapToken(providedToken: string | undefined): boolean {
  const expectedToken = process.env.CLERK_BOOTSTRAP_TOKEN;
  if (!expectedToken || !providedToken) return false;

  const expected = Buffer.from(expectedToken, 'utf8');
  const provided = Buffer.from(providedToken, 'utf8');

  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

async function canBootstrapFirstStaffInvite(): Promise<boolean> {
  const existingStaffWithClerk = await ZohoDmsUser.exists({
    role: { $in: [...STAFF_ROLES] },
    clerk_id: { $nin: [null, ''] },
  });
  return !existingStaffWithClerk;
}

async function issueInvitation(email: string, role: string, meta: Record<string, string | null> = {}) {
  return clerkClient.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role, ...meta },
    redirectUrl: `${redirectUrl}/accept-invite`
  });
}

export async function inviteExistingUser(email: string): Promise<InvitationResult> {
  const user = await ZohoDmsUser.findOne({ email });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const invitation = await issueInvitation(email, user.role, { user_id: user._id.toString(), username: user.username ?? null });

  await ZohoDmsUser.findByIdAndUpdate(user._id, {
    clerk_invitation_id: invitation.id,
    account_status: USER_STATUS.INVITED,
  });

  return { invitationId: invitation.id, userUpdated: true };
}

export async function createAndInviteNewUser(email: string, role: string, username: string): Promise<InvitationResult> {
  const [existing, existingUsername] = await Promise.all([
    ZohoDmsUser.findOne({ email }),
    ZohoDmsUser.findOne({ username }),
  ]);
  if (existing) throw Object.assign(new Error('User with this email already exists'), { status: 409 });
  if (existingUsername) throw Object.assign(new Error('Username already taken'), { status: 409 });

  const newUser = await ZohoDmsUser.create({ email, role, username, account_status: USER_STATUS.INVITED });

  const invitation = await issueInvitation(email, role, { user_id: newUser._id.toString(), username });
  await ZohoDmsUser.findByIdAndUpdate(newUser._id, { clerk_invitation_id: invitation.id });

  return { invitationId: invitation.id, userUpdated: true };
}

export async function bootstrapFirstStaffInvitation({
  email,
  role,
  username,
  bootstrapToken,
}: BootstrapInviteInput): Promise<InvitationResult> {
  const configuredToken = process.env.CLERK_BOOTSTRAP_TOKEN;
  if (!configuredToken) {
    const message = process.env.NODE_ENV === 'production'
      ? 'Bootstrap invite is not configured in production'
      : 'Bootstrap invite token is not configured';
    throw Object.assign(new Error(message), { status: 503 });
  }

  if (!isValidBootstrapToken(bootstrapToken)) {
    throw Object.assign(new Error('Invalid bootstrap token'), { status: 401 });
  }

  const allowed = await canBootstrapFirstStaffInvite();
  if (!allowed) {
    throw Object.assign(new Error('Bootstrap invite is no longer allowed'), { status: 409 });
  }

  return createAndInviteNewUser(email, role, username);
}

export async function inviteClientAfterSignup(clientId: string, email: string): Promise<void> {
  const client = await DmsZohoClient.findById(clientId);
  const invitation = await issueInvitation(email, CLIENT_ROLE, {
    user_id: clientId,
    lead_id: client?.lead_id ?? null,
  });
  await DmsZohoClient.findByIdAndUpdate(clientId, {
    clerk_invitation_id: invitation.id,
    account_status: USER_STATUS.INVITED,
  });
}

export async function inviteExistingClient(email: string): Promise<InvitationResult> {
  const client = await DmsZohoClient.findOne({ email });
  if (!client) throw Object.assign(new Error('Client not found'), { status: 404 });

  const invitation = await issueInvitation(email, CLIENT_ROLE, {
    user_id: client._id.toString(),
    lead_id: client.lead_id ?? null,
  });
  await DmsZohoClient.findByIdAndUpdate(client._id, {
    clerk_invitation_id: invitation.id,
    account_status: USER_STATUS.INVITED,
  });

  return { invitationId: invitation.id, userUpdated: true };
}

export async function revokeClerkInvitation(invitationId: string): Promise<void> {
  await clerkClient.invitations.revokeInvitation(invitationId);

  await Promise.all([
    ZohoDmsUser.findOneAndUpdate(
      { clerk_invitation_id: invitationId },
      { clerk_invitation_id: null, account_status: USER_STATUS.INACTIVE }
    ),
    DmsZohoClient.findOneAndUpdate(
      { clerk_invitation_id: invitationId },
      { clerk_invitation_id: null, account_status: USER_STATUS.INACTIVE }
    ),
  ]);
}
