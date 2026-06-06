import type { FilterQuery, SortOrder } from 'mongoose';
import ApplicationTask, { type ApplicationTaskType } from '../models/applicationTask.model';
import {
  ACTIVE_TASK_STATUSES,
  isTaskSortField,
  isTaskSortOrder,
  isTaskStatus,
  type TaskStatus,
} from '../constants/applicationTask';
import { RECORD_TYPES } from '../models/adminApprovalRequest.model';
import type {
  CreateTaskBody,
  SendFollowUpNowBody,
  TaskClientSummary,
  TaskCreatorSummary,
  TaskListContext,
  TaskListQuery,
  UpdateTaskBody,
} from '../types/applicationTask.types';

const DmsZohoClient = require('../models/dmsZohoClient');
const ZohoDmsUser = require('../models/zohoDmsUser');
const ZohoDmsNotification = require('../models/zohoDmsNotification');
const { createEmailNotification } = require('./notifications/notificationService');
const { addNotificationAndEmit } = require('../controllers/helper/service/notifications');
const { addActivityLog } = require('../controllers/helper/service/activityLog');
const {
  escapeRegexForMongo,
  sanitizeSearchTerm,
  sanitizeUsername,
} = require('../utils/querySanitizer');

const SEARCH_TERM_MAX_LENGTH = 100;

function parseDate(value?: string): Date | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parsePagination(query: TaskListQuery) {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function buildSort(query: TaskListQuery, _actorType: TaskListContext['actorType']): Record<string, SortOrder> {
  const sortByRaw = query.sortBy;
  const sortBy = sortByRaw && isTaskSortField(sortByRaw) ? sortByRaw : 'date';

  const sortOrderRaw = query.sortOrder;
  const sortOrder: SortOrder =
    sortOrderRaw && isTaskSortOrder(sortOrderRaw) ? sortOrderRaw : 'asc';

  return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
}

function dayRangeUtc(value: string): { start: Date; end: Date } | null {
  const d = parseDate(value);
  if (!d) return null;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
}

export function buildTaskListFilter(
  query: TaskListQuery,
  context: TaskListContext
): FilterQuery<ApplicationTaskType> {
  const filter: FilterQuery<ApplicationTaskType> = {};

  if (context.actorType === 'client') {
    if (context.leadId) filter.leadId = context.leadId;
    filter.status = { $ne: 'cancelled' };
    filter.deletedAt = null;
  } else {
    const role = context.role ?? '';
    const username = context.username ?? '';

    if (role === 'admin' && username) {
      filter.leadOwner = username;
    }

    if (query.mine === 'true' && username) {
      filter.leadOwner = username;
    }

    if (query.leadOwner && role === 'master_admin') {
      const owner = sanitizeUsername(query.leadOwner);
      if (owner) filter.leadOwner = owner;
    }

    if (query.leadId) filter.leadId = query.leadId.trim();

    if (query.recordType && (RECORD_TYPES as readonly string[]).includes(query.recordType)) {
      filter.recordType = query.recordType;
    }

    if (query.createdBy) {
      const createdBy = sanitizeUsername(query.createdBy);
      if (createdBy) filter.createdBy = createdBy;
    }

    if (query.includeDeleted !== 'true') {
      filter.deletedAt = null;
    }
  }

  if (query.status && isTaskStatus(query.status)) {
    if (context.actorType === 'client' && query.status === 'cancelled') {
      // clients never see cancelled
    } else {
      filter.status = query.status;
    }
  } else if (query.statusIn && context.actorType === 'staff') {
    const statuses = query.statusIn
      .split(',')
      .map((s) => s.trim())
      .filter((s) => isTaskStatus(s));
    if (statuses.length) filter.status = { $in: statuses };
  }

  const rangeFrom = parseDate(query.scheduledFrom);
  const rangeTo = parseDate(query.scheduledTo);
  if (rangeFrom) {
    filter.scheduledFrom = { ...(filter.scheduledFrom as object), $gte: rangeFrom };
  }
  if (rangeTo) {
    filter.scheduledTo = { ...(filter.scheduledTo as object), $lte: rangeTo };
  }

  const taskDate = query.date ? dayRangeUtc(query.date) : null;
  if (taskDate) {
    filter.date = { $gte: taskDate.start, $lte: taskDate.end };
  } else {
    const dateFrom = parseDate(query.dateFrom ?? '');
    const dateTo = parseDate(query.dateTo ?? '');
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) (filter.date as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (filter.date as Record<string, Date>).$lte = dateTo;
    }
  }

  if (context.actorType === 'staff') {
    const createdFrom = parseDate(query.createdFrom);
    const createdTo = parseDate(query.createdTo);
    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) (filter.createdAt as Record<string, Date>).$gte = createdFrom;
      if (createdTo) (filter.createdAt as Record<string, Date>).$lte = createdTo;
    }
  }

  if (query.overdue === 'true') {
    filter.scheduledTo = { ...(filter.scheduledTo as object), $lt: new Date() };
    filter.status = { $in: ACTIVE_TASK_STATUSES };
  }

  if (query.upcoming === 'true') {
    filter.scheduledFrom = { ...(filter.scheduledFrom as object), $gte: new Date() };
    filter.status = { $ne: 'completed' };
  }

  const search = sanitizeSearchTerm(query.search, SEARCH_TERM_MAX_LENGTH);
  if (search) {
    const safe = escapeRegexForMongo(search);
    const re = new RegExp(safe, 'i');
    filter.$or = [{ title: re }, { description: re }];
  }

  return filter;
}

