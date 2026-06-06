/**
 * Seed random ApplicationTask documents from random DmsZohoClient records for UI testing.
 *
 * Mock tasks are tagged with title prefix [MOCK] and a batch id in description.
 * createdBy is set to a real active staff username (for createdByInfo in list API).
 * Clean up later with: npm run cleanup:mock-tasks:execute
 *
 * Usage:
 *   node scripts/seedMockApplicationTasks.js [--clients=10] [--tasks-per-client=5]
 *   node scripts/seedMockApplicationTasks.js --dry-run
 *   node scripts/seedMockApplicationTasks.js --batch=<uuid>
 *
 * Safety: blocked on NODE_ENV=production unless ALLOW_MOCK_TASK_SEED=true
 */

require('tsx/cjs');

const mongoose = require('mongoose');
require('dotenv').config();

const DmsZohoClient = require('../models/dmsZohoClient');
const ZohoDmsUser = require('../models/zohoDmsUser');
const ApplicationTask = require('../models/applicationTask.model').default;
const {
  buildMockTaskDoc,
  parseSeedArgs,
  sampleRandomClients,
  countEligibleClients,
  loadActiveStaffUsers,
  summarizeTasks,
} = require('./lib/mockApplicationTaskGenerator');

function assertSafeToRun() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_TASK_SEED !== 'true') {
    throw new Error(
      'Refusing to seed mock tasks in production. Set ALLOW_MOCK_TASK_SEED=true to override.'
    );
  }
}

async function run() {
  assertSafeToRun();

  const { dryRun, clientCount, tasksPerClient, batchId } = parseSeedArgs();

  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) throw new Error('MONGODB_CONNECTION_STRING env var is not set');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  console.log(dryRun ? '[DRY RUN] No documents will be inserted.' : '[EXECUTE] Inserting mock tasks.');
  console.log(`Batch ID: ${batchId}`);
  console.log(`Clients: ${clientCount}, tasks per client: ${tasksPerClient}\n`);

  const [eligibleCount, activeStaffUsers] = await Promise.all([
    countEligibleClients(DmsZohoClient),
    loadActiveStaffUsers(ZohoDmsUser),
  ]);

  console.log(`Eligible clients (lead_id + lead_owner + record_type): ${eligibleCount}`);
  console.log(`Active staff users for createdBy: ${activeStaffUsers.length}`);

  if (eligibleCount === 0) {
    throw new Error(
      'No eligible clients found. Clients need lead_id, lead_owner, and record_type (visa_application or spouse_skill_assessment).'
    );
  }

  if (activeStaffUsers.length === 0) {
    throw new Error('No active staff users found. Need account_status=active and a staff role.');
  }

  console.log('\nActive staff sample:');
  for (const user of activeStaffUsers.slice(0, 5)) {
    console.log(`  ${user.username} (${user.role}) — ${user.full_name ?? user.username}`);
  }
  if (activeStaffUsers.length > 5) {
    console.log(`  ... and ${activeStaffUsers.length - 5} more`);
  }
  console.log('');

  const clients = await sampleRandomClients(DmsZohoClient, clientCount);
  if (!clients.length) {
    throw new Error('No clients found in DmsZohoClient collection.');
  }

  if (clients.length < clientCount) {
    console.warn(`Warning: only ${clients.length} client(s) available (requested ${clientCount}).`);
  }

  const docs = [];
  let index = 0;
  for (const client of clients) {
    for (let i = 0; i < tasksPerClient; i += 1) {
      docs.push(buildMockTaskDoc(client, { batchId, index, activeStaffUsers }));
      index += 1;
    }
  }

  const summary = summarizeTasks(docs);
  const creators = [...new Set(docs.map((d) => d.createdBy))];

  console.log(`Prepared ${summary.total} task(s) across ${clients.length} client(s)`);
  console.log(`Creators used: ${creators.length} active staff username(s)\n`);

  console.log('Status breakdown:');
  for (const [status, count] of Object.entries(summary.byStatus)) {
    console.log(`  ${status}: ${count}`);
  }

  console.log('\nSample tasks:');
  for (const doc of docs.slice(0, 5)) {
    console.log(`  ${doc.leadId} | ${doc.createdBy} | ${doc.status} | ${doc.title}`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Re-run without --dry-run to insert.');
    await mongoose.disconnect();
    return;
  }

  const inserted = await ApplicationTask.insertMany(docs, { ordered: false });
  console.log(`\nInserted ${inserted.length} mock task(s).`);
  console.log(`Cleanup: npm run cleanup:mock-tasks:execute -- --batch=${batchId}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Fatal:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
