const cron = require("node-cron");
const visaNewsService = require("../services/visaNewsService");


let cronJob = null;
let isRunning = false;

/**
 * Fetch visa news task
 */
const fetchVisaNewsTask = async () => {
  if (isRunning) {
    console.log("⏭️  Visa news fetch already in progress, skipping...");
    return;
  }

  try {
    isRunning = true;
    const timestamp = new Date().toISOString();
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🕐 CRON JOB STARTED: Visa News Fetch`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`${"=".repeat(60)}\n`);

    // Fetch latest news with retry mechanism
    let fetchResult = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !fetchResult?.success) {
      try {
        console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} - Fetching visa news...`);
        fetchResult = await visaNewsService.fetchVisaNews(100);
        
        if (fetchResult.success) {
          console.log(`✅ Fetch successful on attempt ${retryCount + 1}`);
          break;
        } else {
          console.log(`⚠️  Fetch failed on attempt ${retryCount + 1}: ${fetchResult.message}`);
        }
      } catch (error) {
        console.error(`❌ Error on attempt ${retryCount + 1}:`, error.message);
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`⏳ Waiting 30 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
      }
    }

    if (fetchResult && fetchResult.success) {
      console.log(`\n✅ FETCH COMPLETED SUCCESSFULLY`);
      console.log(`   New Articles: ${fetchResult.count}`);
      console.log(`   Duplicates: ${fetchResult.duplicates}`);
      console.log(`   Errors: ${fetchResult.errors}`);
      console.log(`   Total Processed: ${fetchResult.total}`);
    } else {
      console.error(`\n❌ FETCH FAILED AFTER ${maxRetries} ATTEMPTS`);
      if (fetchResult) {
        console.error(`   Last Error: ${fetchResult.message}`);
      }
    }

    // Cleanup old news (older than 30 days)
    console.log(`\n🧹 Starting cleanup of old articles...`);
    const cleanupResult = await visaNewsService.cleanupOldNews(30);

    if (cleanupResult.success) {
      console.log(`   Deleted ${cleanupResult.deletedCount} old articles`);
    } else {
      console.error(`   Cleanup failed: ${cleanupResult.message}`);
    }

    // Get current stats
    console.log(`\n📊 Current Statistics:`);
    const stats = await visaNewsService.getNewsStats();
    if (stats) {
      console.log(`   Total Active Articles: ${stats.totalCount}`);
      console.log(`   Countries: ${stats.countByCountry.length}`);
      console.log(`   Visa Types: ${stats.countByVisaType.length}`);
      if (stats.latestArticleDate) {
        console.log(`   Latest Article: ${stats.latestArticleDate.toISOString()}`);
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ CRON JOB COMPLETED`);
    console.log(`${"=".repeat(60)}\n`);
  } catch (error) {
    console.error(`\n❌ CRON JOB ERROR:`, error.message);
    console.error(error.stack);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the cron job
 */
const startCronJob = () => {
  if (cronJob) {
    console.log("⚠️  Visa news cron job is already running");
    return;
  }

  // Check if cron is disabled via environment variable
  if (process.env.DISABLE_VISA_NEWS_CRON === "true") {
    console.log("⏸️  Visa news cron job is disabled via environment variable");
    return;
  }

  // Schedule: Every 6 hours at minute 0
  cronJob = cron.schedule("0 */6 * * *", fetchVisaNewsTask, {
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE || "UTC",
  });

  console.log("✅ Visa news cron job started successfully");
  console.log("📅 Schedule: Every 6 hours (0 */6 * * *)");
  console.log(`🌍 Timezone: ${process.env.CRON_TIMEZONE || "UTC"}`);

  // Optionally run immediately on startup
  if (process.env.RUN_CRON_ON_STARTUP === "true") {
    console.log("▶️  Running initial fetch on startup...");
    setTimeout(() => {
      fetchVisaNewsTask();
    }, 5000); // Wait 5 seconds after startup
  }
};

/**
 * Stop the cron job
 */
const stopCronJob = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("⏹️  Visa news cron job stopped");
  } else {
    console.log("⚠️  No cron job is running");
  }
};

/**
 * Get cron job status
 */
const getCronStatus = () => {
  return {
    isScheduled: cronJob !== null,
    isRunning: isRunning,
    schedule: "0 */6 * * *",
    timezone: process.env.CRON_TIMEZONE || "UTC",
  };
};

/**
 * Manually trigger the cron job (for testing)
 */
const triggerManually = async () => {
  console.log("🔧 Manually triggering visa news fetch...");
  await fetchVisaNewsTask();
};

module.exports = {
  startCronJob,
  stopCronJob,
  getCronStatus,
  triggerManually,
  fetchVisaNewsTask,
};

