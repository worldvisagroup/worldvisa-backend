"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEW_ADMIN_TYPE = exports.STAFF_ROLES = void 0;
exports.isValidStaffRole = isValidStaffRole;
exports.STAFF_ROLES = ['master_admin', 'supervisor', 'team_leader', 'admin'];
exports.NEW_ADMIN_TYPE = 'new-admin';
function isValidStaffRole(role) {
    return exports.STAFF_ROLES.includes(role);
}
