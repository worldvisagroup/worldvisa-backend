/**
 * One-time backfill: advance application_stage for existing applications based on
 * their Stage 2 documents.
 *
 * Rules (priority order — higher wins):
 *   EOI doc present                         → "Lodge Application 1"
 *   English Language Test outcome present   → "Language Test"
 *   Skill Assessment Outcome present        → "Stage 1 Milestone Completed"
 *
 * The stage is only advanced, never regressed. Applications already at a higher
 * stage (e.g. "Lodge Application 2") are left unchanged.
 *
 * Safe to re-run — idempotent. Defaults to dry-run (no writes).
 *
 * Usage:
 *   node scripts/backfillApplicationStageFromDocuments.js --dry-run [--record-id=<id>]
 *   node scripts/backfillApplicationStageFromDocuments.js --execute [--record-id=<id>]
 */

const mongoose = require('mongoose');
require('dotenv').config();

const dmsZohoAusStage2Documents = require('../models/dmsZohoAusStage2Documents');
const DmsZohoClient = require('../models/dmsZohoClient');
const { APPLICATION_STAGES } = require('../controllers/helper/constants');

function parseArgs() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const recordIdArg = args.find((a) => a.startsWith('--record-id='));
  const recordId = recordIdArg ? recordIdArg.split('=')[1] : null;
  return { dryRun: !execute, recordId };
}

function computeStageFromDocs(docs) {
  if (docs.some((d) => d.type === 'eoi')) return 'Lodge Application 1';
  if (docs.some((d) => d.type === 'outcome' && d.outcome === 'English Language Test')) return 'Language Test';
  if (docs.some((d) => d.type === 'outcome' && d.outcome === 'Skill Assessment Outcome')) return 'Stage 1 Milestone Completed';
  return null;
}

async function run() {
  const { dryRun, recordId } = parseArgs();

  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) throw new Error('MONGODB_CONNECTION_STRING env var is not set');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  console.log(dryRun ? '[DRY RUN] No changes will be written.' : '[EXECUTE] application_stage will be updated.');
  if (recordId) console.log(`Scoped to record_id: ${recordId}\n`);

  // Find all distinct record_ids in the stage2 documents collection
  const matchStage = recordId ? { $match: { record_id: recordId } } : { $match: {} };
  const distinctRecordIds = await dmsZohoAusStage2Documents.aggregate([
    matchStage,
    { $group: { _id: '$record_id' } },
  ]);

  const recordIds = distinctRecordIds.map((r) => r._id).filter(Boolean);
  console.log(`Found ${recordIds.length} application(s) with Stage 2 documents\n`);

  let updated = 0;
  let skipped = 0;
  let noMatch = 0;
  let errors = 0;

  const rank = (s) => APPLICATION_STAGES.indexOf(s);

  for (const rid of recordIds) {
    try {
      const docs = await dmsZohoAusStage2Documents.find({ record_id: rid }).lean();
      const computed = computeStageFromDocs(docs);

      if (!computed) {
        console.log(`  NO-MATCH  record_id=${rid}`);
        noMatch++;
        continue;
      }

      const client = await DmsZohoClient.findOne({ lead_id: rid }).select('application_stage').lean();
      const currentStage = client?.application_stage ?? null;

      if (rank(computed) <= rank(currentStage)) {
        console.log(`  SKIP      record_id=${rid}  current="${currentStage}" >= computed="${computed}"`);
        skipped++;
        continue;
      }

      console.log(`  UPDATE    record_id=${rid}  "${currentStage ?? 'none'}" → "${computed}"`);

      if (!dryRun) {
        await DmsZohoClient.findOneAndUpdate(
          { lead_id: rid },
          { $set: { application_stage: computed } },
        );
      }
      updated++;
    } catch (err) {
      console.error(`  ERROR     record_id=${rid}:`, err.message);
      errors++;
    }
  }

  console.log(`\nDone. ${dryRun ? 'would update' : 'updated'}=${updated}  skipped=${skipped}  no-match=${noMatch}${errors > 0 ? `  errors=${errors}` : ''}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Re-run with --execute to apply updates.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
