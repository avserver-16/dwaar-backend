const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Optional category for filtering rooms
    category: {
      type: String,
      default: "general",
      trim: true,
    },

    // User who created the room
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Users currently in the room
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Maximum number of members
    maxMembers: {
      type: Number,
      default: 100,
    },

    // Location of the room
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      city: {
        type: String,
        default: "",
      },
      region: {
        type: String,
        default: "",
      },
      country: {
        type: String,
        default: "",
      },
    },

    // Radius in which this room is considered nearby
    radius: {
      type: Number,
      default: 1000,
    },

    // Room status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);