async function getClientInfoMap(
  leadIds: string[]
): Promise<Record<string, TaskClientSummary>> {
  const unique = [...new Set(leadIds.filter(Boolean))];
  if (!unique.length) return {};

  const clients = await DmsZohoClient.find({ lead_id: { $in: unique } })
    .select('lead_id full_name name profile_image_url')
    .lean();

  return Object.fromEntries(
    (clients as Array<{ lead_id: string; name?: string; full_name?: string; profile_image_url?: string | null }>).map((c) => [
      c.lead_id,
      {
        name: c.name ?? c.full_name ?? c.lead_id,
        profile_image_url: c.profile_image_url ?? null,
      },
    ])
  );
}

async function getCreatorInfoMap(
  usernames: string[]
): Promise<Record<string, TaskCreatorSummary>> {
  const unique = [...new Set(usernames.filter(Boolean))];
  if (!unique.length) return {};

  const users = await ZohoDmsUser.find({
    $or: unique.map((name) => ({
      username: { $regex: new RegExp(`^${escapeRegexForMongo(name)}$`, 'i') },
    })),
  })
    .select('username full_name profile_image_url')
    .lean();

  const byUsernameKey = new Map<string, TaskCreatorSummary>();
  for (const u of users as Array<{ username: string; full_name?: string; profile_image_url?: string | null }>) {
    const info: TaskCreatorSummary = {
      username: u.username,
      name: u.full_name ?? u.username,
      profile_image_url: u.profile_image_url ?? null,
    };
    byUsernameKey.set(u.username.toLowerCase(), info);
  }

  return Object.fromEntries(
    unique
      .map((name) => {
        const info = byUsernameKey.get(name.toLowerCase());
        return info ? [name, info] as const : null;
      })
      .filter((entry): entry is readonly [string, TaskCreatorSummary] => entry !== null)
  );
}

export async function enrichTasks<T extends { leadId?: string | null; createdBy?: string | null }>(
  tasks: T[]
): Promise<Array<T & { client: TaskClientSummary | null; createdByInfo: TaskCreatorSummary | null }>> {
  if (!tasks.length) return [];

  const [clientInfoMap, creatorInfoMap] = await Promise.all([
    getClientInfoMap(tasks.map((t) => t.leadId ?? '')),
    getCreatorInfoMap(tasks.map((t) => t.createdBy ?? '')),
  ]);

  return tasks.map((task) => ({
    ...task,
    client: task.leadId ? clientInfoMap[task.leadId] ?? null : null,
    createdByInfo: task.createdBy ? creatorInfoMap[task.createdBy] ?? null : null,
  }));
}

export async function enrichTask<T extends { leadId?: string | null; createdBy?: string | null }>(
  task: T
): Promise<T & { client: TaskClientSummary | null; createdByInfo: TaskCreatorSummary | null }> {
  const [enriched] = await enrichTasks([task]);
  return enriched;
}

export async function listTasks(query: TaskListQuery, context: TaskListContext) {
  const filter = buildTaskListFilter(query, context);
  const { page, limit, skip } = parsePagination(query);
  const sort = buildSort(query, context.actorType);

  const [tasks, total] = await Promise.all([
    ApplicationTask.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ApplicationTask.countDocuments(filter),
  ]);

  return {
    tasks: await enrichTasks(tasks),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 0,
    },
  };
}

async function getClientByLeadId(leadId: string) {
  return DmsZohoClient.findOne({ lead_id: leadId }).lean();
}

export async function assertStaffCanAccessTask(
  task: { leadOwner?: string | null },
  username: string,
  role: string
): Promise<boolean> {
  if (role === 'master_admin' || role === 'supervisor' || role === 'team_leader') {
    return true;
  }
  if (role === 'admin') {
    return task.leadOwner === username;
  }
  return false;
}

