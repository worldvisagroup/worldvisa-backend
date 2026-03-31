export const CLERK_WEBHOOK_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
} as const;

export type ClerkWebhookEventType = typeof CLERK_WEBHOOK_EVENTS[keyof typeof CLERK_WEBHOOK_EVENTS];

export const WEBHOOK_ERRORS = {
  MISSING_HEADERS: 'Missing webhook verification headers',
  INVALID_SIGNATURE: 'Invalid webhook signature',
} as const;

export const AUTHORIZED_PARTIES: string[] =
  process.env.NODE_ENV === 'production'
    ? (process.env.CLERK_AUTHORIZED_PARTIES ?? '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
