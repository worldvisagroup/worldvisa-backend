const stateNominationService = require("../services/stateNominationService");
const stateNominationCron = require("../workers/stateNominationCron");
const logger = require("../utils/logger");

/**
 * GET /api/state-nominations
 * GET /api/state-nominations/latest
 * Public endpoint consumed by the Australia immigration landing page.
 * Supports optional ?year=2025-26 or ?year=2026-27 query parameter.
 * Defaults to current active year if omitted.
 */
const getLatestNominations = async (req, res) => {
  try {
    const { year } = req.query;
    const result = await stateNominationService.getLatestNominations(year);
    return res.status(200).json(result);
  } catch (error) {
    logger.error("[StateNominationController] Error fetching nominations", {
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch state nominations data",
      error: error.message,
    });
  }
};

/**
 * GET /api/state-nominations/years
 * Returns list of available program years for frontend tabs/dropdowns.
 */
const getAvailableYears = async (req, res) => {
  try {
    const years = await stateNominationService.getAvailableYears();
    return res.status(200).json({
      success: true,
      years,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/state-nominations/sync
 * Manually triggers the synchronization pipeline.
 * Accepts optional body/query:
 * - wait=true (synchronous response)
 * - force=true (bypass change detection hash check)
 * - query="custom search terms"
 */
const triggerSync = async (req, res) => {
  try {
    const { query, force } = req.body || {};
    const forceSync = req.query.force === "true" || force === true;
    const wait = req.query.wait === "true" || req.body?.wait === true;

    const options = {
      query: query || req.query.query || null,
      force: forceSync,
    };

    logger.info("[StateNominationController] Manual sync requested", { force: forceSync, wait });

    if (wait) {
      const syncResult = await stateNominationService.syncStateNominations(options);
      return res.status(200).json(syncResult);
    } else {
      stateNominationService.syncStateNominations(options).catch((err) => {
        logger.error("[StateNominationController] Background manual sync error", {
          error: err.message,
        });
      });

      return res.status(202).json({
        success: true,
        message: "State nomination synchronization pipeline initiated in background.",
      });
    }
  } catch (error) {
    logger.error("[StateNominationController] Error triggering sync", {
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Sync pipeline failed to execute",
      error: error.message,
    });
  }
};

/**
 * GET /api/state-nominations/status
 * Returns current scheduler status and last sync details.
 */
const getCronStatus = async (req, res) => {
  try {
    const cronStatus = stateNominationCron.getCronStatus();
    const latest = await stateNominationService.getLatestNominations();

    return res.status(200).json({
      success: true,
      cron: cronStatus,
      last_sync: {
        program_year: latest.program_year,
        updated_at: latest.updated_at,
        synced_at: latest.synced_at,
        is_fallback: latest.is_fallback,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/state-nominations/history
 * Returns historical nomination snapshots.
 */
const getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const history = await stateNominationService.getHistory(limit);
    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getLatestNominations,
  getAvailableYears,
  triggerSync,
  getCronStatus,
  getHistory,
};
