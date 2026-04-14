/**
 * Migration: backfill `participants` on existing requested_reviews entries
 *
 * For each review entry without `participants`, derives the full participant
 * list from: requested_by + requested_to + all message senders.
 *
 * Safe to re-run — skips entries that already have participants populated.
 *
 * Usage:
 *   node scripts/migrateRequestedReviewParticipants.js
 *
 * Dry-run (preview counts, no writes):
 *   DRY_RUN=true node scripts/migrateRequestedReviewParticipants.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const dmsZohoDocument = require('../models/dmsZohoDocument');

const DRY_RUN = process.env.DRY_RUN === 'true';

async function run() {
  const dbURL = process.env.MONGODB_CONNECTION_STRING;
  if (!dbURL) {
    console.error('MONGODB_CONNECTION_STRING is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(dbURL);
  console.log(`Connected to MongoDB. DRY_RUN=${DRY_RUN}\n`);

  // Only target documents that have at least one review entry with empty/missing participants
  const filter = {
    requested_reviews: {
      $elemMatch: {
        $or: [
          { participants: { $exists: false } },
          { participants: { $size: 0 } },
        ],
      },
    },
  };

  const total = await dmsZohoDocument.countDocuments(filter);
  console.log(`Documents to process: ${total}`);

  if (total === 0) {
    console.log('Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  let docsUpdated = 0;
  let reviewsPatched = 0;

  const cursor = dmsZohoDocument.find(filter).cursor();

  for await (const doc of cursor) {
    let dirty = false;

    for (const review of doc.requested_reviews) {
      if (review.participants && review.participants.length > 0) continue;

      // Collect all unique usernames from messages
      const messageSenders = (review.messages || [])
        .map((m) => m.username)
        .filter(Boolean);

      const participants = [
        ...new Set([
          review.requested_by,
          review.requested_to,
          ...messageSenders,
        ].filter(Boolean)),
      ];

      review.participants = participants;
      dirty = true;
      reviewsPatched++;

      console.log(
        `  Doc ${doc._id} | review ${review._id} → participants: [${participants.join(', ')}]`,
      );
    }

    if (dirty) {
      docsUpdated++;
      if (!DRY_RUN) {
        await doc.save();
      }
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Documents updated : ${docsUpdated}`);
  console.log(`Review entries patched: ${reviewsPatched}`);

  if (DRY_RUN) {
    console.log('\nDRY_RUN=true — no changes were written to the database.');
  } else {
    console.log('\nMigration complete. All changes saved.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
