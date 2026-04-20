'use strict';

/**
 * MongoDB → OpenSearch Sync Worker
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles two job types:
 *
 *   full-sync       Paginate every record in DmsZohoClient and bulk-upsert
 *                   into OpenSearch. Safe to run multiple times (idempotent).
 *
 *   upsert-record   Fetch a single record by lead_id from MongoDB and upsert
 *                   it. Used as a fallback when the change stream misses an event.
 *                   Payload: { leadId: string }
 *
 * Real-time sync is handled separately by utils/mongoChangeStream.js
 */

const { Worker } = require('bullmq');
const { connection } = require('../services/redis');
const logger = require('../utils/logger');

const DmsZohoClient = require('../models/dmsZohoClient');
const {
  bulkUpsertApplications,
  upsertApplication,
} = require('../services/opensearchService');

const QUEUE_NAME = 'mongo-opensearch-sync';
const PAGE_SIZE = 200;

let worker = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

const SYNC_FIELDS = 'lead_id name full_name email phone qualified_country application_stage service_type application_state record_type lead_owner dms_application_status checklist_requested quality_check_from package_finalize deadline_for_lodgment created_at zoho_modified_time main_applicant';

// ─── Job Handlers ─────────────────────────────────────────────────────────────

async function handleFullSync(job) {
  logger.info('[MongoSync] Starting full sync');

  const total = await DmsZohoClient.countDocuments({});
  let processed = 0;
  let skip = 0;

  while (skip < total || (skip === 0 && total === 0)) {
    const batch = await DmsZohoClient
      .find({})
      .skip(skip)
      .limit(PAGE_SIZE)
      .select(SYNC_FIELDS)
      .lean();

    if (batch.length === 0) break;

    await bulkUpsertApplications(batch);
    processed += batch.length;
    skip += PAGE_SIZE;

    await job.updateProgress(Math.round((processed / total) * 100));

    if (batch.length < PAGE_SIZE) break;
  }

  logger.info(`[MongoSync] Full sync completed`, { total: processed });
  return { total: processed };
}

async function handleIncrementalSync() {
  const WINDOW_MINS = 20;
  const since = new Date(Date.now() - WINDOW_MINS * 60 * 1000);

  const records = await DmsZohoClient
    .find({ $or: [{ zoho_modified_time: { $gte: since } }, { updated_at: { $gte: since } }] })
    .select(SYNC_FIELDS)
    .lean();

  if (records.length > 0) {
    for (const batch of chunk(records, PAGE_SIZE)) {
      await bulkUpsertApplications(batch);
    }
  }

  logger.info(`[MongoSync] Incremental sync completed`, { total: records.length, windowMins: WINDOW_MINS });
  return { total: records.length };
}

async function handleUpsertRecord(job) {
  const { leadId } = job.data;
  if (!leadId) throw new Error(`[MongoSync] upsert-record job missing leadId`);

  const record = await DmsZohoClient
    .findOne({ lead_id: leadId })
    .select(SYNC_FIELDS)
    .lean();

  if (!record) {
    logger.warn('[MongoSync] upsert-record: record not found in MongoDB', { leadId });
    return { skipped: true };
  }

  await upsertApplication(record);
  logger.info('[MongoSync] upsert-record completed', { leadId });
  return { leadId };
}

// ─── Worker Factory ───────────────────────────────────────────────────────────

function createWorker() {
  if (worker) return worker;

  if (!connection) {
    logger.warn('[MongoSync Worker] Redis connection not available — worker not started');
    return { close: async () => {} };
  }

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      switch (job.name) {
        case 'full-sync':        return handleFullSync(job);
        case 'incremental-sync': return handleIncrementalSync();
        case 'upsert-record':    return handleUpsertRecord(job);
        default:
          logger.warn('[MongoSync Worker] Unknown job name', { jobName: job.name });
      }
    },
    {
      connection,
      concurrency: 1,
      lockDuration: 10 * 60 * 1000, // full-sync can take several minutes
    },
  );

  worker.on('completed', (job, result) => {
    logger.info('[MongoSync Worker] Job completed', { jobId: job.id, jobName: job.name, result });
  });

  worker.on('failed', (job, err) => {
    logger.error('[MongoSync Worker] Job failed', {
      jobId: job?.id,
      jobName: job?.name,
      attempt: job?.attemptsMade,
      error: err.message,
    });
  });

  worker.on('error', (err) => {
    logger.error('[MongoSync Worker] Worker error', { error: err.message });
  });

  logger.info('[MongoSync Worker] Worker started', { concurrency: 1 });
  return worker;
}

module.exports = { createWorker };
