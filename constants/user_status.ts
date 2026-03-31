export const USER_STATUS = {
  ACTIVE: 'active',
  INVITED: 'invited',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
