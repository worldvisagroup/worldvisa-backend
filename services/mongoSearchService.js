'use strict';

const DmsZohoClient = require('../models/dmsZohoClient');

const LEAD_ID_RE = /^\d{4,}$/;

async function searchApplications(query, options = {}) {
  const { size = 20 } = options;
  const trimmed = query?.trim();
  if (!trimmed) return [];

  let docs;

  if (LEAD_ID_RE.test(trimmed)) {
    docs = await DmsZohoClient.find({ lead_id: trimmed }).limit(size).lean();
  } else {
    const escaped = trimmed.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    docs = await DmsZohoClient.find({
      $or: [
        { name: regex },
        { full_name: regex },
        { email: regex },
        { phone: regex },
      ],
    })
      .sort({ created_at: -1 })
      .limit(size)
      .lean();
  }

  return docs.map(doc => ({
    id: doc.lead_id,
    score: 1,
    source: {
      lead_id: doc.lead_id,
      name: doc.name,
      full_name: doc.full_name,
      email: doc.email,
      phone: doc.phone,
      country: doc.qualified_country,
      stage: doc.application_stage,
      service_type: doc.service_type,
      application_state: doc.application_state,
      record_type: doc.record_type,
      handled_by: doc.lead_owner,
      dms_status: doc.dms_application_status,
      checklist_requested: doc.checklist_requested,
      quality_check_from: doc.quality_check_from,
      package_finalize: doc.package_finalize,
      deadline: doc.deadline_for_lodgment,
      created_time: doc.created_at ? doc.created_at.toISOString() : null,
      modified_time: doc.zoho_modified_time ? doc.zoho_modified_time.toISOString() : null,
      main_applicant: doc.main_applicant,
    },
  }));
}

module.exports = { searchApplications };
