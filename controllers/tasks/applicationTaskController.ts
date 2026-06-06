import type { Request, Response } from 'express';
import type {
  CreateTaskBody,
  SendFollowUpNowBody,
  TaskListQuery,
  UpdateTaskBody,
  UpdateTaskStatusBody,
} from '../../types/applicationTask.types';
import {
  assertClientCanAccessTask,
  assertStaffCanAccessTask,
  createTask,
  enrichTask,
  getTaskById,
  isTaskDeleted,
  listTasks,
  sendFollowUpNow,
  softDeleteTask,
  updateTask,
  updateTaskStatus,
} from '../../services/applicationTaskService';

function getStaffUser(req: Request) {
  return req.user as { username?: string; role?: string } | undefined;
}

function getClientUser(req: Request) {
  return req.user as { lead_id?: string; role?: string } | undefined;
}

function parseListQuery(query: Request['query']): TaskListQuery {
  return query as unknown as TaskListQuery;
}

function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

export async function listStaffTasks(req: Request, res: Response): Promise<void> {
  try {
    const user = getStaffUser(req);
    if (!user?.username) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const result = await listTasks(parseListQuery(req.query), {
      actorType: 'staff',
      username: user.username,
      role: user.role ?? req.clerkRole,
    });

    res.status(200).json({
      status: 'success',
      data: { tasks: result.tasks },
      pagination: result.pagination,
    });
  } catch (err: any) {
    console.error('[ApplicationTask] listStaffTasks error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

export async function listClientTasks(req: Request, res: Response): Promise<void> {
  try {
    const user = getClientUser(req);
    if (!user?.lead_id) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const result = await listTasks(parseListQuery(req.query), {
      actorType: 'client',
      leadId: user.lead_id,
    });

    res.status(200).json({
      status: 'success',
      data: { tasks: result.tasks },
      pagination: result.pagination,
    });
  } catch (err: any) {
    console.error('[ApplicationTask] listClientTasks error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

export async function getStaffTask(req: Request, res: Response): Promise<void> {
  try {
    const user = getStaffUser(req);
    if (!user?.username) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const taskId = getRouteParam(req, 'taskId');
    const task = await getTaskById(taskId);
    if (!task || isTaskDeleted(task)) {
      res.status(404).json({ status: 'fail', message: 'Task not found.' });
      return;
    }

    const allowed = await assertStaffCanAccessTask(task, user.username, user.role ?? req.clerkRole ?? '');
    if (!allowed) {
      res.status(403).json({ status: 'fail', message: 'Forbidden' });
      return;
    }

    res.status(200).json({ status: 'success', data: { task: await enrichTask(task) } });
  } catch (err: any) {
    console.error('[ApplicationTask] getStaffTask error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

export async function getClientTask(req: Request, res: Response): Promise<void> {
  try {
    const user = getClientUser(req);
    if (!user?.lead_id) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const taskId = getRouteParam(req, 'taskId');
    const task = await getTaskById(taskId);
    if (!task) {
      res.status(404).json({ status: 'fail', message: 'Task not found.' });
      return;
    }

    const allowed = await assertClientCanAccessTask(task, user.lead_id);
    if (!allowed) {
      res.status(403).json({ status: 'fail', message: 'Forbidden' });
      return;
    }

    res.status(200).json({ status: 'success', data: { task: await enrichTask(task) } });
  } catch (err: any) {
    console.error('[ApplicationTask] getClientTask error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

export async function createStaffTask(req: Request, res: Response): Promise<void> {
  try {
    const user = getStaffUser(req);
    if (!user?.username) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const body = req.body as CreateTaskBody;
    const task = await createTask(body, user.username);

    res.status(201).json({ status: 'success', data: { task: await enrichTask(task) } });
  } catch (err: any) {
    const message = err?.message ?? 'Internal server error.';
    const status = message.includes('leadId') || message.includes('required') || message.includes('Invalid')
      ? 400
      : 500;
    if (status === 500) console.error('[ApplicationTask] createStaffTask error:', err);
    res.status(status).json({ status: 'fail', message });
  }
}

export async function patchStaffTask(req: Request, res: Response): Promise<void> {
  try {
    const user = getStaffUser(req);
    if (!user?.username) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const taskId = getRouteParam(req, 'taskId');
    const existing = await getTaskById(taskId);
    if (!existing || isTaskDeleted(existing)) {
      res.status(404).json({ status: 'fail', message: 'Task not found.' });
      return;
    }

    const allowed = await assertStaffCanAccessTask(existing, user.username, user.role ?? req.clerkRole ?? '');
    if (!allowed) {
      res.status(403).json({ status: 'fail', message: 'Forbidden' });
      return;
    }

    const task = await updateTask(taskId, req.body as UpdateTaskBody, user.username);
    res.status(200).json({ status: 'success', data: { task: task ? await enrichTask(task) : null } });
  } catch (err: any) {
    const message = err?.message ?? 'Internal server error.';
    const status = message.includes('required') ? 400 : 500;
    if (status === 500) console.error('[ApplicationTask] patchStaffTask error:', err);
    res.status(status).json({ status: 'fail', message });
  }
}

export async function patchStaffTaskStatus(req: Request, res: Response): Promise<void> {
  try {
    const user = getStaffUser(req);
    if (!user?.username) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const taskId = getRouteParam(req, 'taskId');
    const existing = await getTaskById(taskId);
    if (!existing || isTaskDeleted(existing)) {
      res.status(404).json({ status: 'fail', message: 'Task not found.' });
      return;
    }

    const allowed = await assertStaffCanAccessTask(existing, user.username, user.role ?? req.clerkRole ?? '');
    if (!allowed) {
      res.status(403).json({ status: 'fail', message: 'Forbidden' });
      return;
    }

    const { status } = req.body as UpdateTaskStatusBody;
    const task = await updateTaskStatus(taskId, status, user.username);
    res.status(200).json({ status: 'success', data: { task: task ? await enrichTask(task) : null } });
  } catch (err: any) {
    const message = err?.message ?? 'Internal server error.';
    const status = message.includes('transition') || message.includes('Invalid') ? 400 : 500;
    if (status === 500) console.error('[ApplicationTask] patchStaffTaskStatus error:', err);
    res.status(status).json({ status: 'fail', message });
  }
}

export async function sendTaskFollowUpNow(req: Request, res: Response): Promise<void> {
  try {
    const user = getStaffUser(req);
    if (!user?.username) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const taskId = getRouteParam(req, 'taskId');
    const existing = await getTaskById(taskId);
    if (!existing || isTaskDeleted(existing)) {
      res.status(404).json({ status: 'fail', message: 'Task not found.' });
      return;
    }

    const allowed = await assertStaffCanAccessTask(existing, user.username, user.role ?? req.clerkRole ?? '');
    if (!allowed) {
      res.status(403).json({ status: 'fail', message: 'Forbidden' });
      return;
    }

    const task = await sendFollowUpNow(
      taskId,
      req.body as SendFollowUpNowBody,
      user.username,
      req
    );

    res.status(200).json({ status: 'success', data: { task: task ? await enrichTask(task) : null } });
  } catch (err: any) {
    console.error('[ApplicationTask] sendTaskFollowUpNow error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}

export async function deleteStaffTask(req: Request, res: Response): Promise<void> {
  try {
    const user = getStaffUser(req);
    if (!user?.username) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized' });
      return;
    }

    const taskId = getRouteParam(req, 'taskId');
    const existing = await getTaskById(taskId);
    if (!existing || isTaskDeleted(existing)) {
      res.status(404).json({ status: 'fail', message: 'Task not found.' });
      return;
    }

    const allowed = await assertStaffCanAccessTask(existing, user.username, user.role ?? req.clerkRole ?? '');
    if (!allowed) {
      res.status(403).json({ status: 'fail', message: 'Forbidden' });
      return;
    }

    const task = await softDeleteTask(taskId, user.username);
    res.status(200).json({ status: 'success', data: { task: task ? await enrichTask(task) : null } });
  } catch (err: any) {
    console.error('[ApplicationTask] deleteStaffTask error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
}
