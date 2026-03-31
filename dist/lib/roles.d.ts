export declare const STAFF_ROLES: readonly ["master_admin", "supervisor", "team_leader", "admin"];
export type StaffRole = typeof STAFF_ROLES[number];
export declare const NEW_ADMIN_TYPE = "new-admin";
export declare function isValidStaffRole(role: unknown): role is StaffRole;
