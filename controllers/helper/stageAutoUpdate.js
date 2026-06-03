const dmsZohoAusStage2Documents = require('../../models/dmsZohoAusStage2Documents');
const DmsZohoClient = require('../../models/dmsZohoClient');
const { APPLICATION_STAGES, MODULE_VISA_APPLICATION } = require('./constants');
const { addActivityLog } = require('./service/activityLog');
const { updateRecentActivityInMongo } = require('./service/functions');

async function computeStageFromDocuments(recordId) {
  const docs = await dmsZohoAusStage2Documents.find({ record_id: recordId }).lean();

  if (docs.some((d) => d.type === 'eoi')) return 'Lodge Application 1';

  if (docs.some((d) => d.type === 'outcome' && d.outcome === 'English Language Test'))
    return 'Language Test';

  if (docs.some((d) => d.type === 'outcome' && d.outcome === 'Skill Assessment Outcome'))
    return 'Stage 1 Milestone Completed';

  return null;
}

async function applyStageAdvancement(recordId) {
  const computed = await computeStageFromDocuments(recordId);
  if (!computed) return { updated: false };

  const client = await DmsZohoClient.findOne({ lead_id: recordId }).select('application_stage').lean();
  const currentStage = client?.application_stage ?? null;

  const rank = (s) => {
    if (!s) return -1;
    const idx = APPLICATION_STAGES.indexOf(s);
    return idx === -1 ? Infinity : idx;
  };

  if (rank(computed) <= rank(currentStage)) {
    return { updated: false, oldStage: currentStage };
  }

  await DmsZohoClient.findOneAndUpdate(
    { lead_id: recordId },
    { $set: { application_stage: computed } },
  );

  addActivityLog({
    lead_id: recordId,
    activity_type: 'stage_updated',
    summary: `Application stage automatically advanced to "${computed}" based on uploaded documents`,
    actor_type: 'system',
    actor_name: 'System',
    metadata: { oldStage: currentStage, newStage: computed, trigger: 'document_upload' },
  });

  await updateRecentActivityInMongo(MODULE_VISA_APPLICATION, recordId);

  return { updated: true, oldStage: currentStage, newStage: computed };
}

module.exports = { computeStageFromDocuments, applyStageAdvancement };
