"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteExistingUser = inviteExistingUser;
exports.createAndInviteNewUser = createAndInviteNewUser;
exports.inviteClientAfterSignup = inviteClientAfterSignup;
exports.inviteExistingClient = inviteExistingClient;
exports.revokeClerkInvitation = revokeClerkInvitation;
const clerk_1 = __importDefault(require("../lib/clerk"));
const roles_1 = require("../constants/roles");
const user_status_1 = require("../constants/user_status");
const ZohoDmsUser = require('../models/zohoDmsUser');
const DmsZohoClient = require('../models/dmsZohoClient');
async function issueInvitation(email, role) {
    return clerk_1.default.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: { role },
    });
}
async function inviteExistingUser(email) {
    const user = await ZohoDmsUser.findOne({ email });
    if (!user)
        throw Object.assign(new Error('User not found'), { status: 404 });
    const invitation = await issueInvitation(email, user.role);
    await ZohoDmsUser.findByIdAndUpdate(user._id, {
        clerk_invitation_id: invitation.id,
        account_status: user_status_1.USER_STATUS.INVITED,
    });
    return { invitationId: invitation.id, userUpdated: true };
}
async function createAndInviteNewUser(email, role) {
    const existing = await ZohoDmsUser.findOne({ email });
    if (existing)
        throw Object.assign(new Error('User with this email already exists'), { status: 409 });
    const newUser = await ZohoDmsUser.create({ email, role, account_status: user_status_1.USER_STATUS.INVITED });
    const invitation = await issueInvitation(email, role);
    await ZohoDmsUser.findByIdAndUpdate(newUser._id, { clerk_invitation_id: invitation.id });
    return { invitationId: invitation.id, userUpdated: true };
}
async function inviteClientAfterSignup(clientId, email) {
    const invitation = await issueInvitation(email, roles_1.CLIENT_ROLE);
    await DmsZohoClient.findByIdAndUpdate(clientId, {
        clerk_invitation_id: invitation.id,
        account_status: user_status_1.USER_STATUS.INVITED,
    });
}
async function inviteExistingClient(email) {
    const client = await DmsZohoClient.findOne({ email });
    if (!client)
        throw Object.assign(new Error('Client not found'), { status: 404 });
    const invitation = await issueInvitation(email, roles_1.CLIENT_ROLE);
    await DmsZohoClient.findByIdAndUpdate(client._id, {
        clerk_invitation_id: invitation.id,
        account_status: user_status_1.USER_STATUS.INVITED,
    });
    return { invitationId: invitation.id, userUpdated: true };
}
async function revokeClerkInvitation(invitationId) {
    await clerk_1.default.invitations.revokeInvitation(invitationId);
    await ZohoDmsUser.findOneAndUpdate({ clerk_invitation_id: invitationId }, { clerk_invitation_id: null, account_status: user_status_1.USER_STATUS.INACTIVE });
}
