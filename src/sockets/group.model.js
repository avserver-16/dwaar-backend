const mongoose = require("mongoose");

const DEFAULT_RADIUS = parseInt(process.env.DEFAULT_GROUP_RADIUS_METERS, 10) || 1000;

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: null,
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Record of users who joined / opted in (membership is dynamically governed by location)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // GeoJSON Point location for the group zone
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    // Radius in meters defining the group's active boundary (100m to 50,000m)
    radiusMeters: {
      type: Number,
      default: DEFAULT_RADIUS,
      min: 100,
      max: 50000,
      required: true,
    },

    // Flag for migration or groups needing location configuration by admin
    needsAdminSetup: {
      type: Boolean,
      default: false,
    },

    category: {
      type: String,
      default: null,
    },

    subCategory: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location-based spatial queries
groupSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Group", groupSchema);