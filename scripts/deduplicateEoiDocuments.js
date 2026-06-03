/**
 * One-time deduplication: remove duplicate EOI stage2 documents created by the
 * nested-loop upload bug (N files × M states = N×M records instead of N).
 *
 * Duplicates share the same (record_id, r2_key) pair but have different `state`
 * values. The record whose state matches the state hint in the r2_key slug is
 * kept; if no slug hint is found, the earliest-created record is kept.
 *
 * Safe to re-run — idempotent. Defaults to dry-run (no writes).
 *
 * Usage:
 *   node scripts/deduplicateEoiDocuments.js --dry-run [--record-id=<id>]
 *   node scripts/deduplicateEoiDocuments.js --execute [--record-id=<id>]
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Stage2Document = require('../models/dmsZohoAusStage2Documents');

// Maps lowercase slug tokens found in r2_key to canonical state codes.
const SLUG_TO_STATE = {
  act: 'ACT',
  nsw: 'NSW',
  vic: 'VIC',
  sa: 'SA',
  'south-australia': 'SA',
  wa: 'WA',
  'western-australia': 'WA',
  qld: 'QLD',
  queensland: 'QLD',
  tas: 'TAS',
  tasmania: 'TAS',
  nt: 'NT',
  'northern-territory': 'NT',
};

/**
 * Returns the state code inferred from the r2_key slug, or null if none found.
 * Checks tokens longest-first to avoid "sa" matching inside "tasmania".
 */
function inferStateFromSlug(r2Key) {
  const slug = (r2Key || '').toLowerCase();
  const tokens = Object.keys(SLUG_TO_STATE).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    // Match as a whole path segment / word boundary (surrounded by non-alpha or start/end)
    const re = new RegExp(`(?<![a-z])${token}(?![a-z])`);
    if (re.test(slug)) return SLUG_TO_STATE[token];
  }
  return null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const dryRun = !execute;
  const recordIdArg = args.find((a) => a.startsWith('--record-id='));
  const recordId = recordIdArg ? recordIdArg.split('=')[1] : null;
  return { dryRun, execute, recordId };
}

async function run() {
  const { dryRun, recordId } = parseArgs();

  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) throw new Error('MONGODB_CONNECTION_STRING env var is not set');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  console.log(dryRun ? '[DRY RUN] No changes will be written.' : '[EXECUTE] Duplicates will be deleted.');
  if (recordId) console.log(`Scoped to record_id: ${recordId}`);

  // Fetch all EOI records stored in R2 (duplicates only exist in this path).
  const query = { type: 'eoi', r2_key: { $exists: true, $ne: '' } };
  if (recordId) query.record_id = recordId;

  const records = await Stage2Document.find(query).sort({ createdAt: 1 }).lean();
  console.log(`\nFound ${records.length} EOI record(s) in scope.`);

  // Group by (record_id, r2_key).
  const groups = new Map();
  for (const rec of records) {
    const key = `${rec.record_id}::${rec.r2_key}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(rec);
  }

  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);
  const uniqueGroups = groups.size - duplicateGroups.length;
  console.log(`Groups total: ${groups.size}  (unique: ${uniqueGroups}, with duplicates: ${duplicateGroups.length})`);

  if (duplicateGroups.length === 0) {
    console.log('\nNo duplicates found. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const idsToDelete = [];
  let keepCount = 0;

  for (const group of duplicateGroups) {
    // group is sorted by createdAt asc (from the query sort).
    const inferredState = inferStateFromSlug(group[0].r2_key);
    const matchedRecord = inferredState
      ? group.find((r) => r.state === inferredState)
      : null;

    // Record to keep: slug-matched → fallback to earliest.
    const keepRecord = matchedRecord ?? group[0];
    const toDelete = group.filter((r) => String(r._id) !== String(keepRecord._id));

    console.log(
      `\n  r2_key: ${group[0].r2_key.split('/').pop()}  [${group.length} records, inferred state: ${inferredState ?? 'none'}]`,
    );
    console.log(
      `  KEEP   ${keepRecord._id}  state=${keepRecord.state}  createdAt=${keepRecord.createdAt.toISOString()}`,
    );
    for (const rec of toDelete) {
      console.log(
        `  DELETE ${rec._id}  state=${rec.state}  createdAt=${rec.createdAt.toISOString()}`,
      );
      idsToDelete.push(rec._id);
    }
    keepCount++;
  }

  console.log(`\nSummary: ${keepCount} group(s) — keep ${keepCount}, delete ${idsToDelete.length}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Re-run with --execute to apply deletions.');
  } else {
    const result = await Stage2Document.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`\nDeleted ${result.deletedCount} duplicate record(s).`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
