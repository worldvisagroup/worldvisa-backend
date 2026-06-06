'use strict';

const crypto = require('crypto');
const {
  MOCK_CREATED_BY,
  MOCK_TITLE_PREFIX,
  MOCK_BATCH_DESC_PREFIX,
  STAFF_ROLES,
  TASK_STATUSES,
  TASK_LINK_TYPES,
  DEFAULT_CLIENT_COUNT,
  DEFAULT_TASKS_PER_CLIENT,
  TITLE_TEMPLATES,
  DESCRIPTION_SNIPPETS,
} = require('./mockApplicationTaskConstants');

const STATUS_WEIGHTS = [
  { status: 'todo', weight: 40 },
  { status: 'in_progress', weight: 25 },
  { status: 'completed', weight: 25 },
  { status: 'cancelled', weight: 10 },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAlphanumeric(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function pickWeightedStatus() {
  const total = STATUS_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of STATUS_WEIGHTS) {
    roll -= item.weight;
    if (roll <= 0) return item.status;
  }
  return STATUS_WEIGHTS[0].status;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildScheduleScenario(index) {
  const now = new Date();
  const scenario = index % 5;

  switch (scenario) {
    case 0:
      return { date: null, scheduledFrom: null, scheduledTo: null, withLinks: false };
    case 1: {
      const date = startOfUtcDay(addDays(now, (index % 14) - 7));
      return { date, scheduledFrom: null, scheduledTo: null, withLinks: false };
    }
    case 2: {
      const scheduledFrom = addDays(now, -3);
      scheduledFrom.setUTCHours(10, 0, 0, 0);
      const scheduledTo = addHours(scheduledFrom, 1);
      return {
        date: startOfUtcDay(scheduledFrom),
        scheduledFrom,
        scheduledTo,
        withLinks: true,
      };
    }
    case 3: {
      const scheduledFrom = addDays(now, 1);
      scheduledFrom.setUTCHours(14, 0, 0, 0);
      const scheduledTo = addHours(scheduledFrom, 2);
      return {
        date: startOfUtcDay(scheduledFrom),
        scheduledFrom,
        scheduledTo,
        withLinks: true,
      };
    }
    default: {
      const scheduledFrom = addDays(now, 7);
      scheduledFrom.setUTCHours(9, 30, 0, 0);
      const scheduledTo = addHours(scheduledFrom, 1);
      return {
        date: startOfUtcDay(scheduledFrom),
        scheduledFrom,
        scheduledTo,
        withLinks: Math.random() < 0.6,
      };
    }
  }
}

function buildLinks(withLinks) {
  if (!withLinks) return [];

  const typeRoll = Math.random();
  const type = typeRoll < 0.6 ? 'meeting' : pickRandom(TASK_LINK_TYPES);

  if (type === 'meeting') {
    return [{
      url: `https://meet.google.com/mock-${randomAlphanumeric(8)}`,
      label: 'Client meeting',
      type: 'meeting',
    }];
  }

  if (type === 'document') {
    return [{
      url: `https://docs.example.com/mock/${randomAlphanumeric(6)}`,
      label: 'Reference document',
      type: 'document',
    }];
  }

  return [{
    url: `https://worldvisa.example.com/tasks/${randomAlphanumeric(6)}`,
    label: 'Task link',
    type: 'general',
  }];
}

function pickCreatorUsername(client, activeStaffUsers) {
  if (!activeStaffUsers.length) {
    throw new Error('No active staff users available for createdBy');
  }

  const ownerMatch = activeStaffUsers.find((u) => u.username === client.lead_owner);
  if (ownerMatch && Math.random() < 0.65) {
    return ownerMatch.username;
  }

  return pickRandom(activeStaffUsers).username;
}

function buildMockTaskDoc(client, { batchId, index, activeStaffUsers }) {
  if (!client?.lead_id || !client?.lead_owner || !client?.record_type) {
    throw new Error(`Client missing required fields: ${JSON.stringify(client)}`);
  }

  const createdBy = pickCreatorUsername(client, activeStaffUsers);
  const status = pickWeightedStatus();
  const schedule = buildScheduleScenario(index);
  const titleBase = pickRandom(TITLE_TEMPLATES);
  const snippet = pickRandom(DESCRIPTION_SNIPPETS);
  const now = new Date();

  const doc = {
    leadId: client.lead_id,
    recordType: client.record_type,
    leadOwner: client.lead_owner,
    title: `${MOCK_TITLE_PREFIX}${titleBase}`,
    description: `${snippet}\n\n${MOCK_BATCH_DESC_PREFIX} ${batchId})`,
    status,
    date: schedule.date,
    scheduledFrom: schedule.scheduledFrom,
    scheduledTo: schedule.scheduledTo,
    createdBy,
    completedAt: null,
    completedBy: null,
    cancelledAt: null,
    cancelledBy: null,
    deletedAt: null,
    deletedBy: null,
    links: buildLinks(schedule.withLinks),
    followUpDeliveries: [],
  };

  if (status === 'completed') {
    doc.completedAt = addDays(now, -Math.floor(Math.random() * 5));
    doc.completedBy = createdBy;
  } else if (status === 'cancelled') {
    doc.cancelledAt = addDays(now, -Math.floor(Math.random() * 3));
    doc.cancelledBy = createdBy;
  }

  // Overdue filter needs active status + past scheduledTo
  if (schedule.scheduledTo && schedule.scheduledTo < now && status === 'cancelled') {
    doc.status = 'todo';
    doc.cancelledAt = null;
    doc.cancelledBy = null;
  }

  return doc;
}

function buildMockTaskFilter({ batchId } = {}) {
  const filter = {
    $or: [
      { title: { $regex: '^\\[MOCK\\] ' } },
      { createdBy: MOCK_CREATED_BY },
    ],
  };

  if (batchId) {
    filter.description = { $regex: `batch: ${batchId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` };
  }

  return filter;
}

function parseSeedArgs(argv = process.argv.slice(2)) {
  const dryRun = argv.includes('--dry-run');
  const batchArg = argv.find((a) => a.startsWith('--batch='));
  const clientsArg = argv.find((a) => a.startsWith('--clients='));
  const tasksArg = argv.find((a) => a.startsWith('--tasks-per-client='));

  const clientCount = clientsArg
    ? Number(clientsArg.split('=')[1])
    : DEFAULT_CLIENT_COUNT;
  const tasksPerClient = tasksArg
    ? Number(tasksArg.split('=')[1])
    : DEFAULT_TASKS_PER_CLIENT;
  const batchId = batchArg?.split('=')[1] || crypto.randomUUID();

  if (Number.isNaN(clientCount) || clientCount <= 0) {
    throw new Error('--clients must be a positive number');
  }
  if (Number.isNaN(tasksPerClient) || tasksPerClient <= 0) {
    throw new Error('--tasks-per-client must be a positive number');
  }

  return { dryRun, clientCount, tasksPerClient, batchId };
}

function parseCleanupArgs(argv = process.argv.slice(2)) {
  const execute = argv.includes('--execute');
  const soft = argv.includes('--soft');
  const batchArg = argv.find((a) => a.startsWith('--batch='));
  const batchId = batchArg?.split('=')[1] || null;

  return {
    dryRun: !execute,
    soft,
    batchId,
  };
}

async function sampleRandomClients(DmsZohoClient, count) {
  const match = {
    lead_id: { $exists: true, $nin: [null, ''] },
    lead_owner: { $exists: true, $nin: [null, ''] },
    record_type: { $in: ['visa_application', 'spouse_skill_assessment'] },
  };

  const clients = await DmsZohoClient.aggregate([
    { $match: match },
    { $sample: { size: count } },
    { $project: { lead_id: 1, lead_owner: 1, record_type: 1, name: 1 } },
  ]);

  return clients;
}

async function countEligibleClients(DmsZohoClient) {
  return DmsZohoClient.countDocuments({
    lead_id: { $exists: true, $nin: [null, ''] },
    lead_owner: { $exists: true, $nin: [null, ''] },
    record_type: { $in: ['visa_application', 'spouse_skill_assessment'] },
  });
}

async function loadActiveStaffUsers(ZohoDmsUser) {
  return ZohoDmsUser.find({
    account_status: 'active',
    role: { $in: STAFF_ROLES },
    username: { $exists: true, $nin: [null, ''] },
  })
    .select('username full_name profile_image_url role')
    .lean();
}

function summarizeTasks(tasks) {
  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0]));
  const byLead = {};

  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    byLead[task.leadId] = (byLead[task.leadId] || 0) + 1;
  }

  return { byStatus, byLead, total: tasks.length };
}

module.exports = {
  buildMockTaskDoc,
  buildMockTaskFilter,
  parseSeedArgs,
  parseCleanupArgs,
  sampleRandomClients,
  countEligibleClients,
  loadActiveStaffUsers,
  summarizeTasks,
  MOCK_CREATED_BY,
  MOCK_TITLE_PREFIX,
};
