"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserOnCreated = syncUserOnCreated;
exports.syncUserOnUpdated = syncUserOnUpdated;
exports.syncUserOnDeleted = syncUserOnDeleted;
const user_status_1 = require("../constants/user_status");
const ZohoDmsUser = require('../models/zohoDmsUser');
const DmsZohoClient = require('../models/dmsZohoClient');
function resolvePrimaryEmail(payload) {
    const primary = payload.email_addresses.find((addr) => addr.id === payload.primary_email_address_id);
    return primary?.emailAddress ?? null;
}
function isEmailVerified(payload) {
    const primary = payload.email_addresses.find((addr) => addr.id === payload.primary_email_address_id);
    return primary?.verification?.status === 'verified';
}
async function syncUserOnCreated(payload) {
    const email = resolvePrimaryEmail(payload);
    if (!email)
        throw Object.assign(new Error('No primary email in Clerk payload'), { status: 400 });
    const update = {
        clerk_id: payload.id,
        profile_image_url: payload.image_url ?? null,
        email_verified: isEmailVerified(payload),
        account_status: user_status_1.USER_STATUS.ACTIVE,
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
async function syncUserOnUpdated(payload) {
    const email = resolvePrimaryEmail(payload);
    if (!email)
        throw Object.assign(new Error('No primary email in Clerk payload'), { status: 400 });
    // Do not touch account_status — preserve current status
    const update = {
        profile_image_url: payload.image_url ?? null,
        email_verified: isEmailVerified(payload),
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
async function syncUserOnDeleted(clerkId) {
    const update = { account_status: user_status_1.USER_STATUS.DELETED };
    const [staffResult, clientResult] = await Promise.all([
        ZohoDmsUser.findOneAndUpdate({ clerk_id: clerkId }, update),
        DmsZohoClient.findOneAndUpdate({ clerk_id: clerkId }, update),
    ]);
    return {
        staffUpdated: staffResult !== null,
        clientUpdated: clientResult !== null,
    };
}
