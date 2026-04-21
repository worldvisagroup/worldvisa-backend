/**
 * One-time backfill: populate client_image_url and agent_image_url on all
 * CallLog records that are missing them.
 *
 * Safe to re-run — only processes records where at least one image field is null.
 *
 * Usage: node scripts/backfillCallLogImages.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CallLog       = require('../models/callLog');
const ZohoDmsUser   = require('../models/zohoDmsUser');
const DmsZohoClient = require('../models/dmsZohoClient');

async function run() {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  console.log('Connected to MongoDB');

  const records = await CallLog.find({
    $or: [
      { client_image_url: null, client_id: { $ne: null } },
      { agent_image_url:  null, agent_id:  { $ne: null } },
    ],
  }).select('_id client_id agent_id').lean();

  console.log(`Found ${records.length} records to backfill`);

  // Collect unique IDs to batch-fetch in one query each
  const clientIds = [...new Set(records.map(r => r.client_id?.toString()).filter(Boolean))];
  const agentIds  = [...new Set(records.map(r => r.agent_id?.toString()).filter(Boolean))];

  const [clients, agents] = await Promise.all([
    DmsZohoClient.find({ _id: { $in: clientIds } }).select('_id profile_image_url').lean(),
    ZohoDmsUser.find(  { _id: { $in: agentIds  } }).select('_id profile_image_url').lean(),
  ]);

  const clientMap = Object.fromEntries(clients.map(c => [c._id.toString(), c.profile_image_url ?? null]));
  const agentMap  = Object.fromEntries(agents.map(a  => [a._id.toString(), a.profile_image_url ?? null]));

  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const patch = {};

    const clientImageUrl = record.client_id ? clientMap[record.client_id.toString()] : undefined;
    const agentImageUrl  = record.agent_id  ? agentMap[record.agent_id.toString()]   : undefined;

    if (clientImageUrl !== undefined) patch.client_image_url = clientImageUrl;
    if (agentImageUrl  !== undefined) patch.agent_image_url  = agentImageUrl;

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    patch.updated_at = new Date();
    await CallLog.updateOne({ _id: record._id }, { $set: patch });
    updated++;

    if (updated % 100 === 0) {
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
