export declare const CLERK_WEBHOOK_EVENTS: {
    readonly USER_CREATED: "user.created";
    readonly USER_UPDATED: "user.updated";
    readonly USER_DELETED: "user.deleted";
};
export type ClerkWebhookEventType = typeof CLERK_WEBHOOK_EVENTS[keyof typeof CLERK_WEBHOOK_EVENTS];
export declare const WEBHOOK_ERRORS: {
    readonly MISSING_HEADERS: "Missing webhook verification headers";
    readonly INVALID_SIGNATURE: "Invalid webhook signature";
};
export declare const AUTHORIZED_PARTIES: string[];
