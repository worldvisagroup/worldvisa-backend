const { isVisaApplicationCountry } = require('../constants/visaApplication');

function parseZohoDate(value) {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function strOrNull(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function mapZohoRecordToClientSnapshot(zohoRow, recordType) {
  /** @type {Record<string, unknown>} */
  const out = {};

  const handled = strOrNull(zohoRow.Application_Handled_By);
  if (handled) out.lead_owner = handled;

  out.service_type = strOrNull(zohoRow.Service_Finalized);
  out.assessing_authority = strOrNull(zohoRow.Assessing_Authority);
  out.suggested_anzsco = strOrNull(zohoRow.Suggested_Anzsco);
  out.application_stage = strOrNull(zohoRow.Application_Stage);
  out.dms_application_status = strOrNull(zohoRow.DMS_Application_Status);
  out.deadline_for_lodgment = strOrNull(zohoRow.Deadline_For_Lodgment);
  out.recent_activity = parseZohoDate(zohoRow.Recent_Activity);
  out.zoho_created_time = parseZohoDate(zohoRow.Created_Time);
  out.checklist_requested = Boolean(zohoRow.Checklist_Requested);
  out.send_check_list = strOrNull(zohoRow.Send_Check_List);
  out.quality_check_from = strOrNull(zohoRow.Quality_Check_From);
  out.application_state = strOrNull(zohoRow.Application_State);
  const country = strOrNull(zohoRow.Qualified_Country);
  out.qualified_country =
    country && isVisaApplicationCountry(country) ? country : null;

  if (recordType === 'visa_application') {
    out.spouse_skill_assessment = strOrNull(zohoRow.Spouse_Skill_Assessment);
    out.spouse_name = strOrNull(zohoRow.Spouse_Name);
  } else {
    out.main_applicant = strOrNull(zohoRow.Main_Applicant);
  }

  return out;
}

module.exports = { mapZohoRecordToClientSnapshot };
