/**
 * One-time backfill: populate client_image_url and agent_image_url on all
 * CallLog records that are missing them.
 *
 * Handles two cases:
 *   1. Records that already have client_id / agent_id but are missing the image URL
 *      → batch-fetch by ID (fast path, same as before)
 *   2. Records where client_id / agent_id is null but customer_phone / agent_phone exists
 *      → re-resolve by phone (suffix match) + agent name fallback, then write all fields
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

// ── Phone helpers (mirrors mcubeWebhookController logic) ──────────────────────

function phoneSuffix(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(-9) : null;
}

async function resolveClientByPhone(phone) {
  const suffix = phoneSuffix(phone);
  if (!suffix) return null;
  return DmsZohoClient
    .findOne({ phone: { $regex: `${suffix}$` } })
    .select('_id lead_id name profile_image_url')
    .lean();
}

async function resolveAgentByPhone(phone, agentName) {
  const suffix = phoneSuffix(phone);
  let user = null;

  if (suffix) {
    user = await ZohoDmsUser
      .findOne({ agent_number: { $regex: `${suffix}$` } })
      .select('_id profile_image_url')
      .lean();
  }

  if (!user && agentName) {
    user = await ZohoDmsUser
      .findOne({ $or: [{ mcube_username: agentName }, { full_name: agentName }] })
      .select('_id profile_image_url')
      .lean();
  }

  return user;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  console.log('Connected to MongoDB');

  const records = await CallLog.find({
    $or: [
      { client_image_url: null },
      { agent_image_url:  null },
    ],
  }).select('_id client_id agent_id customer_phone agent_phone agent_name').lean();

  console.log(`Found ${records.length} records to backfill`);

  // ── Fast path: already have IDs, just need the image URLs ─────────────────

  const withClientId = records.filter(r => r.client_id);
  const withAgentId  = records.filter(r => r.agent_id);

  const clientIds = [...new Set(withClientId.map(r => r.client_id.toString()))];
  const agentIds  = [...new Set(withAgentId.map( r => r.agent_id.toString()))];

  const [clients, agents] = await Promise.all([
    clientIds.length ? DmsZohoClient.find({ _id: { $in: clientIds } }).select('_id profile_image_url').lean() : [],
    agentIds.length  ? ZohoDmsUser.find(  { _id: { $in: agentIds  } }).select('_id profile_image_url').lean() : [],
  ]);

  const clientImageMap = Object.fromEntries(clients.map(c => [c._id.toString(), c.profile_image_url ?? null]));
  const agentImageMap  = Object.fromEntries(agents.map( a => [a._id.toString(), a.profile_image_url ?? null]));

  // ── Process each record ───────────────────────────────────────────────────

  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const patch = {};

    // ── Client ──────────────────────────────────────────────────────────────
    if (record.client_image_url === null || record.client_image_url === undefined) {
      if (record.client_id) {
        // Fast path — ID already known
        patch.client_image_url = clientImageMap[record.client_id.toString()] ?? null;
      } else if (record.customer_phone) {
        // Slow path — re-resolve by phone
        const client = await resolveClientByPhone(record.customer_phone);
        if (client) {
          patch.client_id        = client._id;
          patch.client_lead_id   = client.lead_id           ?? null;
          patch.client_name      = client.name              ?? null;
          patch.client_image_url = client.profile_image_url ?? null;
        }
      }
    }

    // ── Agent ───────────────────────────────────────────────────────────────
    if (record.agent_image_url === null || record.agent_image_url === undefined) {
      if (record.agent_id) {
        // Fast path — ID already known
        patch.agent_image_url = agentImageMap[record.agent_id.toString()] ?? null;
      } else if (record.agent_phone) {
        // Slow path — re-resolve by phone + name fallback
        const agent = await resolveAgentByPhone(record.agent_phone, record.agent_name);
        if (agent) {
          patch.agent_id        = agent._id;
          patch.agent_image_url = agent.profile_image_url ?? null;
        }
      }
    }

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
