"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTaskListFilter = buildTaskListFilter;
exports.enrichTasks = enrichTasks;
exports.enrichTask = enrichTask;
exports.listTasks = listTasks;
exports.assertStaffCanAccessTask = assertStaffCanAccessTask;
exports.assertClientCanAccessTask = assertClientCanAccessTask;
exports.isTaskDeleted = isTaskDeleted;
exports.getTaskById = getTaskById;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.updateTaskStatus = updateTaskStatus;
exports.softDeleteTask = softDeleteTask;
exports.sendFollowUpNow = sendFollowUpNow;
const applicationTask_model_1 = __importDefault(require("../models/applicationTask.model"));
const applicationTask_1 = require("../constants/applicationTask");
const adminApprovalRequest_model_1 = require("../models/adminApprovalRequest.model");
const DmsZohoClient = require('../models/dmsZohoClient');
const ZohoDmsUser = require('../models/zohoDmsUser');
const ZohoDmsNotification = require('../models/zohoDmsNotification');
const { createEmailNotification } = require('./notifications/notificationService');
const { addNotificationAndEmit } = require('../controllers/helper/service/notifications');
const { addActivityLog } = require('../controllers/helper/service/activityLog');
const { escapeRegexForMongo, sanitizeSearchTerm, sanitizeUsername, } = require('../utils/querySanitizer');
const SEARCH_TERM_MAX_LENGTH = 100;
function leadOwnerFilterForUser(username) {
    const safe = escapeRegexForMongo(username.trim());
    return new RegExp(`^${safe}$`, 'i');
}
function leadOwnersMatch(leadOwner, username) {
    if (!leadOwner || !username)
        return false;
    return leadOwner.trim().toLowerCase() === username.trim().toLowerCase();
}
async function normalizeLeadOwner(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return trimmed;
    const user = await ZohoDmsUser.findOne({
        username: { $regex: leadOwnerFilterForUser(trimmed) },
    })
        .select('username')
        .lean();
    if (user?.username)
        return user.username;
    return sanitizeUsername(trimmed) ?? trimmed.toLowerCase();
}
function parseDate(value) {
    if (!value || typeof value !== 'string')
        return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}
