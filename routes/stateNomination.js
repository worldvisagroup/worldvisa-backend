const express = require("express");
const stateNominationController = require("../controllers/stateNominationController");

const router = express.Router();

/**
 * Public Routes (used by Australia Immigration landing page)
 */

// GET /api/state-nominations - Fetch the 8 Australian states with latest nomination/invitation figures
router.get("/", stateNominationController.getLatestNominations);

// GET /api/state-nominations/latest - Explicit alias for latest nominations
router.get("/latest", stateNominationController.getLatestNominations);

// GET /api/state-nominations/years - Get available program years (e.g. ["2026-27", "2025-26"])
router.get("/years", stateNominationController.getAvailableYears);

// GET /api/state-nominations/status - Cron scheduler and sync status
router.get("/status", stateNominationController.getCronStatus);

// GET /api/state-nominations/history - Historical audit snapshots
router.get("/history", stateNominationController.getHistory);

/**
 * Admin / Operational Routes
 */

// POST /api/state-nominations/sync - Manually trigger research & normalization pipeline
router.post("/sync", stateNominationController.triggerSync);

module.exports = router;
