export declare const USER_STATUS: {
    readonly ACTIVE: "active";
    readonly INVITED: "invited";
    readonly INACTIVE: "inactive";
    readonly SUSPENDED: "suspended";
    readonly DELETED: "deleted";
};
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];