export async function assertClientCanAccessTask(
  task: { leadId?: string | null; status?: string | null; deletedAt?: Date | null },
  leadId: string
): Promise<boolean> {
  return task.leadId === leadId && task.status !== 'cancelled' && !task.deletedAt;
}

export function isTaskDeleted(task: { deletedAt?: Date | null }): boolean {
  return Boolean(task.deletedAt);
}

export async function getTaskById(taskId: string) {
  return ApplicationTask.findById(taskId).lean();
}

function validateScheduleRange(scheduledFrom: Date | null, scheduledTo: Date | null) {
  if (scheduledFrom && scheduledTo && scheduledTo < scheduledFrom) {
    throw new Error('scheduledTo must be greater than or equal to scheduledFrom');
  }
}

export async function createTask(body: CreateTaskBody, staffUsername: string) {
  const client = await getClientByLeadId(body.leadId);
  if (!client) {
    throw new Error('leadId does not match an existing application');
  }

  const recordType = body.recordType ?? client.record_type;
  if (!(RECORD_TYPES as readonly string[]).includes(recordType)) {
    throw new Error('Invalid recordType');
  }

  const scheduledFrom = body.scheduledFrom ? parseDate(body.scheduledFrom) : null;
  const scheduledTo = body.scheduledTo ? parseDate(body.scheduledTo) : null;
  const date = body.date ? parseDate(body.date) : null;

  validateScheduleRange(scheduledFrom, scheduledTo);

  const leadOwner = body.leadOwner ?? client.lead_owner;
  if (!leadOwner) {
    throw new Error('leadOwner could not be resolved for this application');
  }

  const task = await ApplicationTask.create({
    leadId: body.leadId,
    recordType,
    leadOwner,
    title: body.title.trim(),
    description: body.description ?? null,
    status: body.status && isTaskStatus(body.status) ? body.status : 'todo',
    date,
    scheduledFrom,
    scheduledTo,
    createdBy: staffUsername,
    links: body.links ?? [],
  });

  addActivityLog({
    lead_id: task.leadId,
    activity_type: 'task_created',
    summary: `Task created: ${task.title}`,
    actor_type: 'staff',
    actor_name: staffUsername,
    metadata: { taskId: String(task._id) },
  });

  return task.toObject();
}

export async function updateTask(taskId: string, body: UpdateTaskBody, staffUsername: string) {
  const task = await ApplicationTask.findById(taskId);
  if (!task) return null;

  if (body.title !== undefined) task.title = body.title.trim();
  if (body.description !== undefined) task.description = body.description;
  if (body.links !== undefined) task.links = body.links as any;

  if (body.date !== undefined) {
    task.date = body.date ? parseDate(body.date) : null;
  }

  let scheduledFrom: Date | null = task.scheduledFrom ?? null;
  let scheduledTo: Date | null = task.scheduledTo ?? null;

  if (body.scheduledFrom !== undefined) {
    scheduledFrom = body.scheduledFrom ? parseDate(body.scheduledFrom) : null;
    task.scheduledFrom = scheduledFrom;
  }
  if (body.scheduledTo !== undefined) {
    scheduledTo = body.scheduledTo ? parseDate(body.scheduledTo) : null;
    task.scheduledTo = scheduledTo;
  }

  validateScheduleRange(scheduledFrom, scheduledTo);

  await task.save();

  addActivityLog({
    lead_id: task.leadId,
    activity_type: 'task_updated',
    summary: `Task updated: ${task.title}`,
    actor_type: 'staff',
    actor_name: staffUsername,
    metadata: { taskId: String(task._id) },
  });

  return task.toObject();
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, staffUsername: string) {
  if (!isTaskStatus(status)) {
    throw new Error('Invalid status');
  }

  const task = await ApplicationTask.findById(taskId);
  if (!task) return null;

  task.status = status;

  if (status === 'completed') {
    task.completedAt = new Date();
    task.completedBy = staffUsername;
  } else {
    task.completedAt = null;
    task.completedBy = null;
  }

  if (status === 'cancelled') {
    task.cancelledAt = new Date();
    task.cancelledBy = staffUsername;
  } else {
    task.cancelledAt = null;
    task.cancelledBy = null;
  }

  await task.save();

  const activityType = status === 'completed' ? 'task_completed' : 'task_updated';
  addActivityLog({
    lead_id: task.leadId,
    activity_type: activityType,
    summary: `Task ${status}: ${task.title}`,
    actor_type: 'staff',
    actor_name: staffUsername,
    metadata: { taskId: String(task._id), status },
  });

  return task.toObject();
}

