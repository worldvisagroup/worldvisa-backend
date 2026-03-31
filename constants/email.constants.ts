// ── Pagination / size limits ──────────────────────────────────────────────────

export const DEFAULT_EMAIL_LIMIT   = 20 as const;
export const MAX_EMAIL_LIMIT       = 50 as const;
export const MAX_THREAD_MESSAGES   = 100 as const;
export const MAX_ATTACHMENTS       = 10 as const;
export const MAX_ATTACHMENT_BYTES  = 26214400; // 25 MB

// ── Redis cache ───────────────────────────────────────────────────────────────

export const UNREAD_CACHE_KEY = 'email:unread:total' as const;
export const UNREAD_CACHE_TTL = 60 as const; // seconds

// ── Gmail ─────────────────────────────────────────────────────────────────────

export const GMAIL_SCOPE             = 'https://www.googleapis.com/auth/gmail.readonly' as const;
export const GMAIL_SYNC_REDIS_KEY    = 'gmail:sync:lock' as const;
export const GMAIL_SYNC_COOLDOWN_SEC = 300; // 5 minutes

// ── Valid enum values (used in filter validation) ─────────────────────────────

export const VALID_DIRECTIONS  = ['inbound', 'outbound'] as const;
export const VALID_EMAIL_TYPES = ['system', 'agent', 'client'] as const;
export const VALID_PROVIDERS   = ['resend', 'gmail'] as const;

// ── Mongoose $project stage — strips heavy fields before $group ───────────────
// Prevents html/text (10–50 KB each) from passing through the grouping stage.
export const EMAIL_LIST_HEAVY_EXCLUDE = { html: 0, text: 0, headers: 0 } as const;
