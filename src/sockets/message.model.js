const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // For room-based messages
    roomId: {
      type: String,
      default: null,
    },
    // For private (one-to-one) messages
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null, // null = unread
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast private conversation lookups
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ roomId: 1 });
messageSchema.index({ groupId: 1 });

module.exports = mongoose.model("Message", messageSchema);