function parsePagination(query) {
    const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10) || 20));
    return { page, limit, skip: (page - 1) * limit };
}
function buildSort(query, _actorType) {
    const sortByRaw = query.sortBy;
    const sortBy = sortByRaw && (0, applicationTask_1.isTaskSortField)(sortByRaw) ? sortByRaw : 'date';
    const sortOrderRaw = query.sortOrder;
    const sortOrder = sortOrderRaw && (0, applicationTask_1.isTaskSortOrder)(sortOrderRaw) ? sortOrderRaw : 'asc';
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
}
function dayRangeUtc(value) {
    const d = parseDate(value);
    if (!d)
        return null;
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
}
function buildTaskListFilter(query, context) {
    const filter = {};
    if (context.actorType === 'client') {
        if (context.leadId)
            filter.leadId = context.leadId;
        filter.status = { $ne: 'cancelled' };
        filter.deletedAt = null;
    }
    else {
        const role = context.role ?? '';
        const username = context.username ?? '';
        if (role === 'admin' && username) {
            filter.leadOwner = leadOwnerFilterForUser(username);
        }
        if (query.mine === 'true' && username) {
            filter.leadOwner = leadOwnerFilterForUser(username);
        }
        if (query.leadOwner && role === 'master_admin') {
            const owner = query.leadOwner.trim();
            if (owner)
                filter.leadOwner = leadOwnerFilterForUser(owner);
        }
        if (query.leadId)
            filter.leadId = query.leadId.trim();
        if (query.recordType && adminApprovalRequest_model_1.RECORD_TYPES.includes(query.recordType)) {
            filter.recordType = query.recordType;
        }
        if (query.createdBy) {
            const createdBy = sanitizeUsername(query.createdBy);
            if (createdBy)
                filter.createdBy = createdBy;
        }
        if (query.includeDeleted !== 'true') {
            filter.deletedAt = null;
        }
    }
    if (query.status && (0, applicationTask_1.isTaskStatus)(query.status)) {
        if (context.actorType === 'client' && query.status === 'cancelled') {
            // clients never see cancelled
        }
        else {
            filter.status = query.status;
        }
    }
    else if (query.statusIn && context.actorType === 'staff') {
        const statuses = query.statusIn
            .split(',')
            .map((s) => s.trim())
            .filter((s) => (0, applicationTask_1.isTaskStatus)(s));
        if (statuses.length)
            filter.status = { $in: statuses };
    }
    const rangeFrom = parseDate(query.scheduledFrom);
    const rangeTo = parseDate(query.scheduledTo);
    if (rangeFrom) {
        filter.scheduledFrom = { ...filter.scheduledFrom, $gte: rangeFrom };
    }
    if (rangeTo) {
        filter.scheduledTo = { ...filter.scheduledTo, $lte: rangeTo };
    }
    const taskDate = query.date ? dayRangeUtc(query.date) : null;
    if (taskDate) {
        filter.date = { $gte: taskDate.start, $lte: taskDate.end };
    }
    else {
        const dateFrom = parseDate(query.dateFrom ?? '');
        const dateTo = parseDate(query.dateTo ?? '');
        if (dateFrom || dateTo) {
            filter.date = {};
            if (dateFrom)
                filter.date.$gte = dateFrom;
            if (dateTo)
                filter.date.$lte = dateTo;
        }
    }
    if (context.actorType === 'staff') {
        const createdFrom = parseDate(query.createdFrom);
        const createdTo = parseDate(query.createdTo);
        if (createdFrom || createdTo) {
            filter.createdAt = {};
            if (createdFrom)
                filter.createdAt.$gte = createdFrom;
            if (createdTo)
                filter.createdAt.$lte = createdTo;
        }
    }
    if (query.overdue === 'true') {
        filter.scheduledTo = { ...filter.scheduledTo, $lt: new Date() };
        filter.status = { $in: applicationTask_1.ACTIVE_TASK_STATUSES };
    }
    if (query.upcoming === 'true') {
        filter.scheduledFrom = { ...filter.scheduledFrom, $gte: new Date() };
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
async function getClientInfoMap(leadIds) {
    const unique = [...new Set(leadIds.filter(Boolean))];
    if (!unique.length)
        return {};
    const clients = await DmsZohoClient.find({ lead_id: { $in: unique } })
        .select('lead_id full_name name profile_image_url')
        .lean();
    return Object.fromEntries(clients.map((c) => [
        c.lead_id,
        {
            name: c.name ?? c.full_name ?? c.lead_id,
            profile_image_url: c.profile_image_url ?? null,
        },
    ]));
}
async function getCreatorInfoMap(usernames) {
    const unique = [...new Set(usernames.filter(Boolean))];
    if (!unique.length)
        return {};
    const users = await ZohoDmsUser.find({
        $or: unique.map((name) => ({
            username: { $regex: new RegExp(`^${escapeRegexForMongo(name)}$`, 'i') },
        })),
    })
        .select('username full_name profile_image_url')
        .lean();
    const byUsernameKey = new Map();
    for (const u of users) {
        const info = {
            username: u.username,
            name: u.full_name ?? u.username,
            profile_image_url: u.profile_image_url ?? null,
        };
        byUsernameKey.set(u.username.toLowerCase(), info);
    }
    return Object.fromEntries(unique
        .map((name) => {
        const info = byUsernameKey.get(name.toLowerCase());
        return info ? [name, info] : null;
    })
        .filter((entry) => entry !== null));
}
async function enrichTasks(tasks) {
    if (!tasks.length)
        return [];
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
async function enrichTask(task) {
    const [enriched] = await enrichTasks([task]);
    return enriched;
}
async function listTasks(query, context) {
    const filter = buildTaskListFilter(query, context);
    const { page, limit, skip } = parsePagination(query);
    const sort = buildSort(query, context.actorType);
    const [tasks, total] = await Promise.all([
        applicationTask_model_1.default.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        applicationTask_model_1.default.countDocuments(filter),
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
async function getClientByLeadId(leadId) {
    return DmsZohoClient.findOne({ lead_id: leadId }).lean();
}
async function assertStaffCanAccessTask(task, username, role) {
    if (role === 'master_admin' || role === 'supervisor' || role === 'team_leader') {
        return true;
    }
    if (role === 'admin') {
        return leadOwnersMatch(task.leadOwner, username);
    }
    return false;
}
async function assertClientCanAccessTask(task, leadId) {
    return task.leadId === leadId && task.status !== 'cancelled' && !task.deletedAt;
}
function isTaskDeleted(task) {
    return Boolean(task.deletedAt);
}
async function getTaskById(taskId) {
    return applicationTask_model_1.default.findById(taskId).lean();
}
function validateScheduleRange(scheduledFrom, scheduledTo) {
    if (scheduledFrom && scheduledTo && scheduledTo < scheduledFrom) {
        throw new Error('scheduledTo must be greater than or equal to scheduledFrom');
    }
}
async function createTask(body, staffUsername) {
    const client = await getClientByLeadId(body.leadId);
    if (!client) {
        throw new Error('leadId does not match an existing application');
    }
    const recordType = body.recordType ?? client.record_type;
    if (!adminApprovalRequest_model_1.RECORD_TYPES.includes(recordType)) {
        throw new Error('Invalid recordType');
    }
    const scheduledFrom = body.scheduledFrom ? parseDate(body.scheduledFrom) : null;
    const scheduledTo = body.scheduledTo ? parseDate(body.scheduledTo) : null;
    const date = body.date ? parseDate(body.date) : null;
    validateScheduleRange(scheduledFrom, scheduledTo);
    const rawLeadOwner = body.leadOwner ?? client.lead_owner;
    if (!rawLeadOwner) {
        throw new Error('leadOwner could not be resolved for this application');
    }
    const leadOwner = await normalizeLeadOwner(rawLeadOwner);
    const task = await applicationTask_model_1.default.create({
        leadId: body.leadId,
        recordType,
        leadOwner,
        title: body.title.trim(),
        description: body.description ?? null,
        status: body.status && (0, applicationTask_1.isTaskStatus)(body.status) ? body.status : 'todo',
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
async function updateTask(taskId, body, staffUsername) {
    const task = await applicationTask_model_1.default.findById(taskId);
    if (!task)
        return null;
    if (body.title !== undefined)
        task.title = body.title.trim();
    if (body.description !== undefined)
        task.description = body.description;
    if (body.links !== undefined)
        task.links = body.links;
    if (body.date !== undefined) {
        task.date = body.date ? parseDate(body.date) : null;
    }
    let scheduledFrom = task.scheduledFrom ?? null;
    let scheduledTo = task.scheduledTo ?? null;
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
async function updateTaskStatus(taskId, status, staffUsername) {
    if (!(0, applicationTask_1.isTaskStatus)(status)) {
        throw new Error('Invalid status');
    }
    const task = await applicationTask_model_1.default.findById(taskId);
    if (!task)
        return null;
    task.status = status;
    if (status === 'completed') {
        task.completedAt = new Date();
        task.completedBy = staffUsername;
    }
    else {
        task.completedAt = null;
        task.completedBy = null;
    }
    if (status === 'cancelled') {
        task.cancelledAt = new Date();
        task.cancelledBy = staffUsername;
    }
    else {
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
async function softDeleteTask(taskId, staffUsername) {
    const task = await applicationTask_model_1.default.findById(taskId);
    if (!task || task.deletedAt)
        return null;
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
function formatScheduleLabel(task) {
    if (!task.scheduledFrom && !task.scheduledTo)
        return null;
    const fmt = (d) => new Date(d).toLocaleString('en-AU', { timeZone: 'UTC' }) + ' UTC';
    if (task.scheduledFrom && task.scheduledTo) {
        return `From ${fmt(task.scheduledFrom)} to ${fmt(task.scheduledTo)}`;
    }
    if (task.scheduledFrom)
        return `From ${fmt(task.scheduledFrom)}`;
    return `Until ${fmt(task.scheduledTo)}`;
}
async function buildTaskNotificationMessage(task, overrideMessage) {
    if (overrideMessage?.trim())
        return overrideMessage.trim();
    const parts = [`${task.title}`];
    const schedule = formatScheduleLabel(task);
    if (schedule)
        parts.push(schedule);
    const meetingLink = (task.links ?? []).find((l) => l.type === 'meeting' || l.url);
    if (meetingLink?.url)
        parts.push(`Link: ${meetingLink.url}`);
    return parts.join(' — ');
}
async function sendFollowUpNow(taskId, body, staffUsername, req) {
    const task = await applicationTask_model_1.default.findById(taskId);
    if (!task)
        return null;
    const delivery = await dispatchFollowUp(task, body.source, staffUsername, req, body.message);
    task.followUpDeliveries.push(delivery);
    await task.save();
    return task.toObject();
}
async function dispatchFollowUp(task, source, triggeredByUsername, req, overrideMessage) {
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
        }
        else {
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
