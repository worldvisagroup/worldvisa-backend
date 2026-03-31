"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeInvitation = exports.inviteClient = exports.inviteUser = void 0;
const clerkInvitationService_1 = require("../services/clerkInvitationService");
const roles_1 = require("../constants/roles");
const inviteUser = async (req, res) => {
    const { email, role, type } = req.body;
    if (!email || typeof email !== 'string') {
        res.status(400).json({ status: 'fail', message: 'email is required' });
        return;
    }
    const normalizedEmail = email.toLowerCase().trim();
    try {
        if (type === roles_1.NEW_ADMIN_TYPE) {
            if (!(0, roles_1.isValidStaffRole)(role)) {
                res.status(400).json({
                    status: 'fail',
                    message: `role is required for new users. Valid values: ${roles_1.STAFF_ROLES.join(', ')}`,
                });
                return;
            }
            const data = await (0, clerkInvitationService_1.createAndInviteNewUser)(normalizedEmail, role);
            res.status(201).json({ status: 'success', data });
        }
        else {
            const data = await (0, clerkInvitationService_1.inviteExistingUser)(normalizedEmail);
            res.status(200).json({ status: 'success', data });
        }
    }
    catch (err) {
        res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
    }
};
exports.inviteUser = inviteUser;
const inviteClient = async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        res.status(400).json({ status: 'fail', message: 'email is required' });
        return;
    }
    try {
        const data = await (0, clerkInvitationService_1.inviteExistingClient)(email.toLowerCase().trim());
        res.status(200).json({ status: 'success', data });
    }
    catch (err) {
        res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
    }
};
exports.inviteClient = inviteClient;
const revokeInvitation = async (req, res) => {
    const { invitationId } = req.query;
    if (!invitationId) {
        res.status(400).json({ status: 'fail', message: 'invitationId query param is required' });
        return;
    }
    try {
        await (0, clerkInvitationService_1.revokeClerkInvitation)(invitationId);
        res.status(200).json({ status: 'success' });
    }
    catch (err) {
        res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
    }
};
exports.revokeInvitation = revokeInvitation;
