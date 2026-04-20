/**
 * One-time backfill: update DmsZohoClient fields for approved AdminApprovalRequests
 * that were approved before the live-field-sync was added to approveRequest().
 *
 * Safe to re-run — each update is idempotent.
 *
 * Usage: node scripts/backfillApprovedFieldUpdates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const DmsZohoClient = require('../models/dmsZohoClient');

const adminApprovalRequestSchema = new mongoose.Schema(
  {
    requestType:     String,
    leadId:          String,
    recordType:      String,
    fieldName:       String,
    currentValue:    String,
    requestedValue:  String,
    reason:          String,
    requestedBy:     String,
    requestedTo:     String,
    status:          String,
    reviewedBy:      String,
    reviewedAt:      Date,
    rejectionReason: String,
  },
  { timestamps: true }
);
const AdminApprovalRequest =
  mongoose.models.AdminApprovalRequest ||
  mongoose.model('AdminApprovalRequest', adminApprovalRequestSchema);

const ZOHO_TO_MONGO_FIELD = {
  Deadline_For_Lodgment:   'deadline_for_lodgment',
  Application_Stage:       'application_stage',
  Application_State:       'application_state',
  DMS_Application_Status:  'dms_application_status',
  Quality_Check_From:      'quality_check_from',
  Package_Finalize:        'package_finalize',
  Checklist_Requested:     'checklist_requested',
  Send_Check_List:         'send_check_list',
  Qualified_Country:       'qualified_country',
  Service_Finalized:       'service_type',
  Suggested_Anzsco:        'suggested_anzsco',
  Assessing_Authority:     'assessing_authority',
  Spouse_Skill_Assessment: 'spouse_skill_assessment',
  Spouse_Name:             'spouse_name',
  Main_Applicant:          'main_applicant',
};

async function run() {
  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) throw new Error('MONGODB_CONNECTION_STRING env var is not set');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Group by leadId+fieldName, keep only the latest approved (by reviewedAt)
  const allApproved = await AdminApprovalRequest.find({ status: 'approved' }).sort({ reviewedAt: 1 }).lean();
  const latestMap = new Map();
  for (const req of allApproved) {
    const key = `${req.leadId}::${req.fieldName}`;
    latestMap.set(key, req); // later entries overwrite earlier ones → latest wins
  }
  const approved = [...latestMap.values()];

  console.log(`Found ${allApproved.length} approved request(s), ${approved.length} unique leadId+fieldName combinations`);

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (const req of approved) {
    const mongoField = ZOHO_TO_MONGO_FIELD[req.fieldName];
    if (!mongoField) {
      console.log(`  SKIP  [${req._id}] fieldName "${req.fieldName}" has no mongo mapping`);
      skipped++;
      continue;
    }

    try {
      const result = await DmsZohoClient.findOneAndUpdate(
        { lead_id: req.leadId, [mongoField]: { $ne: req.requestedValue } },
        { $set: { [mongoField]: req.requestedValue } },
        { new: false }
      );

      if (result) {
        console.log(`  UPDATE [${req._id}] lead=${req.leadId} ${mongoField}: "${result[mongoField]}" → "${req.requestedValue}"`);
        updated++;
      } else {
        console.log(`  NOOP   [${req._id}] lead=${req.leadId} ${mongoField} already "${req.requestedValue}"`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ERROR  [${req._id}] lead=${req.leadId}:`, err.message);
      errors++;
    }
  }

  console.log(`\nDone. updated=${updated}  skipped=${skipped}  errors=${errors}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
