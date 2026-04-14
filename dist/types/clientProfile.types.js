"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_PROJECTION = exports.ALLOWED_PROFILE_FIELDS = void 0;
exports.ALLOWED_PROFILE_FIELDS = [
    'name',
    'email',
    'phone',
    'record_type',
    'profile_image_url',
    'suggested_anzsco',
    'assessing_authority',
    'service_type',
];
exports.PROFILE_PROJECTION = {
    _id: 1,
    name: 1,
    email: 1,
    phone: 1,
    lead_id: 1,
    record_type: 1,
    profile_image_url: 1,
    suggested_anzsco: 1,
    assessing_authority: 1,
    service_type: 1,
};
