const logger = require("../../utils/logger");

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

/**
 * Research strategy for Australian State Nominations.
 *
 * WHAT IS ACTUALLY PUBLICLY AVAILABLE (confirmed by source analysis):
 *
 * 1. Home Affairs publishes per-state EOI nomination counts monthly at:
 *    https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds
 *    → Columns: ACT | NSW | NT | QLD | SA | TAS | VIC | WA for Subclass 190 and 491
 *    → These are the REAL per-state nomination figures, aggregated monthly by Home Affairs.
 *    → Aggregated and presented clearly at: https://www.australian.com/skillselect
 *
 * 2. WIDEN tracker (https://www.widen.com.au/state-nomination-tracker/) tracks which
 *    state programs are currently OPEN or CLOSED for 190/491, checked monthly.
 *
 * 3. Annual allocation quotas per state are also published by Home Affairs.
 *
 * IMPORTANT TOKEN-AWARENESS:
 * - sonar-pro has a large context window but each search call costs tokens.
 * - The system prompt + query is kept concise and focused.
 * - We ask for JSON output directly, no prose.
 * - Target only the 2–3 best sources, not every state portal.
 */

const STATE_NOMINATION_RESEARCH_SYSTEM_PROMPT = `You are an Australian immigration data researcher. Extract state nomination figures from official Australian government sources and return only JSON.

KEY INSIGHT: The Department of Home Affairs publishes actual per-state nomination counts at:
https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds

This page contains a table titled "State and territory nominations" showing EOIs nominated per state for the program year across ALL applicants (onshore + offshore). It has columns for ACT, NSW, NT, QLD, SA, TAS, VIC, WA for Subclass 190 and Subclass 491.
The aggregated tracker at https://www.australian.com/skillselect reads this table monthly and presents it clearly.
Also check https://www.widen.com.au/state-nomination-tracker/ for program open/closed status.

YOUR OUTPUT RULES:
1. "applicant_type": Always "ALL_APPLICANTS" (Home Affairs aggregates onshore + offshore).
2. "metric": Always "nominations_issued".
3. Suppressed values: If Home Affairs reports "<5", set "value": null, "reported_value": "<5", "exact_count_available": false. NEVER convert "<5" to 2 or any invented number.
4. Zero values: If a state shows 0 nominations, set "value": 0, "reported_value": "0", "exact_count_available": true.
5. Reporting period: Specify "reporting_period" (e.g. "Jul–Aug 2026") and "period_end" (e.g. "2026-08-31"). Set "invitation_round_date": null unless an individual round date is independently confirmed.
6. Program status: Extract "OPEN", "CLOSED", "NOT_YET_OPEN", or "UNKNOWN" per state.
7. Return ONLY raw JSON — no markdown fences, no explanation.

JSON FORMAT:
{
  "research_date": "YYYY-MM-DD",
  "program_year": "2026-27",
  "reporting_period": "Jul–Aug 2026",
  "period_end": "2026-08-31",
  "applicant_type": "ALL_APPLICANTS",
  "metric": "nominations_issued",
  "states": [
    {
      "state": "New South Wales",
      "program_status": "NOT_YET_OPEN",
      "invitation_round_date": null,
      "subclass_190": {
        "value": 11,
        "reported_value": "11",
        "exact_count_available": true,
        "source_url": "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds",
        "notes": "EOIs nominated Jul–Aug 2026 per Home Affairs SkillSelect table"
      },
      "subclass_491": {
        "value": 0,
        "reported_value": "0",
        "exact_count_available": true,
        "source_url": "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds",
        "notes": "Zero nominations reported for Jul–Aug 2026"
      }
    }
  ]
}`;

const { getCurrentProgramYear } = require("../../models/StateNomination");

/**
 * Concise, token-efficient research query.
 * Directs Perplexity to the best sources for the active program year.
 */
