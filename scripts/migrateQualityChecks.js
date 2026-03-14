const mongoose = require('mongoose');
require('dotenv').config();

const QualityCheckRequest = require('../models/qualityCheckRequest');
const { zohoRequest } = require('../controllers/zohoDms/zohoApi');

/**
 * Migration script: seed QualityCheckRequest collection from Zoho CRM
 *
 * Reads all records in Visa_Applications and Spouse_Skill_Assessment
 * where Quality_Check_From is not null, then upserts a QualityCheckRequest
 * document for each one.
 *
 * Safe to re-run — idempotent via upsert on leadId.
 *
 * Usage: node scripts/migrateQualityChecks.js
 */

const PAGE_SIZE = 200; // Zoho COQL max per request

const MODULES = [
  { moduleName: 'Visa_Applications',     recordType: 'Visa_Applications' },
  { moduleName: 'Spouse_Skill_Assessment', recordType: 'Spouse_Skill_Assessment' },
];

async function fetchAllFromZoho(moduleName) {
  const records = [];
  let offset = 0;

  while (true) {
    const query = `select id, Name, Application_Handled_By, Quality_Check_From, Created_Time from ${moduleName} where Quality_Check_From is not null order by Created_Time asc limit ${offset}, ${PAGE_SIZE}`;

    console.log(`  Fetching ${moduleName} offset=${offset}...`);
    const response = await zohoRequest('coql', 'POST', { select_query: query });
    const page = response.data || [];
    records.push(...page);

    if (page.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  return records;
}

async function migrate() {
  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) {
    console.error('ERROR: MONGODB_CONNECTION_STRING environment variable is not set.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });
  console.log('Connected to MongoDB.\n');

  let totalFetched = 0;
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const { moduleName, recordType } of MODULES) {
    console.log(`\n--- Processing module: ${moduleName} ---`);

    let records;
    try {
      records = await fetchAllFromZoho(moduleName);
    } catch (err) {
      console.error(`  Failed to fetch from Zoho (${moduleName}):`, err.message);
      totalErrors++;
      continue;
    }

    console.log(`  Fetched ${records.length} records from Zoho.`);
    totalFetched += records.length;

    for (const record of records) {
      const leadId = record.id;
      const requested_to = record.Quality_Check_From;
      const requested_by = record.Application_Handled_By || 'unknown';
      const requested_at = record.Created_Time ? new Date(record.Created_Time) : new Date();

      if (!leadId || !requested_to) {
        console.warn(`  SKIP: record missing id or Quality_Check_From — id=${leadId}`);
        totalSkipped++;
        continue;
      }

      try {
        const existing = await QualityCheckRequest.findOne({ leadId }).lean();
        if (existing) {
          totalSkipped++;
        } else {
          await QualityCheckRequest.create({
            leadId,
            recordType,
            requested_by,
            requested_to,
            status: 'pending',
            requested_at,
            messages: [],
            migrated: true,
          });
          totalCreated++;
        }
      } catch (err) {
        console.error(`  ERROR upserting leadId=${leadId}:`, err.message);
        totalErrors++;
      }
    }
  }

  console.log('\n========== Migration Summary ==========');
  console.log(`  Total fetched from Zoho : ${totalFetched}`);
  console.log(`  Created (new docs)      : ${totalCreated}`);
  console.log(`  Skipped (already exist) : ${totalSkipped}`);
  console.log(`  Errors                  : ${totalErrors}`);
  console.log('=======================================\n');

  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(totalErrors > 0 ? 1 : 0);
}

migrate().catch(err => {
  console.error('Unhandled error in migration:', err);
  process.exit(1);
});
