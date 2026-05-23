/**
 * One-off test script: send a checklist reminder email for a specific lead.
 * Bypasses the 10-day window check — for testing only.
 *
 * Usage: node scripts/sendChecklistReminder.js <lead_id>
 * Example: node scripts/sendChecklistReminder.js 164193000099278716
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DmsZohoClient = require('../models/dmsZohoClient');
const DmsZohoDocument = require('../models/dmsZohoDocument');
const { createEmailNotification } = require('../services/notifications/notificationService');

const LEAD_ID = process.argv[2];

if (!LEAD_ID) {
  console.error('Usage: node scripts/sendChecklistReminder.js <lead_id>');
  process.exit(1);
}

const SUBMITTED_STATUSES = ['pending', 'reviewed', 'request_review', 'approved'];

async function main() {
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
  console.log('MongoDB connected');

  const client = await DmsZohoClient.findOne({ lead_id: LEAD_ID })
    .select('name email lead_id checklist')
    .lean();

  if (!client) {
    console.error(`No client found with lead_id: ${LEAD_ID}`);
    process.exit(1);
  }

  console.log(`Client: ${client.name} (${client.email})`);
  console.log(`Checklist items: ${client.checklist.length}`);

  const requiredItems = (client.checklist || []).filter((item) => item.required);
  console.log(`Required items: ${requiredItems.length}`);

  if (!requiredItems.length) {
    console.log('No required checklist items — nothing to remind.');
    process.exit(0);
  }

  const uploadedDocs = await DmsZohoDocument.find({
    record_id: LEAD_ID,
    status: { $in: SUBMITTED_STATUSES },
  })
    .select('document_type document_category')
    .lean();

  const submittedSet = new Set(
    uploadedDocs.map((d) => `${d.document_category}:${d.document_type}`)
  );

  const missingDocs = requiredItems.filter(
    (item) => !submittedSet.has(`${item.document_category}:${item.document_type}`)
  );

  console.log(`Submitted docs: ${uploadedDocs.length}`);
  console.log(`Missing required docs: ${missingDocs.length}`);

  if (!missingDocs.length) {
    console.log('All required documents are submitted — no reminder needed.');
    process.exit(0);
  }

  console.log('Missing documents:');
  missingDocs.forEach((d) => console.log(`  - ${d.document_type} (${d.document_category})`));

  const result = await createEmailNotification({
    recipientRole: 'client',
    recipientEmail: client.email,
    recipientName: client.name,
    notificationType: 'checklist_reminder',
    entityParentId: client.lead_id,
    subject: 'Reminder: Outstanding Documents Required for Your Visa Application',
    templateData: {
      missingDocuments: missingDocs.map((d) => ({
        document_type: d.document_type,
        document_category: d.document_category,
      })),
    },
  });

  if (result) {
    console.log(`\nReminder email queued successfully (notificationId: ${result._id})`);
  } else {
    console.log('\nEmail was deduplicated — a recent reminder already exists for this client.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
