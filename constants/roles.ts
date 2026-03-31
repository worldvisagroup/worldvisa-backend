export const STAFF_ROLES = ['master_admin', 'supervisor', 'team_leader', 'admin'] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export const ADMIN_ROLE       = 'admin'        as const;
export const MASTER_ADMIN_ROLE = 'master_admin' as const;

export const CLIENT_ROLE = 'client' as const;
export const NEW_ADMIN_TYPE = 'new-admin';

export function isValidStaffRole(role: unknown): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}
