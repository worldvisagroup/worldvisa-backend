"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_TASK_STATUSES = exports.TASK_LIST_ACTOR_TYPES = exports.TASK_SORT_ORDERS = exports.TASK_SORT_FIELDS = exports.NOTIFICATION_REF_MODELS = exports.FOLLOWUP_TRIGGER_TYPES = exports.FOLLOWUP_SOURCES = exports.TASK_LINK_TYPES = exports.TASK_STATUSES = void 0;
exports.isTaskStatus = isTaskStatus;
exports.isTaskLinkType = isTaskLinkType;
exports.isFollowUpSource = isFollowUpSource;
exports.isTaskSortField = isTaskSortField;
exports.isTaskSortOrder = isTaskSortOrder;
exports.TASK_STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];
exports.TASK_LINK_TYPES = ['meeting', 'document', 'general'];
exports.FOLLOWUP_SOURCES = ['email', 'inapp'];
exports.FOLLOWUP_TRIGGER_TYPES = ['system', 'staff'];
exports.NOTIFICATION_REF_MODELS = ['EmailNotification', 'ZohoDmsNotification'];
exports.TASK_SORT_FIELDS = ['createdAt', 'date', 'scheduledFrom', 'scheduledTo', 'status', 'title'];
exports.TASK_SORT_ORDERS = ['asc', 'desc'];
exports.TASK_LIST_ACTOR_TYPES = ['staff', 'client'];
const taskStatusSet = new Set(exports.TASK_STATUSES);
const taskLinkTypeSet = new Set(exports.TASK_LINK_TYPES);
const followUpSourceSet = new Set(exports.FOLLOWUP_SOURCES);
const taskSortFieldSet = new Set(exports.TASK_SORT_FIELDS);
const taskSortOrderSet = new Set(exports.TASK_SORT_ORDERS);
function isTaskStatus(value) {
    return taskStatusSet.has(value);
}
function isTaskLinkType(value) {
    return taskLinkTypeSet.has(value);
}
function isFollowUpSource(value) {
    return followUpSourceSet.has(value);
}
function isTaskSortField(value) {
    return taskSortFieldSet.has(value);
}
function isTaskSortOrder(value) {
    return taskSortOrderSet.has(value);
}
/** Active statuses used for overdue/upcoming filters */
exports.ACTIVE_TASK_STATUSES = ['todo', 'in_progress'];
