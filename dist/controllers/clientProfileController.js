"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientProfile = exports.getClientProfile = void 0;
const clientProfile_types_1 = require("../types/clientProfile.types");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DmsZohoClient = require('../models/dmsZohoClient');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { addActivityLog } = require('./helper/service/activityLog');
// ─── GET /clients/profile/:lead_id ────────────────────────────────────────────
const getClientProfile = async (req, res) => {
    const { lead_id } = req.params;
    if (!lead_id) {
        res.status(400).json({ status: 'fail', message: 'lead_id is required' });
        return;
    }
    try {
        const profile = await DmsZohoClient.findOne({ lead_id }, clientProfile_types_1.PROFILE_PROJECTION).lean();
        if (!profile) {
            res.status(404).json({ status: 'fail', message: 'Client not found' });
            return;
        }
        res.status(200).json({ status: 'success', data: { profile } });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        res.status(500).json({ status: 'error', message });
    }
};
exports.getClientProfile = getClientProfile;
// ─── PATCH /clients/profile/:lead_id ──────────────────────────────────────────
const updateClientProfile = async (req, res) => {
    const { lead_id } = req.params;
    if (!lead_id) {
        res.status(400).json({ status: 'fail', message: 'lead_id is required' });
        return;
    }
    // Whitelist: only pick recognised fields, drop everything else
    const body = req.body;
    const updates = {};
    for (const field of clientProfile_types_1.ALLOWED_PROFILE_FIELDS) {
        if (field in body && body[field] !== undefined) {
            updates[field] = body[field];
        }
    }
    if (Object.keys(updates).length === 0) {
        res.status(400).json({
            status: 'fail',
            message: `No valid fields to update. Allowed fields: ${clientProfile_types_1.ALLOWED_PROFILE_FIELDS.join(', ')}`,
        });
        return;
    }
    // Validate string fields are non-empty when provided
    for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'string' && value.trim() === '') {
            res.status(400).json({
                status: 'fail',
                message: `Field '${key}' cannot be an empty string`,
            });
            return;
        }
        if (typeof value === 'string') {
            updates[key] = value.trim();
        }
    }
    try {
        // Unique email check — only when email is being changed
        if (updates.email) {
            const emailConflict = await DmsZohoClient.findOne({ email: updates.email.toLowerCase(), lead_id: { $ne: lead_id } }, { _id: 1 }).lean();
            if (emailConflict) {
                res.status(409).json({
                    status: 'fail',
                    code: 'EMAIL_ALREADY_EXISTS',
                    field: 'email',
                    message: 'An account with this email already exists',
                });
                return;
            }
            updates.email = updates.email.toLowerCase();
        }
        const updated = await DmsZohoClient.findOneAndUpdate({ lead_id }, { $set: updates }, { new: true, runValidators: true, projection: clientProfile_types_1.PROFILE_PROJECTION }).lean();
        if (!updated) {
            res.status(404).json({ status: 'fail', message: 'Client not found' });
            return;
        }
        // Fire-and-forget activity log
        const actor = req.user;
        addActivityLog({
            lead_id,
            activity_type: 'profile_updated',
            summary: `Client profile updated. Fields: ${Object.keys(updates).join(', ')}`,
            actor_type: 'staff',
            actor_name: actor?.name ?? actor?.username ?? 'Unknown',
            actor_role: req.clerkRole ?? actor?.role ?? null,
            metadata: { updatedFields: Object.keys(updates) },
        });
        res.status(200).json({ status: 'success', data: { profile: updated } });
    }
    catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
            res.status(409).json({
                status: 'fail',
                code: 'DUPLICATE_KEY',
                message: 'A client with one of the provided unique values already exists',
            });
            return;
        }
        if (err && typeof err === 'object' && 'name' in err && err.name === 'CastError') {
            res.status(400).json({ status: 'fail', message: 'Invalid field value provided' });
            return;
        }
        const message = err instanceof Error ? err.message : 'Something went wrong';
        res.status(500).json({ status: 'error', message });
    }
};
exports.updateClientProfile = updateClientProfile;
