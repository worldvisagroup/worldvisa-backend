"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeInvitation = exports.inviteClient = exports.bootstrapInviteUser = exports.inviteUser = void 0;
const clerkInvitationService_1 = require("../../services/clerk/clerkInvitationService");
const roles_1 = require("../../constants/roles");
const inviteUser = async (req, res) => {
    const { email, role, type, username } = req.body;
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
            if (!username || typeof username !== 'string') {
                res.status(400).json({ status: 'fail', message: 'username is required for new users' });
                return;
            }
            const data = await (0, clerkInvitationService_1.createAndInviteNewUser)(normalizedEmail, role, username.trim());
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
const bootstrapInviteUser = async (req, res) => {
    const { email, role, username } = req.body;
    const bootstrapToken = req.headers['x-bootstrap-token'];
    if (!email || typeof email !== 'string') {
        res.status(400).json({ status: 'fail', message: 'email is required' });
        return;
    }
    if (!(0, roles_1.isValidStaffRole)(role)) {
        res.status(400).json({
            status: 'fail',
            message: `role is required. Valid values: ${roles_1.STAFF_ROLES.join(', ')}`,
        });
        return;
    }
    if (!username || typeof username !== 'string') {
        res.status(400).json({ status: 'fail', message: 'username is required' });
        return;
    }
    try {
        const data = await (0, clerkInvitationService_1.bootstrapFirstStaffInvitation)({
            email: email.toLowerCase().trim(),
            role,
            username: username.trim(),
            bootstrapToken,
        });
        res.status(201).json({ status: 'success', data });
    }
    catch (err) {
        res.status(err.status ?? 500).json({ status: 'fail', message: err.message });
    }
};
exports.bootstrapInviteUser = bootstrapInviteUser;
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
