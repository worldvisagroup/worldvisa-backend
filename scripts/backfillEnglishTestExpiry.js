/**
 * One-time backfill: update expiry_at for all "English Language Test" outcome
 * documents to outcome_date + 3 years (was previously set to outcome_date + 5 years).
 *
 * Safe to re-run — always sets expiry_at to outcome_date + 3 years (idempotent).
 * Defaults to dry-run (no writes).
 *
 * Usage:
 *   node scripts/backfillEnglishTestExpiry.js --dry-run
 *   node scripts/backfillEnglishTestExpiry.js --execute
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Stage2Document = require('../models/dmsZohoAusStage2Documents');

function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  return { dryRun: !execute };
}

async function run() {
  const { dryRun } = parseArgs();

  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) throw new Error('MONGODB_CONNECTION_STRING env var is not set');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  console.log(dryRun ? '[DRY RUN] No changes will be written.' : '[EXECUTE] Records will be updated.');
  console.log('');

  const records = await Stage2Document.find({
    type: 'outcome',
    outcome: 'English Language Test',
    outcome_date: { $exists: true, $ne: null },
  }).lean();

  console.log(`Found ${records.length} English Language Test outcome record(s)\n`);

  if (records.length === 0) {
    console.log('Nothing to update.');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const rec of records) {
    const outcomeDate = new Date(rec.outcome_date);
    if (Number.isNaN(outcomeDate.getTime())) {
      console.log(`  SKIP  [${rec._id}] record_id=${rec.record_id} — outcome_date is invalid: ${rec.outcome_date}`);
      skipped++;
      continue;
    }

    const newExpiry = addYears(outcomeDate, 3);
    const oldExpiry = rec.expiry_at ? new Date(rec.expiry_at).toISOString() : 'none';

    console.log(
      `  UPDATE [${rec._id}]  record_id=${rec.record_id}  outcome_date=${outcomeDate.toISOString().split('T')[0]}  old_expiry=${oldExpiry}  new_expiry=${newExpiry.toISOString()}`,
    );

    if (!dryRun) {
      try {
        await Stage2Document.updateOne({ _id: rec._id }, { $set: { expiry_at: newExpiry } });
        updated++;
      } catch (err) {
        console.error(`  ERROR  [${rec._id}]:`, err.message);
        errors++;
      }
    } else {
      updated++;
    }
  }

  console.log(
    `\nDone. ${dryRun ? 'would update' : 'updated'}=${updated}  skipped=${skipped}${errors > 0 ? `  errors=${errors}` : ''}`,
  );

  if (dryRun) {
    console.log('\n[DRY RUN] Re-run with --execute to apply updates.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