export async function softDeleteTask(taskId: string, staffUsername: string) {
  const task = await ApplicationTask.findById(taskId);
  if (!task || task.deletedAt) return null;

  task.deletedAt = new Date();
  task.deletedBy = staffUsername;

  await task.save();

  addActivityLog({
    lead_id: task.leadId,
    activity_type: 'task_deleted',
    summary: `Task deleted: ${task.title}`,
    actor_type: 'staff',
    actor_name: staffUsername,
    metadata: { taskId: String(task._id) },
  });

  return task.toObject();
}

function formatScheduleLabel(task: ApplicationTaskType): string | null {
  if (!task.scheduledFrom && !task.scheduledTo) return null;

  const fmt = (d: Date) =>
    new Date(d).toLocaleString('en-AU', { timeZone: 'UTC' }) + ' UTC';

  if (task.scheduledFrom && task.scheduledTo) {
    return `From ${fmt(task.scheduledFrom)} to ${fmt(task.scheduledTo)}`;
  }
  if (task.scheduledFrom) return `From ${fmt(task.scheduledFrom)}`;
  return `Until ${fmt(task.scheduledTo!)}`;
}

async function buildTaskNotificationMessage(task: ApplicationTaskType, overrideMessage?: string | null) {
  if (overrideMessage?.trim()) return overrideMessage.trim();

  const parts = [`${task.title}`];
  const schedule = formatScheduleLabel(task);
  if (schedule) parts.push(schedule);

  const meetingLink = (task.links ?? []).find((l: any) => l.type === 'meeting' || l.url);
  if (meetingLink?.url) parts.push(`Link: ${meetingLink.url}`);
  return parts.join(' — ');
}

export async function sendFollowUpNow(
  taskId: string,
  body: SendFollowUpNowBody,
  staffUsername: string,
  req: any
) {
  const task = await ApplicationTask.findById(taskId);
  if (!task) return null;

  const delivery = await dispatchFollowUp(task, body.source, staffUsername, req, body.message);
  task.followUpDeliveries.push(delivery as any);
  await task.save();

  return task.toObject();
}

async function dispatchFollowUp(
  task: ApplicationTaskType,
  source: 'email' | 'inapp',
  triggeredByUsername: string,
  req: any,
  overrideMessage?: string | null
) {
  const message = await buildTaskNotificationMessage(task, overrideMessage);
  const client = await getClientByLeadId(task.leadId);

  let notificationRef = null;

  if (source === 'inapp' && client) {
    const staffUser = triggeredByUsername
      ? await ZohoDmsUser.findOne({ username: triggeredByUsername }).select('_id').lean()
      : null;

    let notification = null;

    if (req) {
      notification = await addNotificationAndEmit({
        req,
        userId: client._id,
        leadId: task.leadId,
        title: task.title,
        message,
        type: 'info',
        category: 'task',
        source: 'task',
        link: `/client/tasks/${task._id}`,
        applicationType: task.recordType === 'spouse_skill_assessment'
          ? 'Spouse_Skill_Assessment'
          : 'Visa_Applications',
        sender_type: triggeredByUsername ? 'staff' : 'system',
        sender_id: staffUser?._id ?? null,
      });
    } else {
      notification = await ZohoDmsNotification.create({
        user: client._id,
        title: task.title,
        message,
        type: 'info',
        category: 'task',
        source: 'task',
        link: `/client/tasks/${task._id}`,
        leadId: task.leadId,
        applicationType: task.recordType === 'spouse_skill_assessment'
          ? 'Spouse_Skill_Assessment'
          : 'Visa_Applications',
        sender_type: triggeredByUsername ? 'staff' : 'system',
        sender_id: staffUser?._id ?? null,
      });
    }

    if (notification?._id) {
      notificationRef = { model: 'ZohoDmsNotification', id: notification._id };
    }
  }

  if (source === 'email' && client?.email) {
    const emailRecord = await createEmailNotification({
      recipientRole: 'client',
      recipientEmail: client.email,
      recipientName: client.name ?? '',
      notificationType: 'task_reminder',
      entityParentId: task.leadId,
      entityId: String(task._id),
      entityName: task.title,
      subject: task.title,
      message,
      templateData: {
        taskTitle: task.title,
        taskDescription: task.description,
        scheduledFrom: task.scheduledFrom,
        scheduledTo: task.scheduledTo,
        links: task.links,
      },
    });

    if (emailRecord?._id) {
      notificationRef = { model: 'EmailNotification', id: emailRecord._id };
    }
  }

  return {
    source,
    sentAt: new Date(),
    triggeredBy: triggeredByUsername ? 'staff' : 'system',
    triggeredByUsername: triggeredByUsername || null,
    notificationRef,
  };
}
