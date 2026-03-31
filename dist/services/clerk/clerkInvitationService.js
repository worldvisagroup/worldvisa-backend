"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteExistingUser = inviteExistingUser;
exports.createAndInviteNewUser = createAndInviteNewUser;
exports.bootstrapFirstStaffInvitation = bootstrapFirstStaffInvitation;
exports.inviteClientAfterSignup = inviteClientAfterSignup;
exports.inviteExistingClient = inviteExistingClient;
exports.revokeClerkInvitation = revokeClerkInvitation;
const clerk_1 = __importDefault(require("../../lib/clerk"));
const crypto_1 = __importDefault(require("crypto"));
const roles_1 = require("../../constants/roles");
const user_status_1 = require("../../constants/user_status");
const ZohoDmsUser = require('../../models/zohoDmsUser');
const DmsZohoClient = require('../../models/dmsZohoClient');
const redirectUrl = process.env.NODE_ENV === 'production' ? `${process.env.FRONTEND_URL}` : "http://localhost:3001";
function isValidBootstrapToken(providedToken) {
    const expectedToken = process.env.CLERK_BOOTSTRAP_TOKEN;
    if (!expectedToken || !providedToken)
        return false;
    const expected = Buffer.from(expectedToken, 'utf8');
    const provided = Buffer.from(providedToken, 'utf8');
    if (expected.length !== provided.length)
        return false;
    return crypto_1.default.timingSafeEqual(expected, provided);
}
async function canBootstrapFirstStaffInvite() {
    const existingStaffWithClerk = await ZohoDmsUser.exists({
        role: { $in: [...roles_1.STAFF_ROLES] },
        clerk_id: { $nin: [null, ''] },
    });
    return !existingStaffWithClerk;
}
async function issueInvitation(email, role, meta = {}) {
    return clerk_1.default.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role, ...meta },
        redirectUrl: `${redirectUrl}/accept-invite`
    });
}
async function inviteExistingUser(email) {
    const user = await ZohoDmsUser.findOne({ email });
    if (!user)
        throw Object.assign(new Error('User not found'), { status: 404 });
    const invitation = await issueInvitation(email, user.role, { user_id: user._id.toString(), username: user.username ?? null });
    await ZohoDmsUser.findByIdAndUpdate(user._id, {
        clerk_invitation_id: invitation.id,
        account_status: user_status_1.USER_STATUS.INVITED,
    });
    return { invitationId: invitation.id, userUpdated: true };
}
async function createAndInviteNewUser(email, role, username) {
    const [existing, existingUsername] = await Promise.all([
        ZohoDmsUser.findOne({ email }),
        ZohoDmsUser.findOne({ username }),
    ]);
    if (existing)
        throw Object.assign(new Error('User with this email already exists'), { status: 409 });
    if (existingUsername)
        throw Object.assign(new Error('Username already taken'), { status: 409 });
    const newUser = await ZohoDmsUser.create({ email, role, username, account_status: user_status_1.USER_STATUS.INVITED });
    const invitation = await issueInvitation(email, role, { user_id: newUser._id.toString(), username });
    await ZohoDmsUser.findByIdAndUpdate(newUser._id, { clerk_invitation_id: invitation.id });
    return { invitationId: invitation.id, userUpdated: true };
}
async function bootstrapFirstStaffInvitation({ email, role, username, bootstrapToken, }) {
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
async function inviteClientAfterSignup(clientId, email) {
    const client = await DmsZohoClient.findById(clientId);
    const invitation = await issueInvitation(email, roles_1.CLIENT_ROLE, {
        user_id: clientId,
        lead_id: client?.lead_id ?? null,
    });
    await DmsZohoClient.findByIdAndUpdate(clientId, {
        clerk_invitation_id: invitation.id,
        account_status: user_status_1.USER_STATUS.INVITED,
    });
}
async function inviteExistingClient(email) {
    const client = await DmsZohoClient.findOne({ email });
    if (!client)
        throw Object.assign(new Error('Client not found'), { status: 404 });
    const invitation = await issueInvitation(email, roles_1.CLIENT_ROLE, {
        user_id: client._id.toString(),
        lead_id: client.lead_id ?? null,
    });
    await DmsZohoClient.findByIdAndUpdate(client._id, {
        clerk_invitation_id: invitation.id,
        account_status: user_status_1.USER_STATUS.INVITED,
    });
    return { invitationId: invitation.id, userUpdated: true };
}
async function revokeClerkInvitation(invitationId) {
    await clerk_1.default.invitations.revokeInvitation(invitationId);
    await Promise.all([
        ZohoDmsUser.findOneAndUpdate({ clerk_invitation_id: invitationId }, { clerk_invitation_id: null, account_status: user_status_1.USER_STATUS.INACTIVE }),
        DmsZohoClient.findOneAndUpdate({ clerk_invitation_id: invitationId }, { clerk_invitation_id: null, account_status: user_status_1.USER_STATUS.INACTIVE }),
    ]);
}
