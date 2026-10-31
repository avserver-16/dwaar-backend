const Friendship = require("../models/Friendship");
const User = require("../models/User");
const { objectIdSchema } = require("../utils/validators");

/**
 * Send a friend request
 * POST /api/friends/request/:userId
 */
exports.sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { userId: recipientId } = req.params;

    // Validate ID
    const validId = objectIdSchema.safeParse(recipientId);
    if (!validId.success) {
      return res.status(400).json({ error: "INVALID_USER_ID", message: "Invalid recipient ID." });
    }

    if (requesterId === recipientId) {
      return res.status(400).json({ error: "SELF_FRIEND_REQUEST", message: "You cannot friend yourself." });
    }

    const recipient = await User.findById(recipientId).select("name email avatar");
    if (!recipient) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "Target user not found." });
    }

    const requester = await User.findById(requesterId).select("name email avatar");

    // Check existing relationship
    const existing = await Friendship.getRelationship(requesterId, recipientId);
    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "ALREADY_FRIENDS", message: "You are already friends with this user." });
      }
      if (existing.status === "blocked") {
        return res.status(403).json({ error: "BLOCKED", message: "Cannot send request to this user." });
      }
      if (existing.status === "pending") {
        if (existing.requester.toString() === requesterId) {
          return res.status(400).json({ error: "REQUEST_ALREADY_SENT", message: "Friend request is already pending." });
        } else {
          // If the other user already sent a request, auto-accept
          existing.status = "accepted";
          existing.respondedAt = new Date();
          await existing.save();

          const io = req.app.get("io");
          if (io) {
            io.to(`user:${existing.requester}`).emit("friend_request_accepted", {
              friendshipId: existing._id,
              user: {
                id: requesterId,
                name: requester?.name,
              },
            });
          }

          return res.status(200).json({
            message: "Friend request automatically accepted as they had also requested you.",
            friendship: existing,
          });
        }
      }
    }

    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    // Real-time socket emission to recipient's personal room
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${recipientId}`).emit("friend_request_received", {
        requestId: friendship._id,
        requester: {
          id: requesterId,
          name: requester?.name,
          email: requester?.email,
        },
      });
    }

    res.status(201).json({ message: "Friend request sent successfully.", friendship });
  } catch (err) {
    console.error("sendFriendRequest error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to send friend request." });
  }
};

/**
 * Accept a friend request
 * POST /api/friends/accept/:requestId
 */
exports.acceptFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { requestId } = req.params;

    const validId = objectIdSchema.safeParse(requestId);
    if (!validId.success) {
      return res.status(400).json({ error: "INVALID_REQUEST_ID", message: "Invalid request ID." });
    }

    const friendship = await Friendship.findById(requestId);
    if (!friendship) {
      return res.status(404).json({ error: "REQUEST_NOT_FOUND", message: "Friend request not found." });
    }

    if (friendship.recipient.toString() !== currentUserId) {
      return res.status(403).json({ error: "UNAUTHORIZED", message: "Only the recipient can accept this request." });
    }

    if (friendship.status === "accepted") {
      return res.status(400).json({ error: "ALREADY_ACCEPTED", message: "Friend request already accepted." });
    }

    if (friendship.status === "blocked") {
      return res.status(403).json({ error: "BLOCKED", message: "Cannot accept request." });
    }

    friendship.status = "accepted";
    friendship.respondedAt = new Date();
    await friendship.save();

    const currentUser = await User.findById(currentUserId).select("name email");

    // Real-time socket emission to requester's personal room
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${friendship.requester}`).emit("friend_request_accepted", {
        friendshipId: friendship._id,
        user: {
          id: currentUserId,
          name: currentUser?.name,
        },
      });
    }

    res.json({ message: "Friend request accepted.", friendship });
  } catch (err) {
    console.error("acceptFriendRequest error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to accept friend request." });
  }
};

/**
 * Reject a friend request
 * POST /api/friends/reject/:requestId
 */
exports.rejectFriendRequest = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { requestId } = req.params;

    const validId = objectIdSchema.safeParse(requestId);
    if (!validId.success) {
      return res.status(400).json({ error: "INVALID_REQUEST_ID", message: "Invalid request ID." });
    }

    const friendship = await Friendship.findById(requestId);
    if (!friendship) {
      return res.status(404).json({ error: "REQUEST_NOT_FOUND", message: "Friend request not found." });
    }

    if (friendship.recipient.toString() !== currentUserId) {
      return res.status(403).json({ error: "UNAUTHORIZED", message: "Only the recipient can reject this request." });
    }

    await Friendship.findByIdAndDelete(requestId);

    res.json({ message: "Friend request rejected." });
  } catch (err) {
    console.error("rejectFriendRequest error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to reject friend request." });
  }
};

/**
 * Unfriend a user
 * DELETE /api/friends/:userId
 */
exports.unfriend = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId: targetUserId } = req.params;

    const validId = objectIdSchema.safeParse(targetUserId);
    if (!validId.success) {
      return res.status(400).json({ error: "INVALID_USER_ID", message: "Invalid target user ID." });
    }

    const friendship = await Friendship.getRelationship(currentUserId, targetUserId);
    if (!friendship) {
      return res.status(404).json({ error: "NOT_FOUND", message: "No friendship found." });
    }

    await Friendship.findByIdAndDelete(friendship._id);

    res.json({ message: "User unfriended successfully." });
  } catch (err) {
    console.error("unfriend error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to unfriend user." });
  }
};

/**
 * Block a user
 * POST /api/friends/block/:userId
 */
exports.blockUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId: targetUserId } = req.params;

    const validId = objectIdSchema.safeParse(targetUserId);
    if (!validId.success) {
      return res.status(400).json({ error: "INVALID_USER_ID", message: "Invalid target user ID." });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: "SELF_BLOCK", message: "You cannot block yourself." });
    }

    let friendship = await Friendship.getRelationship(currentUserId, targetUserId);
    if (!friendship) {
      friendship = new Friendship({
        requester: currentUserId,
        recipient: targetUserId,
      });
    }

    friendship.status = "blocked";
    friendship.blockedBy = currentUserId;
    friendship.respondedAt = new Date();
    await friendship.save();

    res.json({ message: "User blocked successfully." });
  } catch (err) {
    console.error("blockUser error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to block user." });
  }
};

/**
 * Get accepted friends list
 * GET /api/friends
 */
exports.getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: currentUserId }, { recipient: currentUserId }],
    })
      .populate("requester", "name email avatar")
      .populate("recipient", "name email avatar")
      .lean();

    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.toString() === currentUserId;
      const friendUser = isRequester ? f.recipient : f.requester;
      return {
        friendshipId: f._id,
        user: friendUser,
        since: f.respondedAt || f.createdAt,
      };
    });

    res.json(friends);
  } catch (err) {
    console.error("getFriends error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch friends." });
  }
};

/**
 * Get incoming pending friend requests
 * GET /api/friends/requests
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const requests = await Friendship.find({
      recipient: currentUserId,
      status: "pending",
    })
      .populate("requester", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (err) {
    console.error("getPendingRequests error:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch pending requests." });
  }
};
