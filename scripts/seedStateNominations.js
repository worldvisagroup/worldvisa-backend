/**
 * Idempotent Seed Script for Australian State Nominations.
 * Seeds:
 * 1. 2025–26 Completed Historical Record (Official Home Affairs planning allocations & outcomes)
 * 2. 2026–27 Active Baseline Record (Official Jul–Aug 2026 Home Affairs SkillSelect snapshot)
 *
 * Safe to rerun anytime. Uses upsert by (country, program_year).
 *
 * Usage:
 *   node scripts/seedStateNominations.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const StateNomination = require("../models/StateNomination");

async function seedStateNominations() {
  const mongoUri = process.env.MONGODB_CONNECTION_STRING;
  if (!mongoUri) {
    console.error("❌ MONGODB_CONNECTION_STRING environment variable is missing.");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB.");

  try {
    // 1. Seed 2025–26 Completed Historical Record
    console.log("\n📦 Seeding 2025–26 historical data...");
    const data2025_26 = StateNomination.getBaseline2025_26SeedData();
    const doc2025_26 = await StateNomination.findOneAndUpdate(
      { country: "AUSTRALIA", program_year: "2025-26" },
      { $set: data2025_26 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ 2025–26 record upserted successfully [ID: ${doc2025_26._id}]`);

    // 2. Seed 2026–27 Active Baseline Record
    console.log("\n📦 Seeding 2026–27 active baseline data...");
    const data2026_27 = StateNomination.getBaseline2026_27SeedData();
    const doc2026_27 = await StateNomination.findOneAndUpdate(
      { country: "AUSTRALIA", program_year: "2026-27" },
      { $set: data2026_27 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`✅ 2026–27 record upserted successfully [ID: ${doc2026_27._id}]`);

    // Ensure only 2026-27 is marked is_latest: true
    await StateNomination.updateMany(
      { country: "AUSTRALIA", program_year: { $ne: "2026-27" } },
      { $set: { is_latest: false } }
    );

    const availableYears = await StateNomination.getAvailableYears();
    console.log("\n=======================================================");
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log(`Available Program Years in Database: ${JSON.stringify(availableYears)}`);
    console.log("=======================================================\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed.");
  }
}

if (require.main === module) {
  seedStateNominations();
}

module.exports = seedStateNominations;
