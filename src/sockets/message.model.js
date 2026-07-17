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
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["TEXT", "IMAGE", "VIDEO", "DOCUMENT"],
      default: "TEXT",
    },

    attachment: {
      url: String,
      publicId: String,
      fileName: String,
      mimeType: String,
      size: Number,
    },

    roomId: {
      type: String,
      default: null,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
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