const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Sorted pair: userA < userB lexicographically as strings
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
      required: true,
      index: true,
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique relationship between any two users regardless of who requested
friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });

// Pre-validate hook to automatically populate sorted userA and userB
friendshipSchema.pre("validate", function () {
  if (this.requester && this.recipient) {
    const reqStr = this.requester.toString();
    const recStr = this.recipient.toString();
    if (reqStr < recStr) {
      this.userA = this.requester;
      this.userB = this.recipient;
    } else {
      this.userA = this.recipient;
      this.userB = this.requester;
    }
  }
});

// Helper to get normalized pair
friendshipSchema.statics.getPair = function (user1, user2) {
  const u1 = user1.toString();
  const u2 = user2.toString();
  return u1 < u2
    ? { userA: user1, userB: user2 }
    : { userA: user2, userB: user1 };
};

// Check relationship between two users
friendshipSchema.statics.getRelationship = async function (user1, user2) {
  const pair = this.getPair(user1, user2);
  return this.findOne({ userA: pair.userA, userB: pair.userB });
};

// Check if two users are accepted friends
friendshipSchema.statics.areFriends = async function (user1, user2) {
  if (!user1 || !user2 || user1.toString() === user2.toString()) {
    return false;
  }
  const friendship = await this.getRelationship(user1, user2);
  return !!friendship && friendship.status === "accepted";
};

// Check if there is any block between two users
friendshipSchema.statics.isBlocked = async function (user1, user2) {
  if (!user1 || !user2) return false;
  const friendship = await this.getRelationship(user1, user2);
  return !!friendship && friendship.status === "blocked";
};

module.exports = mongoose.model("Friendship", friendshipSchema);
