const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CANONICAL_STATES = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "South Australia",
  "Western Australia",
  "Tasmania",
  "Australian Capital Territory",
  "Northern Territory",
];

const BASELINE_ALLOCATIONS_2025_26 = {
  "New South Wales":              { subclass_190: 2100, subclass_491: 1500, program_year: "2025-26" },
  "Victoria":                     { subclass_190: 2700, subclass_491: 700,  program_year: "2025-26" },
  "Queensland":                   { subclass_190: 1850, subclass_491: 750,  program_year: "2025-26" },
  "South Australia":              { subclass_190: 1350, subclass_491: 900,  program_year: "2025-26" },
  "Western Australia":            { subclass_190: 2000, subclass_491: 1400, program_year: "2025-26" },
  "Tasmania":                     { subclass_190: 1200, subclass_491: 650,  program_year: "2025-26" },
  "Australian Capital Territory": { subclass_190: 800,  subclass_491: 800,  program_year: "2025-26" },
  "Northern Territory":           { subclass_190: 850,  subclass_491: 800,  program_year: "2025-26" },
};

const SubclassDetailSchema = new Schema(
  {
    value: { type: Number, default: null },
    reported_value: { type: String, default: null },
    exact_count_available: { type: Boolean, default: true },
    formatted_label: { type: String, default: "Pending update" },
    source_url: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { _id: false }
);

const StateNominationItemSchema = new Schema(
  {
    state: { type: String, required: true, enum: CANONICAL_STATES },
    subclass_190: { type: SubclassDetailSchema, required: true },
    subclass_491: { type: SubclassDetailSchema, required: true },
    program_status: { type: String, default: "UNKNOWN" },
    invitation_round_date: { type: String, default: null },
    invitation_round_date_formatted: { type: String, default: null },
    last_updated_text: { type: String, default: "Pending update" },
  },
  { _id: false }
);

const StateNominationSchema = new Schema(
  {
    country: { type: String, default: "AUSTRALIA", uppercase: true },
    applicant_type: { type: String, default: "ALL_APPLICANTS", uppercase: true },
    metric: { type: String, default: "nominations_issued" },
    program_year: { type: String, required: true }, // e.g. "2026-27" or "2025-26"
    reporting_period: { type: String, default: null },
    period_end: { type: String, default: null },
    research_date: { type: String, required: true },
    states: {
      type: [StateNominationItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 8,
        message: "StateNomination must contain exactly 8 Australian states/territories",
      },
    },
    is_latest: { type: Boolean, default: false },
    raw_research: { type: String, default: null },
    sync_metadata: {
      source_hash: String,
      source_checked_at: String,
      perplexity_model: String,
      openai_model: String,
      research_duration_ms: Number,
      normalization_duration_ms: Number,
      total_duration_ms: Number,
      status: {
        type: String,
        enum: ["success", "partial", "fallback"],
        default: "success",
      },
    },
  },
  { timestamps: true }
);

// One definitive record per country + program_year (upsert in place instead of duplicate spamming)
StateNominationSchema.index({ country: 1, program_year: 1 }, { unique: true });
StateNominationSchema.index({ is_latest: 1, country: 1 });
StateNominationSchema.index({ createdAt: -1 });

/**
 * 2025-26 Completed Historical Seed Data.
 * Static verified allocation & full program year records.
 */
StateNominationSchema.statics.getBaseline2025_26SeedData = function () {
  const programYear = "2025-26";
  const source = "https://www.homeaffairs.gov.au/research-and-statistics/statistics/visa-statistics/live/skilled-migration";

  return {
    country: "AUSTRALIA",
    applicant_type: "ALL_APPLICANTS",
    metric: "nominations_issued",
    program_year: programYear,
    reporting_period: "2025-26 Full Program Year",
    period_end: "2026-06-30",
    research_date: "2026-06-30",
    is_latest: false,
    states: CANONICAL_STATES.map((state) => {
      const a = BASELINE_ALLOCATIONS_2025_26[state];
      return {
        state,
        subclass_190: {
          value: a.subclass_190,
          reported_value: String(a.subclass_190),
          exact_count_available: true,
          formatted_label: `${a.subclass_190.toLocaleString("en-AU")} places allocated`,
          source_url: source,
          notes: `${programYear} annual planned nomination allocation per Home Affairs`,
        },
        subclass_491: {
          value: a.subclass_491,
          reported_value: String(a.subclass_491),
          exact_count_available: true,
          formatted_label: `${a.subclass_491.toLocaleString("en-AU")} places allocated`,
          source_url: source,
          notes: `${programYear} annual planned nomination allocation per Home Affairs`,
        },
        program_status: "CLOSED",
        invitation_round_date: null,
        invitation_round_date_formatted: null,
        last_updated_text: `${programYear} program year completed`,
      };
    }),
    sync_metadata: { status: "fallback" },
  };
};

/**
 * 2026-27 Active Program Year Baseline Seed Data.
 * Sourced from initial Home Affairs SkillSelect table (Jul–Aug 2026).
 */
StateNominationSchema.statics.getBaseline2026_27SeedData = function () {
  const programYear = "2026-27";
  const source = "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds";

  const snapshot2026_27 = {
    "New South Wales":              { s190: { val: 11, rep: "11", exact: true }, s491: { val: 0, rep: "0", exact: true }, status: "NOT_YET_OPEN" },
    "Victoria":                     { s190: { val: 0, rep: "0", exact: true }, s491: { val: 0, rep: "0", exact: true }, status: "CLOSED" },
    "Queensland":                   { s190: { val: 6, rep: "6", exact: true }, s491: { val: null, rep: "<5", exact: false }, status: "NOT_YET_OPEN" },
    "South Australia":              { s190: { val: 0, rep: "0", exact: true }, s491: { val: 0, rep: "0", exact: true }, status: "OPEN" },
    "Western Australia":            { s190: { val: 17, rep: "17", exact: true }, s491: { val: 120, rep: "120", exact: true }, status: "OPEN" },
    "Tasmania":                     { s190: { val: 206, rep: "206", exact: true }, s491: { val: 55, rep: "55", exact: true }, status: "OPEN" },
    "Australian Capital Territory": { s190: { val: null, rep: "<5", exact: false }, s491: { val: null, rep: "<5", exact: false }, status: "OPEN" },
    "Northern Territory":           { s190: { val: 91, rep: "91", exact: true }, s491: { val: 25, rep: "25", exact: true }, status: "OPEN" },
  };

  return {
    country: "AUSTRALIA",
    applicant_type: "ALL_APPLICANTS",
    metric: "nominations_issued",
    program_year: programYear,
    reporting_period: "Jul–Aug 2026",
    period_end: "2026-08-31",
    research_date: new Date().toISOString().split("T")[0],
    is_latest: true,
    states: CANONICAL_STATES.map((state) => {
      const snap = snapshot2026_27[state];
      const s190Label = snap.s190.exact
        ? `${snap.s190.val.toLocaleString("en-AU")} nominations`
        : "<5 nominations";
      const s491Label = snap.s491.exact
        ? `${snap.s491.val.toLocaleString("en-AU")} nominations`
        : "<5 nominations";

      return {
        state,
        subclass_190: {
          value: snap.s190.val,
          reported_value: snap.s190.rep,
          exact_count_available: snap.s190.exact,
          formatted_label: s190Label,
          source_url: source,
          notes: `Home Affairs SkillSelect YTD nominations (${snap.s190.exact ? snap.s190.val : "<5"})`,
        },
        subclass_491: {
          value: snap.s491.val,
          reported_value: snap.s491.rep,
          exact_count_available: snap.s491.exact,
          formatted_label: s491Label,
          source_url: source,
          notes: `Home Affairs SkillSelect YTD nominations (${snap.s491.exact ? snap.s491.val : "<5"})`,
        },
        program_status: snap.status,
        invitation_round_date: null,
        invitation_round_date_formatted: null,
        last_updated_text: "Reporting period: Jul–Aug 2026",
      };
    }),
    sync_metadata: { status: "fallback" },
  };
};

/**
 * Standard baseline fallback (defaults to active current year).
 */
StateNominationSchema.statics.getBaselineSeedData = function () {
  return this.getBaseline2026_27SeedData();
};

/**
 * Get nomination record for a specific program year, or latest active if omitted.
 */
StateNominationSchema.statics.getLatest = async function (year = null) {
  if (mongoose.connection.readyState !== 1) {
    return year === "2025-26"
      ? this.getBaseline2025_26SeedData()
      : this.getBaseline2026_27SeedData();
  }

  const query = { country: "AUSTRALIA" };
  if (year) {
    query.program_year = year;
  } else {
    query.is_latest = true;
  }

  const record = await this.findOne(query).sort({ createdAt: -1 }).lean();
  if (record) return record;

  if (year === "2025-26") {
    return this.getBaseline2025_26SeedData();
  }
  return this.getBaseline2026_27SeedData();
};

function getCurrentProgramYear(date = new Date()) {
  const month = date.getMonth(); // 0-indexed, July = 6
  const year = date.getFullYear();
  const fyStartYear = month >= 6 ? year : year - 1;
  return `${fyStartYear}-${String(fyStartYear + 1).slice(2)}`;
}

function getPreviousProgramYear(date = new Date()) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const fyStartYear = (month >= 6 ? year : year - 1) - 1;
  return `${fyStartYear}-${String(fyStartYear + 1).slice(2)}`;
}

