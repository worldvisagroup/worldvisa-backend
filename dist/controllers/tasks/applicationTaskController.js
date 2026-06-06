"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStaffTasks = listStaffTasks;
exports.listClientTasks = listClientTasks;
exports.getStaffTask = getStaffTask;
exports.getClientTask = getClientTask;
exports.createStaffTask = createStaffTask;
exports.patchStaffTask = patchStaffTask;
exports.patchStaffTaskStatus = patchStaffTaskStatus;
exports.sendTaskFollowUpNow = sendTaskFollowUpNow;
exports.deleteStaffTask = deleteStaffTask;
const applicationTaskService_1 = require("../../services/applicationTaskService");
function getStaffUser(req) {
    return req.user;
}
function getClientUser(req) {
    return req.user;
}
function parseListQuery(query) {
    return query;
}
function getRouteParam(req, name) {
    const value = req.params[name];
    return Array.isArray(value) ? value[0] : value;
}
async function listStaffTasks(req, res) {
    try {
        const user = getStaffUser(req);
        if (!user?.username) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const result = await (0, applicationTaskService_1.listTasks)(parseListQuery(req.query), {
            actorType: 'staff',
            username: user.username,
            role: user.role ?? req.clerkRole,
        });
        res.status(200).json({
            status: 'success',
            data: { tasks: result.tasks },
            pagination: result.pagination,
        });
    }
    catch (err) {
        console.error('[ApplicationTask] listStaffTasks error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
}
async function listClientTasks(req, res) {
    try {
        const user = getClientUser(req);
        if (!user?.lead_id) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const result = await (0, applicationTaskService_1.listTasks)(parseListQuery(req.query), {
            actorType: 'client',
            leadId: user.lead_id,
        });
        res.status(200).json({
            status: 'success',
            data: { tasks: result.tasks },
            pagination: result.pagination,
        });
    }
    catch (err) {
        console.error('[ApplicationTask] listClientTasks error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
}
async function getStaffTask(req, res) {
    try {
        const user = getStaffUser(req);
        if (!user?.username) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const taskId = getRouteParam(req, 'taskId');
        const task = await (0, applicationTaskService_1.getTaskById)(taskId);
        if (!task || (0, applicationTaskService_1.isTaskDeleted)(task)) {
            res.status(404).json({ status: 'fail', message: 'Task not found.' });
            return;
        }
        const allowed = await (0, applicationTaskService_1.assertStaffCanAccessTask)(task, user.username, user.role ?? req.clerkRole ?? '');
        if (!allowed) {
            res.status(403).json({ status: 'fail', message: 'Forbidden' });
            return;
        }
        res.status(200).json({ status: 'success', data: { task: await (0, applicationTaskService_1.enrichTask)(task) } });
    }
    catch (err) {
        console.error('[ApplicationTask] getStaffTask error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
}
async function getClientTask(req, res) {
    try {
        const user = getClientUser(req);
        if (!user?.lead_id) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const taskId = getRouteParam(req, 'taskId');
        const task = await (0, applicationTaskService_1.getTaskById)(taskId);
        if (!task) {
            res.status(404).json({ status: 'fail', message: 'Task not found.' });
            return;
        }
        const allowed = await (0, applicationTaskService_1.assertClientCanAccessTask)(task, user.lead_id);
        if (!allowed) {
            res.status(403).json({ status: 'fail', message: 'Forbidden' });
            return;
        }
        res.status(200).json({ status: 'success', data: { task: await (0, applicationTaskService_1.enrichTask)(task) } });
    }
    catch (err) {
        console.error('[ApplicationTask] getClientTask error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
}
async function createStaffTask(req, res) {
    try {
        const user = getStaffUser(req);
        if (!user?.username) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const body = req.body;
        const task = await (0, applicationTaskService_1.createTask)(body, user.username);
        res.status(201).json({ status: 'success', data: { task: await (0, applicationTaskService_1.enrichTask)(task) } });
    }
    catch (err) {
        const message = err?.message ?? 'Internal server error.';
        const status = message.includes('leadId') || message.includes('required') || message.includes('Invalid')
            ? 400
            : 500;
        if (status === 500)
            console.error('[ApplicationTask] createStaffTask error:', err);
        res.status(status).json({ status: 'fail', message });
    }
}
async function patchStaffTask(req, res) {
    try {
        const user = getStaffUser(req);
        if (!user?.username) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const taskId = getRouteParam(req, 'taskId');
        const existing = await (0, applicationTaskService_1.getTaskById)(taskId);
        if (!existing || (0, applicationTaskService_1.isTaskDeleted)(existing)) {
            res.status(404).json({ status: 'fail', message: 'Task not found.' });
            return;
        }
        const allowed = await (0, applicationTaskService_1.assertStaffCanAccessTask)(existing, user.username, user.role ?? req.clerkRole ?? '');
        if (!allowed) {
            res.status(403).json({ status: 'fail', message: 'Forbidden' });
            return;
        }
        const task = await (0, applicationTaskService_1.updateTask)(taskId, req.body, user.username);
        res.status(200).json({ status: 'success', data: { task: task ? await (0, applicationTaskService_1.enrichTask)(task) : null } });
    }
    catch (err) {
        const message = err?.message ?? 'Internal server error.';
        const status = message.includes('required') ? 400 : 500;
        if (status === 500)
            console.error('[ApplicationTask] patchStaffTask error:', err);
        res.status(status).json({ status: 'fail', message });
    }
}
async function patchStaffTaskStatus(req, res) {
    try {
        const user = getStaffUser(req);
        if (!user?.username) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const taskId = getRouteParam(req, 'taskId');
        const existing = await (0, applicationTaskService_1.getTaskById)(taskId);
        if (!existing || (0, applicationTaskService_1.isTaskDeleted)(existing)) {
            res.status(404).json({ status: 'fail', message: 'Task not found.' });
            return;
        }
        const allowed = await (0, applicationTaskService_1.assertStaffCanAccessTask)(existing, user.username, user.role ?? req.clerkRole ?? '');
        if (!allowed) {
            res.status(403).json({ status: 'fail', message: 'Forbidden' });
            return;
        }
        const { status } = req.body;
        const task = await (0, applicationTaskService_1.updateTaskStatus)(taskId, status, user.username);
        res.status(200).json({ status: 'success', data: { task: task ? await (0, applicationTaskService_1.enrichTask)(task) : null } });
    }
    catch (err) {
        const message = err?.message ?? 'Internal server error.';
        const status = message.includes('transition') || message.includes('Invalid') ? 400 : 500;
        if (status === 500)
            console.error('[ApplicationTask] patchStaffTaskStatus error:', err);
        res.status(status).json({ status: 'fail', message });
    }
}
async function sendTaskFollowUpNow(req, res) {
    try {
        const user = getStaffUser(req);
        if (!user?.username) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const taskId = getRouteParam(req, 'taskId');
        const existing = await (0, applicationTaskService_1.getTaskById)(taskId);
        if (!existing || (0, applicationTaskService_1.isTaskDeleted)(existing)) {
            res.status(404).json({ status: 'fail', message: 'Task not found.' });
            return;
        }
        const allowed = await (0, applicationTaskService_1.assertStaffCanAccessTask)(existing, user.username, user.role ?? req.clerkRole ?? '');
        if (!allowed) {
            res.status(403).json({ status: 'fail', message: 'Forbidden' });
            return;
        }
        const task = await (0, applicationTaskService_1.sendFollowUpNow)(taskId, req.body, user.username, req);
        res.status(200).json({ status: 'success', data: { task: task ? await (0, applicationTaskService_1.enrichTask)(task) : null } });
    }
    catch (err) {
        console.error('[ApplicationTask] sendTaskFollowUpNow error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
}
async function deleteStaffTask(req, res) {
    try {
        const user = getStaffUser(req);
        if (!user?.username) {
            res.status(401).json({ status: 'fail', message: 'Unauthorized' });
            return;
        }
        const taskId = getRouteParam(req, 'taskId');
        const existing = await (0, applicationTaskService_1.getTaskById)(taskId);
        if (!existing || (0, applicationTaskService_1.isTaskDeleted)(existing)) {
            res.status(404).json({ status: 'fail', message: 'Task not found.' });
            return;
        }
        const allowed = await (0, applicationTaskService_1.assertStaffCanAccessTask)(existing, user.username, user.role ?? req.clerkRole ?? '');
        if (!allowed) {
            res.status(403).json({ status: 'fail', message: 'Forbidden' });
            return;
        }
        const task = await (0, applicationTaskService_1.softDeleteTask)(taskId, user.username);
        res.status(200).json({ status: 'success', data: { task: task ? await (0, applicationTaskService_1.enrichTask)(task) : null } });
    }
    catch (err) {
        console.error('[ApplicationTask] deleteStaffTask error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
}
