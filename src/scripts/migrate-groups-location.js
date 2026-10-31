/**
 * Migration Script: Migrate Existing Groups to Location-Based Model
 * 
 * Sets default GeoJSON location and radius for legacy groups without spatial data,
 * flags them with `needsAdminSetup: true`, and ensures 2dsphere indexes.
 * 
 * Usage:
 *   node src/scripts/migrate-groups-location.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Group = require("../sockets/group.model");
const User = require("../models/User");

const DEFAULT_RADIUS = parseInt(process.env.DEFAULT_GROUP_RADIUS_METERS, 10) || 1000;

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    console.log("Starting groups location migration...");

    // 1. Find groups missing valid GeoJSON coordinates
    const groupsToUpdate = await Group.find({
      $or: [
        { location: { $exists: false } },
        { "location.coordinates": { $exists: false } },
        { "location.coordinates": { $size: 0 } },
        { radiusMeters: { $exists: false } },
      ],
    });

    console.log(`Found ${groupsToUpdate.length} legacy groups needing migration.`);

    let updatedCount = 0;
    for (const group of groupsToUpdate) {
      if (!group.location || !Array.isArray(group.location.coordinates) || group.location.coordinates.length < 2) {
        group.location = {
          type: "Point",
          coordinates: [0, 0], // Default center point
        };
        group.needsAdminSetup = true;
      }

      if (!group.radiusMeters) {
        group.radiusMeters = DEFAULT_RADIUS;
      }

      await group.save();
      updatedCount++;
    }

    console.log(`Successfully migrated ${updatedCount} groups.`);

    // 2. Ensure 2dsphere indexes exist
    console.log("Ensuring 2dsphere indexes...");
    await Group.collection.createIndex({ location: "2dsphere" });
    await User.collection.createIndex({ lastLocation: "2dsphere" });
    console.log("Geospatial indexes verified.");

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