/**
 * Returns list of distinct program years available in the system.
 */
StateNominationSchema.statics.getAvailableYears = async function () {
  const currentYear = getCurrentProgramYear();
  const prevYear = getPreviousProgramYear();

  if (mongoose.connection.readyState !== 1) {
    return [currentYear, prevYear];
  }

  try {
    const years = await this.distinct("program_year", { country: "AUSTRALIA" });
    const defaults = [currentYear, prevYear];
    const set = new Set([...(years.filter(Boolean)), ...defaults]);
    return Array.from(set).sort().reverse();
  } catch {
    return [currentYear, prevYear];
  }
};

/**
 * Save new research data by upserting the current program year record in place.
 * Demotes other years from is_latest: true.
 */
StateNominationSchema.statics.saveLatest = async function (normalizedData, rawResearch = null, metadata = {}) {
  const targetYear = normalizedData.program_year || getCurrentProgramYear();
  const hasAnyData = normalizedData?.states?.some(
    (s) => s?.subclass_190?.reported_value || s?.subclass_491?.reported_value
  );

  if (!hasAnyData) {
    const existing = await this.findOne({ country: "AUSTRALIA", program_year: targetYear }).lean();
    if (existing) {
      const logger = require("../utils/logger");
      logger.warn("[StateNomination.saveLatest] Sync returned empty data. Preserving existing record.", {
        year: targetYear,
        existingId: existing._id,
      });
      return existing;
    }
  }

  // Demote other years so only current is marked latest
  await this.updateMany(
    { country: "AUSTRALIA", program_year: { $ne: targetYear }, is_latest: true },
    { $set: { is_latest: false } }
  );

  const updateFields = {
    country: "AUSTRALIA",
    applicant_type: normalizedData.applicant_type || "ALL_APPLICANTS",
    metric: normalizedData.metric || "nominations_issued",
    program_year: targetYear,
    reporting_period: normalizedData.reporting_period || null,
    period_end: normalizedData.period_end || null,
    research_date: normalizedData.updated_at || new Date().toISOString().split("T")[0],
    states: normalizedData.states,
    is_latest: true,
    raw_research: typeof rawResearch === "string" ? rawResearch : JSON.stringify(rawResearch),
    sync_metadata: metadata,
  };

  // Upsert in place: updates existing record for targetYear without spamming duplicates
  const savedDoc = await this.findOneAndUpdate(
    { country: "AUSTRALIA", program_year: targetYear },
    { $set: updateFields },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return savedDoc;
};

const StateNomination = mongoose.model("StateNomination", StateNominationSchema);

module.exports = StateNomination;
module.exports.CANONICAL_STATES = CANONICAL_STATES;
module.exports.BASELINE_ALLOCATIONS = BASELINE_ALLOCATIONS_2025_26;
module.exports.getCurrentProgramYear = getCurrentProgramYear;
module.exports.getPreviousProgramYear = getPreviousProgramYear;
