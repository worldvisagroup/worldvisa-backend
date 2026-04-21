/**
 * One-time backfill: set status → 'busy' for all CallLog records where
 * dial_status is 'EXECUTIVE BUSY' but status was incorrectly stored as
 * 'completed' (caused by case-sensitive switch statement before the fix).
 *
 * Safe to re-run — the updateMany filter only matches documents that still
 * have the wrong status, so re-runs are no-ops.
 *
 * Usage: node scripts/fixExecutiveBusyStatus.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CallLog = require('../models/callLog');

async function run() {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  console.log('Connected to MongoDB');

  const result = await CallLog.updateMany(
    {
      dial_status: { $regex: /^executive busy$/i },
      status: { $ne: 'busy' },
    },
    {
      $set: { status: 'busy', updated_at: new Date() },
    }
  );

  console.log(`Matched: ${result.matchedCount}  Updated: ${result.modifiedCount}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
