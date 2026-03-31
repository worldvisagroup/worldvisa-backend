"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTHORIZED_PARTIES = exports.WEBHOOK_ERRORS = exports.CLERK_WEBHOOK_EVENTS = void 0;
exports.CLERK_WEBHOOK_EVENTS = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
};
exports.WEBHOOK_ERRORS = {
    MISSING_HEADERS: 'Missing webhook verification headers',
    INVALID_SIGNATURE: 'Invalid webhook signature',
};
exports.AUTHORIZED_PARTIES = process.env.NODE_ENV === 'production'
    ? (process.env.CLERK_AUTHORIZED_PARTIES ?? '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