const STATE_NOMINATION_RESEARCH_QUERY = (today) => {
  const currentProgramYear = getCurrentProgramYear();
  return `Go to https://www.australian.com/skillselect and find the "State and territory nominations" table for the current ${currentProgramYear} program year. It shows EOIs nominated per state (ACT, NSW, NT, QLD, SA, TAS, VIC, WA) for Subclass 190 and Subclass 491, sourced from Home Affairs. Extract every figure in that table for all 8 states/territories. Also check https://www.widen.com.au/state-nomination-tracker/ to note which state programs are currently open or closed and their annual allocation figures for ${currentProgramYear}. Today: ${today}. Return results as JSON only, no prose.`;
};

class PerplexityService {
  constructor(apiKey = process.env.PERPLEXITY_API_KEY) {
    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      logger.warn(
        "PERPLEXITY_API_KEY is not configured. Live research capability will be disabled."
      );
      this.apiKey = "";
    }
    this.apiUrl = PERPLEXITY_API_URL;
  }

  /**
   * General-purpose research execution with retry and exponential backoff.
   */
  async performResearch(query, options = {}, maxRetries = 3) {
    if (!this.apiKey) {
      throw new Error("Perplexity API key is missing. Set PERPLEXITY_API_KEY in environment variables.");
    }

    const model = options.model || "sonar-pro";
    const systemPrompt = options.systemPrompt || "You are an expert researcher. Return factual and concise data with official citations.";
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const querySnippet = query.length > 80 ? `${query.substring(0, 80)}...` : query;
        logger.info(
          `[Perplexity] Research attempt ${attempt}/${maxRetries} for: "${querySnippet}" using model ${model}`
        );
        const startTime = Date.now();

        const controller = new AbortController();
        const timeoutMs = options.timeoutMs || 90000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query },
            ],
            temperature: options.temperature !== undefined ? options.temperature : 0.1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            `Perplexity API error ${response.status}: ${JSON.stringify(errorData)}`
          );

          const isRetryable = response.status === 429 || response.status >= 500;
          if (isRetryable && attempt < maxRetries) {
            const retryAfterHeader = response.headers.get("retry-after");
            const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : undefined;
            const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 8000);
            const jitterMs = Math.floor(Math.random() * 500);
            const delayMs = (retryAfterMs && !Number.isNaN(retryAfterMs) ? retryAfterMs : backoffMs) + jitterMs;

            logger.warn(`[Perplexity] Attempt ${attempt} failed with HTTP ${response.status}. Retrying in ${delayMs}ms...`);
            lastError = error;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          throw error;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const duration = Date.now() - startTime;

        logger.info(`[Perplexity] Research completed in ${duration}ms. Response length: ${content.length} chars`);
        return content;
      } catch (error) {
        if (error.name === "AbortError") {
          lastError = new Error(`Perplexity research timed out after ${options.timeoutMs || 90000}ms`);
        } else {
          lastError = error;
        }

        logger.error(`[Perplexity] Error on attempt ${attempt}/${maxRetries}`, { error: lastError.message });

        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * 2 ** (attempt - 1), 6000);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error("Perplexity research failed after retries");
  }

  /**
   * Researches the latest Australian state nomination data.
   *
   * PRIMARY SOURCE: Home Affairs SkillSelect per-state nomination table
   * (aggregated clearly at https://www.australian.com/skillselect)
   * This is the ONLY place that publishes real per-state nomination counts.
   *
   * SECONDARY SOURCE: WIDEN tracker for program status and allocation figures.
   */
  async researchStateNominations(customQuery = null) {
    const today = new Date().toISOString().split("T")[0];
    const query = customQuery || STATE_NOMINATION_RESEARCH_QUERY(today);

    return await this.performResearch(query, {
      model: "sonar-pro",
      systemPrompt: STATE_NOMINATION_RESEARCH_SYSTEM_PROMPT,
      temperature: 0.1,
      timeoutMs: 120000,
    });
  }
}

module.exports = PerplexityService;
