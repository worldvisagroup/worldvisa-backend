/**
 * One-time migration: correct start_time and end_time on CallLog records that
 * were stored with MCube's IST timestamps treated as UTC (5h 30m ahead).
 *
 * Root cause: parseDate() used `new Date(value)` which Node treats as UTC,
 * but MCube sends "YYYY-MM-DD HH:MM:SS" in IST (UTC+05:30).
 * Fix: subtract 19800 seconds (5h 30m) from start_time and end_time.
 *
 * Safe to re-run — records already corrected are excluded by the filter
 * (created_at used as a proxy: only records created before the code fix).
 *
 * Usage: node scripts/fixCallLogTimestamps.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CallLog = require('../models/callLog');

// Timestamp of the deployed fix — records created after this are already correct.
// Set to the time you deploy the parseDate fix (ISO string, UTC).
const FIX_DEPLOYED_AT = new Date('2026-04-21T09:00:00.000Z');

const OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h 30m in milliseconds

async function run() {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  console.log('Connected to MongoDB');

  const records = await CallLog.find({
    created_at: { $lt: FIX_DEPLOYED_AT },
    start_time: { $exists: true, $ne: null },
  }).lean();

  console.log(`Found ${records.length} records to migrate`);

  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const patch = {};

    if (record.start_time) {
      patch.start_time = new Date(record.start_time.getTime() - OFFSET_MS);
    }
    if (record.end_time) {
      patch.end_time = new Date(record.end_time.getTime() - OFFSET_MS);
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    patch.updated_at = new Date();

    await CallLog.updateOne({ _id: record._id }, { $set: patch });
    updated++;

    if (updated % 50 === 0) {
      console.log(`  Progress: ${updated} updated, ${skipped} skipped`);
    }
  }

  console.log(`\nDone — updated: ${updated}, skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
