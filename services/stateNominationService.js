const crypto = require("crypto");
const StateNomination = require("../models/StateNomination");
const PerplexityService = require("./ai/perplexityService");
const OpenAIStateNominationService = require("./ai/openaiStateNominationService");
const logger = require("../utils/logger");

const SOURCE_CHECK_URL = "https://www.australian.com/skillselect";

class StateNominationService {
  constructor() {
    this.perplexity = new PerplexityService();
    this.openAI = new OpenAIStateNominationService();
    this.isSyncing = false;
  }

  /**
   * Retrieves state nominations data for a specific program year,
   * or the latest active program year if year is omitted.
   * Also returns available_years for UI tabs/dropdowns.
   */
  async getLatestNominations(year = null) {
    try {
      const [record, availableYears] = await Promise.all([
        StateNomination.getLatest(year),
        StateNomination.getAvailableYears(),
      ]);

      return {
        success: true,
        program_year: record.program_year,
        available_years: availableYears,
        updated_at: record.research_date || new Date().toISOString().split("T")[0],
        country: record.country || "Australia",
        applicant_type: record.applicant_type || "ALL_APPLICANTS",
        metric: record.metric || "nominations_issued",
        reporting_period: record.reporting_period,
        period_end: record.period_end,
        states: record.states,
        is_fallback: record.sync_metadata?.status === "fallback",
        synced_at: record.updatedAt || record.createdAt,
      };
    } catch (error) {
      logger.error("[StateNominationService] Failed to retrieve nominations", {
        year,
        error: error.message,
      });

      const fallback =
        year === "2025-26"
          ? StateNomination.getBaseline2025_26SeedData()
          : StateNomination.getBaseline2026_27SeedData();

      return {
        success: true,
        program_year: fallback.program_year,
        available_years: ["2026-27", "2025-26"],
        updated_at: fallback.research_date,
        country: "Australia",
        applicant_type: fallback.applicant_type,
        metric: fallback.metric,
        reporting_period: fallback.reporting_period,
        period_end: fallback.period_end,
        states: fallback.states,
        is_fallback: true,
        error: error.message,
      };
    }
  }

  /**
   * Returns available program years.
   */
  async getAvailableYears() {
    return await StateNomination.getAvailableYears();
  }

  /**
   * Lightweight source check to detect whether Home Affairs / tracker content has changed.
   * Compares SHA-256 hash of public table content against stored hash.
   */
  async checkSourceHash() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(SOURCE_CHECK_URL, {
        headers: { "User-Agent": "WorldVisa-Bot/1.0 (+https://worldvisagroup.com)" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;

      const html = await res.text();
      // Extract main text content or numbers table to compute stable hash
      const cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 50000);

      return crypto.createHash("sha256").update(cleanText).digest("hex");
    } catch (err) {
      logger.warn("[StateNominationService] Source hash check failed, proceeding to sync", {
        error: err.message,
      });
      return null;
    }
  }

  /**
   * Executes pipeline with smart change detection:
   * 1. Checks source hash before making expensive AI calls.
   * 2. If unchanged and force!=true, skips AI calls and returns existing record.
   * 3. If changed, runs Perplexity + OpenAI and updates 2026–27 record in place.
   */
  async syncStateNominations(options = {}) {
    if (this.isSyncing) {
      logger.warn("[StateNominationService] Sync already in progress, skipping duplicate call.");
      return { success: false, message: "Sync already in progress" };
    }

    const customQuery = typeof options === "string" ? options : options.query || null;
    const force = Boolean(options.force);
    const checkForChanges = options.checkForChanges !== false;

    this.isSyncing = true;
    const overallStartTime = Date.now();
    logger.info("[StateNominationService] Starting State Nominations sync pipeline", { force });

    try {
      const latestRecord = await StateNomination.findOne({ country: "AUSTRALIA", is_latest: true }).lean();
      let currentHash = null;

      // Smart change detection
      if (checkForChanges && !force && latestRecord?.sync_metadata?.source_hash) {
        currentHash = await this.checkSourceHash();
        if (currentHash && currentHash === latestRecord.sync_metadata.source_hash) {
          logger.info("[StateNominationService] Source page unchanged (hash match). Skipping AI research.", {
            hash: currentHash,
          });

          await StateNomination.updateOne(
            { _id: latestRecord._id },
            { $set: { "sync_metadata.source_checked_at": new Date().toISOString() } }
          );

          return {
            success: true,
            changed: false,
            message: "Source content unchanged since last check. AI sync skipped to save tokens.",
            data: latestRecord,
          };
        }
      }

      // Step 1: Perplexity Research
      let rawResearch = null;
      let perplexityDuration = 0;

      if (!process.env.PERPLEXITY_API_KEY) {
        logger.warn("[StateNominationService] PERPLEXITY_API_KEY not configured. Using baseline data.");
        rawResearch = JSON.stringify(StateNomination.getBaseline2026_27SeedData());
      } else {
        const pStart = Date.now();
        rawResearch = await this.perplexity.researchStateNominations(customQuery);
        perplexityDuration = Date.now() - pStart;
        logger.info(`[StateNominationService] Perplexity research completed in ${perplexityDuration}ms`);
      }

      // Step 2: OpenAI Normalization
      const oStart = Date.now();
      const normalizedData = await this.openAI.normalizeAndValidate(rawResearch);
      const openAiDuration = Date.now() - oStart;
      logger.info(`[StateNominationService] OpenAI normalization completed in ${openAiDuration}ms`);

      // If we didn't check hash earlier, compute it now
      if (!currentHash) {
        currentHash = await this.checkSourceHash();
      }

      // Step 3: In-Place Upsert to MongoDB for target program year
      const totalDuration = Date.now() - overallStartTime;
      const metadata = {
        source_hash: currentHash,
        source_checked_at: new Date().toISOString(),
        perplexity_model: "sonar-pro",
        openai_model: this.openAI.model,
        research_duration_ms: perplexityDuration,
        normalization_duration_ms: openAiDuration,
        total_duration_ms: totalDuration,
        status: "success",
      };

      const savedDoc = await StateNomination.saveLatest(normalizedData, rawResearch, metadata);
      logger.info("[StateNominationService] State nomination record updated successfully in database", {
        id: savedDoc._id,
        year: savedDoc.program_year,
      });

      return {
        success: true,
        changed: true,
        message: "State nominations synced and updated successfully",
        data: savedDoc,
        metadata,
      };
    } catch (error) {
      logger.error("[StateNominationService] Synchronization failed", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async getHistory(limit = 10) {
    return await StateNomination.find({ country: "AUSTRALIA" })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select("-raw_research")
      .lean();
  }
}

const stateNominationService = new StateNominationService();

module.exports = stateNominationService;
module.exports.StateNominationService = StateNominationService;
