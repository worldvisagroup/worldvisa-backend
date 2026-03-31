export declare const DEFAULT_EMAIL_LIMIT: 20;
export declare const MAX_EMAIL_LIMIT: 50;
export declare const MAX_THREAD_MESSAGES: 100;
export declare const MAX_ATTACHMENTS: 10;
export declare const MAX_ATTACHMENT_BYTES = 26214400;
export declare const UNREAD_CACHE_KEY: "email:unread:total";
export declare const UNREAD_CACHE_TTL: 60;
export declare const GMAIL_SCOPE: "https://www.googleapis.com/auth/gmail.readonly";
export declare const GMAIL_SYNC_REDIS_KEY: "gmail:sync:lock";
export declare const GMAIL_SYNC_COOLDOWN_SEC = 300;
export declare const VALID_DIRECTIONS: readonly ["inbound", "outbound"];
export declare const VALID_EMAIL_TYPES: readonly ["system", "agent", "client"];
export declare const VALID_PROVIDERS: readonly ["resend", "gmail"];
export declare const EMAIL_LIST_HEAVY_EXCLUDE: {
    readonly html: 0;
    readonly text: 0;
    readonly headers: 0;
};
