/**
 * Remove mock ApplicationTask documents created by seedMockApplicationTasks.js.
 *
 * Matches tasks with title starting [MOCK] or legacy createdBy=__mock_seed__.
 *
 * Usage:
 *   node scripts/cleanupMockApplicationTasks.js [--dry-run]            # default: preview
 *   node scripts/cleanupMockApplicationTasks.js --execute
 *   node scripts/cleanupMockApplicationTasks.js --execute --batch=<uuid>
 *   node scripts/cleanupMockApplicationTasks.js --execute --soft       # soft-delete instead
 */

require('tsx/cjs');

const mongoose = require('mongoose');
require('dotenv').config();

const ApplicationTask = require('../models/applicationTask.model').default;
const {
  buildMockTaskFilter,
  parseCleanupArgs,
  MOCK_CREATED_BY,
} = require('./lib/mockApplicationTaskGenerator');

async function run() {
  const { dryRun, soft, batchId } = parseCleanupArgs();

  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) throw new Error('MONGODB_CONNECTION_STRING env var is not set');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const filter = buildMockTaskFilter({ batchId });
  const mode = dryRun ? '[DRY RUN]' : soft ? '[EXECUTE — SOFT DELETE]' : '[EXECUTE — HARD DELETE]';
  console.log(`${mode}`);
  if (batchId) console.log(`Batch filter: ${batchId}`);
  console.log('');

  const tasks = await ApplicationTask.find(filter)
    .select('leadId title status createdBy createdAt')
    .sort({ createdAt: -1 })
    .lean();

  console.log(`Found ${tasks.length} mock task(s)\n`);

  if (tasks.length === 0) {
    await mongoose.disconnect();
    return;
  }

  for (const task of tasks.slice(0, 10)) {
    console.log(`  ${task._id} | ${task.createdBy} | ${task.leadId} | ${task.status} | ${task.title}`);
  }
  if (tasks.length > 10) {
    console.log(`  ... and ${tasks.length - 10} more`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Re-run with --execute to remove these tasks.');
    await mongoose.disconnect();
    return;
  }

  if (soft) {
    const result = await ApplicationTask.updateMany(filter, {
      $set: {
        deletedAt: new Date(),
        deletedBy: MOCK_CREATED_BY,
      },
    });
    console.log(`\nSoft-deleted ${result.modifiedCount} mock task(s).`);
  } else {
    const result = await ApplicationTask.deleteMany(filter);
    console.log(`\nHard-deleted ${result.deletedCount} mock task(s).`);
  }

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
