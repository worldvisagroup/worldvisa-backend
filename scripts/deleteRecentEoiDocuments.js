/**
 * One-time cleanup: delete all EOI stage2 documents with subclass 190 or 491
 * created within the last N days (default: 4).
 *
 * Safe to preview — defaults to dry-run (no writes).
 *
 * Usage:
 *   node scripts/deleteRecentEoiDocuments.js --dry-run [--days=4]
 *   node scripts/deleteRecentEoiDocuments.js --execute [--days=4]
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Stage2Document = require('../models/dmsZohoAusStage2Documents');

function parseArgs() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const dryRun = !execute;
  const daysArg = args.find((a) => a.startsWith('--days='));
  const days = daysArg ? Number(daysArg.split('=')[1]) : 4;
  if (Number.isNaN(days) || days <= 0) throw new Error('--days must be a positive number');
  return { dryRun, days };
}

async function run() {
  const { dryRun, days } = parseArgs();

  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) throw new Error('MONGODB_CONNECTION_STRING env var is not set');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  console.log(dryRun ? '[DRY RUN] No changes will be written.' : '[EXECUTE] Matching records will be deleted.');
  console.log(`Lookback window: ${days} day(s)\n`);

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query = {
    type: 'eoi',
    subclass: { $in: ['190', '491'] },
    createdAt: { $gte: cutoff },
  };

  const records = await Stage2Document.find(query).sort({ createdAt: -1 }).lean();
  console.log(`Found ${records.length} record(s) matching subclass 190/491 created since ${cutoff.toISOString()}\n`);

  if (records.length === 0) {
    console.log('Nothing to delete.');
    await mongoose.disconnect();
    return;
  }

  for (const rec of records) {
    console.log(
      `  [${rec.createdAt.toISOString()}]  _id=${rec._id}  record_id=${rec.record_id}  subclass=${rec.subclass}  state=${rec.state ?? 'N/A'}  file=${rec.file_name}`,
    );
  }

  console.log(`\nSummary: ${records.length} record(s) to delete`);

  if (dryRun) {
    console.log('\n[DRY RUN] Re-run with --execute to apply deletions.');
  } else {
    const ids = records.map((r) => r._id);
    const result = await Stage2Document.deleteMany({ _id: { $in: ids } });
    console.log(`\nDeleted ${result.deletedCount} record(s).`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
