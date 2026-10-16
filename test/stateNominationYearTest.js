/**
 * Unit & Integration Test for Australian State Nominations Year-by-Year & Weekly Sync System.
 */

const StateNomination = require("../models/StateNomination");
const stateNominationService = require("../services/stateNominationService");
const stateNominationCron = require("../workers/stateNominationCron");

async function runTests() {
  console.log("=================================================");
  console.log("🧪 STARTING STATE NOMINATIONS YEAR ARCHITECTURE TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: 2025-26 Baseline Data Structure
    const data2025 = StateNomination.getBaseline2025_26SeedData();
    assert(data2025.program_year === "2025-26", "2025-26 program_year is '2025-26'");
    assert(data2025.is_latest === false, "2025-26 is_latest is false (historical)");
    assert(data2025.states.length === 8, "2025-26 contains all 8 states");
    const nsw2025 = data2025.states.find((s) => s.state === "New South Wales");
    assert(nsw2025.subclass_190.value === 2100, "NSW 2025-26 190 allocation is 2,100");
    assert(nsw2025.subclass_491.value === 1500, "NSW 2025-26 491 allocation is 1,500");

    // Test 2: 2026-27 Baseline Data Structure (<5 and zeros preserved)
    const data2026 = StateNomination.getBaseline2026_27SeedData();
    assert(data2026.program_year === "2026-27", "2026-27 program_year is '2026-27'");
    assert(data2026.is_latest === true, "2026-27 is_latest is true (active)");
    assert(data2026.reporting_period === "Jul–Aug 2026", "2026-27 reporting period is 'Jul–Aug 2026'");
    assert(data2026.period_end === "2026-08-31", "2026-27 period end is '2026-08-31'");

    const qld2026 = data2026.states.find((s) => s.state === "Queensland");
    assert(qld2026.subclass_491.value === null, "QLD 2026-27 491 value is null (preserved <5)");
    assert(qld2026.subclass_491.reported_value === "<5", "QLD 2026-27 491 reported_value is '<5'");
    assert(qld2026.subclass_491.exact_count_available === false, "QLD 2026-27 491 exact_count_available is false");

    const vic2026 = data2026.states.find((s) => s.state === "Victoria");
    assert(vic2026.subclass_190.value === 0, "VIC 2026-27 190 value is 0 (official zero)");
    assert(vic2026.subclass_190.reported_value === "0", "VIC 2026-27 190 reported_value is '0'");

    const tas2026 = data2026.states.find((s) => s.state === "Tasmania");
    assert(tas2026.subclass_190.value === 206, "TAS 2026-27 190 value is 206");
    assert(tas2026.subclass_491.value === 55, "TAS 2026-27 491 value is 55");

    // Test 3: Mongoose Validation on both years
    const doc2025 = new StateNomination(data2025);
    const err2025 = doc2025.validateSync();
    assert(!err2025, "Mongoose validation passes for 2025-26");

    const doc2026 = new StateNomination(data2026);
    const err2026 = doc2026.validateSync();
    assert(!err2026, "Mongoose validation passes for 2026-27");

    // Test 4: Available Years List
    const availableYears = await StateNomination.getAvailableYears();
    assert(Array.isArray(availableYears), "getAvailableYears returns an array");
    assert(availableYears.includes("2026-27"), "Available years includes '2026-27'");
    assert(availableYears.includes("2025-26"), "Available years includes '2025-26'");
    assert(availableYears[0] === "2026-27", "Newest year '2026-27' is first");

    // Test 5: Service Year-Based Retrieval
    const serviceRes2025 = await stateNominationService.getLatestNominations("2025-26");
    assert(serviceRes2025.success === true, "Service returns success for 2025-26");
    assert(serviceRes2025.program_year === "2025-26", "Service returns 2025-26 record");
    assert(Array.isArray(serviceRes2025.available_years), "Service response includes available_years array");

    const serviceResLatest = await stateNominationService.getLatestNominations();
    assert(serviceResLatest.success === true, "Service returns success for default latest query");
    assert(serviceResLatest.program_year === "2026-27", "Default latest query returns 2026-27 record");

    // Test 6: Cron Configuration (Weekly on Mondays)
    const cronStatus = stateNominationCron.getCronStatus();
    assert(cronStatus.schedule === "0 2 * * 1", "Cron schedule is weekly '0 2 * * 1'");
    assert(cronStatus.frequency.includes("Weekly"), "Cron frequency description is Weekly");

    // Test 7: Smart Change Detection Hash Check
    const hash = await stateNominationService.checkSourceHash();
    assert(typeof hash === "string" || hash === null, "checkSourceHash returns hash string or null");
    if (hash) {
      assert(hash.length === 64, "SHA-256 hash is 64 hex characters");
    }

    console.log("\n=================================================");
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution threw exception:", err);
    process.exit(1);
  }
}

runTests();
