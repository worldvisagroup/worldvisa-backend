const OpenAI = require("openai");
const { z } = require("zod");
const logger = require("../../utils/logger");
const { CANONICAL_STATES, BASELINE_ALLOCATIONS, getCurrentProgramYear } = require("../../models/StateNomination");

const SubclassSchema = z.object({
  value: z.number().int().nonnegative().nullable(),
  reported_value: z.string().nullable().optional(),
  exact_count_available: z.boolean().default(true),
  formatted_label: z.string().optional(),
  source_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const StateItemSchema = z.object({
  state: z.string(),
  subclass_190: SubclassSchema,
  subclass_491: SubclassSchema,
  program_status: z.string().optional(),
  invitation_round_date: z.string().nullable().optional(),
  invitation_round_date_formatted: z.string().nullable().optional(),
  last_updated_text: z.string().optional(),
});

const StateNominationsSchema = z.object({
  updated_at: z.string(),
  country: z.string().default("Australia"),
  applicant_type: z.string().default("ALL_APPLICANTS"),
  metric: z.string().default("nominations_issued"),
  program_year: z.string().optional(),
  reporting_period: z.string().optional(),
  period_end: z.string().optional(),
  states: z.array(StateItemSchema),
});

const NORMALIZATION_SYSTEM_PROMPT = `You are a strict data validation engine for Australian state nomination statistics.

INPUT: Raw research data about Australian Subclass 190 (Skilled Nominated) and Subclass 491 (Skilled Work Regional) state nominations.
Source: Department of Home Affairs SkillSelect "State and territory nominations" table and official state migration updates.

CRITICAL RULES:
1. APPLICANT TYPE: Always use "ALL_APPLICANTS" (Home Affairs reports total onshore + offshore nominations).
2. METRIC: Always use "nominations_issued".
3. SUPPRESSED VALUES ("<5"):
   - NEVER convert "<5" into 2 or an estimated number!
   - Set "value": null, "reported_value": "<5", "exact_count_available": false, "formatted_label": "<5 nominations"
   - Set "notes": "Home Affairs reported <5 (exact count suppressed for privacy)"
4. ZERO VALUES (0):
   - Set "value": 0, "reported_value": "0", "exact_count_available": true, "formatted_label": "0 nominations"
5. REPORTING PERIOD & DATES:
   - Identify "reporting_period" (e.g. "Jul–Aug 2026") and "period_end" (e.g. "2026-08-31").
   - Do NOT treat period_end as an invitation_round_date. Set "invitation_round_date": null unless an individual round date is established.
   - Set "last_updated_text": "Reporting period: [reporting_period]"
6. PROGRAM STATUS: Extract "OPEN", "CLOSED", "NOT_YET_OPEN", or "UNKNOWN" per state.

OUTPUT FORMAT: Return ONLY valid JSON adhering to the specified 8 canonical states in order:
1. New South Wales, 2. Victoria, 3. Queensland, 4. South Australia,
5. Western Australia, 6. Tasmania, 7. Australian Capital Territory, 8. Northern Territory`;

/**
 * Reusable helper: normalizes an individual subclass field (190 or 491)
 * eliminating code duplication between subclasses.
 */
function normalizeSubclassField(data, baselineQuota, baselineProgramYear, hasLiveData) {
  const notes = data?.notes || null;
  const sourceUrl = data?.source_url || null;

  // Handle "<5" (suppressed count)
  if (
    data?.reported_value === "<5" ||
    data?.value === "<5" ||
    (data?.value === 2 && String(notes || "").includes("<5"))
  ) {
    return {
      value: null,
      reported_value: "<5",
      exact_count_available: false,
      formatted_label: "<5 nominations",
      source_url: sourceUrl,
      notes: notes || "Home Affairs reported <5 (exact count suppressed for privacy)",
    };
  }

  // Handle exact numeric count (including 0)
  if (typeof data?.value === "number") {
    return {
      value: data.value,
      reported_value: String(data.value),
      exact_count_available: true,
      formatted_label: `${data.value.toLocaleString("en-AU")} nominations`,
      source_url: sourceUrl,
      notes,
    };
  }

  // Handle fallback to baseline allocation when no live data is found
  if (!hasLiveData && baselineQuota) {
    return {
      value: baselineQuota,
      reported_value: String(baselineQuota),
      exact_count_available: true,
      formatted_label: `${baselineQuota.toLocaleString("en-AU")} places allocated`,
      source_url: "https://www.homeaffairs.gov.au/research-and-statistics/statistics/visa-statistics/live/skilled-migration",
      notes: `Annual nomination quota for ${baselineProgramYear} per Home Affairs planning levels`,
    };
  }

  return {
    value: null,
    reported_value: null,
    exact_count_available: false,
    formatted_label: "Pending update",
    source_url: sourceUrl,
    notes,
  };
}

class OpenAIStateNominationService {
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      logger.warn(
        "OPENAI_API_KEY is not configured. AI normalization will fall back to rule-based parser."
      );
    }
    this.client = apiKey
      ? new OpenAI({ apiKey, timeout: 60000, maxRetries: 2 })
      : null;
    this.model = "gpt-4o";
  }

  static getProgramYear() {
    return getCurrentProgramYear();
  }

  async normalizeAndValidate(rawResearchData) {
    if (!this.client) {
      logger.warn("[OpenAI] Client not initialized. Using rule-based fallback.");
      return this.ruleBasedNormalize(rawResearchData);
    }

    try {
      logger.info(`[OpenAI] Starting state nomination normalization with ${this.model}`);
      const startTime = Date.now();

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: NORMALIZATION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extract and normalize Australian state nomination data from this research:\n\n${rawResearchData}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("OpenAI returned an empty response");

      const parsed = JSON.parse(content);
      logger.info(`[OpenAI] Normalization completed in ${Date.now() - startTime}ms`);

      return this.postProcessAndValidate(parsed);
    } catch (error) {
      logger.error("[OpenAI] Normalization failed. Falling back to rule-based parser", {
        error: error.message,
      });
      return this.ruleBasedNormalize(rawResearchData);
    }
  }

  postProcessAndValidate(parsedData) {
    const today = new Date().toISOString().split("T")[0];
    const programYear = parsedData?.program_year || OpenAIStateNominationService.getProgramYear();
    const reportingPeriod = parsedData?.reporting_period || "Jul–Aug 2026";
    const periodEnd = parsedData?.period_end || "2026-08-31";
    const incomingStates = Array.isArray(parsedData?.states) ? parsedData.states : [];

    const stateMap = new Map();
    for (const item of incomingStates) {
      if (item?.state) {
        stateMap.set(item.state.toLowerCase().trim(), item);
      }
    }

    const hasLiveData = incomingStates.some((s) => {
      const s190 = s?.subclass_190;
      const s491 = s?.subclass_491;
      return (
        typeof s190?.value === "number" ||
        s190?.reported_value === "<5" ||
        typeof s491?.value === "number" ||
        s491?.reported_value === "<5"
      );
    });

    const normalizedStates = CANONICAL_STATES.map((stateName) => {
      const found = stateMap.get(stateName.toLowerCase());
      const baseline = BASELINE_ALLOCATIONS[stateName];

      const subclass190 = normalizeSubclassField(
        found?.subclass_190,
        baseline?.subclass_190,
        baseline?.program_year || programYear,
        hasLiveData
      );

      const subclass491 = normalizeSubclassField(
        found?.subclass_491,
        baseline?.subclass_491,
        baseline?.program_year || programYear,
        hasLiveData
      );

      return {
        state: stateName,
        program_status: found?.program_status || "UNKNOWN",
        invitation_round_date: found?.invitation_round_date || null,
        invitation_round_date_formatted: found?.invitation_round_date_formatted || null,
        last_updated_text: found?.last_updated_text || `Reporting period: ${reportingPeriod}`,
        subclass_190: subclass190,
        subclass_491: subclass491,
      };
    });

    const finalResult = {
      updated_at: parsedData?.updated_at || today,
      country: "Australia",
      applicant_type: "ALL_APPLICANTS",
      metric: "nominations_issued",
      program_year: programYear,
      reporting_period: reportingPeriod,
      period_end: periodEnd,
      states: normalizedStates,
    };

    const validated = StateNominationsSchema.safeParse(finalResult);
    if (!validated.success) {
      logger.warn("[OpenAI] Zod validation issues in state nominations", {
        errors: validated.error.issues,
      });
    }

    return finalResult;
  }

  ruleBasedNormalize(rawResearch) {
    let parsed = null;
    try {
      if (typeof rawResearch === "string") {
        const cleaned = rawResearch.replace(/```(?:json)?\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } else if (typeof rawResearch === "object") {
        parsed = rawResearch;
      }
    } catch {
      logger.warn("[OpenAI] Raw research could not be parsed as direct JSON. Using baseline allocations.");
    }

    return this.postProcessAndValidate(parsed || {});
  }
}

module.exports = OpenAIStateNominationService;
module.exports.CANONICAL_STATES = CANONICAL_STATES;
module.exports.BASELINE_ALLOCATIONS = BASELINE_ALLOCATIONS;
module.exports.StateNominationsSchema = StateNominationsSchema;
