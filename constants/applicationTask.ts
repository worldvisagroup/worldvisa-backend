export const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_LINK_TYPES = ['meeting', 'document', 'general'] as const;
export type TaskLinkType = (typeof TASK_LINK_TYPES)[number];

export const FOLLOWUP_SOURCES = ['email', 'inapp'] as const;
export type FollowUpSource = (typeof FOLLOWUP_SOURCES)[number];

export const FOLLOWUP_TRIGGER_TYPES = ['system', 'staff'] as const;
export type FollowUpTriggerType = (typeof FOLLOWUP_TRIGGER_TYPES)[number];

export const NOTIFICATION_REF_MODELS = ['EmailNotification', 'ZohoDmsNotification'] as const;
export type NotificationRefModel = (typeof NOTIFICATION_REF_MODELS)[number];

export const TASK_SORT_FIELDS = ['createdAt', 'date', 'scheduledFrom', 'scheduledTo', 'status', 'title'] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export const TASK_SORT_ORDERS = ['asc', 'desc'] as const;
export type TaskSortOrder = (typeof TASK_SORT_ORDERS)[number];

export const TASK_LIST_ACTOR_TYPES = ['staff', 'client'] as const;
export type TaskListActorType = (typeof TASK_LIST_ACTOR_TYPES)[number];

const taskStatusSet = new Set<string>(TASK_STATUSES);
const taskLinkTypeSet = new Set<string>(TASK_LINK_TYPES);
const followUpSourceSet = new Set<string>(FOLLOWUP_SOURCES);
const taskSortFieldSet = new Set<string>(TASK_SORT_FIELDS);
const taskSortOrderSet = new Set<string>(TASK_SORT_ORDERS);

export function isTaskStatus(value: string): value is TaskStatus {
  return taskStatusSet.has(value);
}

export function isTaskLinkType(value: string): value is TaskLinkType {
  return taskLinkTypeSet.has(value);
}

export function isFollowUpSource(value: string): value is FollowUpSource {
  return followUpSourceSet.has(value);
}

export function isTaskSortField(value: string): value is TaskSortField {
  return taskSortFieldSet.has(value);
}

export function isTaskSortOrder(value: string): value is TaskSortOrder {
  return taskSortOrderSet.has(value);
}

/** Active statuses used for overdue/upcoming filters */
export const ACTIVE_TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress'];
