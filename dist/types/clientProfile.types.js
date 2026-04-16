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
    lead_owner: 1,
    application_stage: 1,
    dms_application_status: 1,
    qualified_country: 1,
    deadline_for_lodgment: 1,
    recent_activity: 1,
    zoho_created_time: 1,
    checklist_requested: 1,
    send_check_list: 1,
    spouse_skill_assessment: 1,
    spouse_name: 1,
    main_applicant: 1,
    application_state: 1,
    quality_check_from: 1,
};
