const cron = require("node-cron");
const stateNominationService = require("../services/stateNominationService");
const logger = require("../utils/logger");

let cronJob = null;
let isRunning = false;

// Default: Weekly on Mondays at 02:00 AM UTC (Home Affairs only updates monthly)
const DEFAULT_SCHEDULE = "0 2 * * 1";

/**
 * Task executed by the cron scheduler.
 * Uses smart change detection to avoid unnecessary AI API consumption.
 */
const runStateNominationSyncTask = async (options = {}) => {
  if (isRunning) {
    logger.warn("[StateNomination Cron] Sync task already running, skipping this tick.");
    return;
  }

  isRunning = true;
  const timestamp = new Date().toISOString();
  logger.info(`[StateNomination Cron] Starting weekly state nominations check. Timestamp: ${timestamp}`);

  let attempt = 0;
  const maxRetries = 3;
  let success = false;

  while (attempt < maxRetries && !success) {
    attempt++;
    try {
      logger.info(`[StateNomination Cron] Attempt ${attempt}/${maxRetries} running...`);
      const result = await stateNominationService.syncStateNominations({
        checkForChanges: options.force ? false : true,
        force: Boolean(options.force),
      });

      if (result && result.success) {
        success = true;
        const msg = result.changed === false
          ? "[StateNomination Cron] Source unchanged. Sync skipped to save tokens."
          : `[StateNomination Cron] Sync completed successfully on attempt ${attempt}`;
        logger.info(msg);
        break;
      }
    } catch (error) {
      logger.error(`[StateNomination Cron] Attempt ${attempt}/${maxRetries} failed`, {
        error: error.message,
      });

      if (attempt < maxRetries) {
        const delayMs = 30000 * attempt;
        logger.info(`[StateNomination Cron] Waiting ${delayMs / 1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  if (!success) {
    logger.error(`[StateNomination Cron] Weekly sync failed after ${maxRetries} attempts.`);
  }

  isRunning = false;
};

/**
 * Start the weekly cron scheduler
 */
const startCronJob = () => {
  if (cronJob) {
    logger.warn("[StateNomination Cron] Cron job is already scheduled.");
    return;
  }

  if (process.env.DISABLE_STATE_NOMINATION_CRON === "true") {
    logger.info("[StateNomination Cron] Cron job disabled via DISABLE_STATE_NOMINATION_CRON environment variable.");
    return;
  }

  const schedulePattern = process.env.STATE_NOMINATION_CRON_SCHEDULE || DEFAULT_SCHEDULE;
  const timezone = process.env.CRON_TIMEZONE || "UTC";

  cronJob = cron.schedule(
    schedulePattern,
    async () => {
      await runStateNominationSyncTask();
    },
    {
      scheduled: true,
      timezone,
    }
  );

  logger.info("[StateNomination Cron] Weekly job successfully scheduled", {
    schedule: schedulePattern,
    frequency: "Weekly (Mondays)",
    timezone,
  });

  if (process.env.RUN_STATE_NOMINATION_CRON_ON_STARTUP === "true") {
    logger.info("[StateNomination Cron] Triggering initial startup sync in 10 seconds...");
    setTimeout(() => {
      runStateNominationSyncTask().catch((err) => {
        logger.error("[StateNomination Cron] Startup sync error", { error: err.message });
      });
    }, 10000);
  }
};

const stopCronJob = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info("[StateNomination Cron] Cron job stopped.");
  }
};

const getCronStatus = () => {
  const schedule = process.env.STATE_NOMINATION_CRON_SCHEDULE || DEFAULT_SCHEDULE;
  return {
    isScheduled: cronJob !== null,
    isRunning,
    schedule,
    frequency: schedule === DEFAULT_SCHEDULE ? "Weekly (Every Monday at 02:00 UTC)" : "Custom",
    timezone: process.env.CRON_TIMEZONE || "UTC",
  };
};

const triggerManually = async (options = {}) => {
  logger.info("[StateNomination Cron] Manual trigger requested.", options);
  await runStateNominationSyncTask(options);
};

module.exports = {
  startCronJob,
  stopCronJob,
  getCronStatus,
  triggerManually,
  runStateNominationSyncTask,
};
