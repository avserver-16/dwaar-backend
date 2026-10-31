const express = require("express");
const router = express.Router();
const Message = require("./message.model");
const Friendship = require("../models/Friendship");
const authMiddleware = require("../middleware/auth");
const { objectIdSchema } = require("../utils/validators");

// GET ROOM MESSAGES
// /api/messages/rooms/:roomId
router.get("/rooms/:roomId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      roomId: req.params.roomId,
      isPrivate: false,
    })
      .sort({ createdAt: 1 })
      .lean();

    const shaped = messages.map((m) => ({
      id: m._id.toString(),
      senderId: m.sender.toString(),
      type: m.type,
      attachment: m.attachment,
      content: m.message,
      roomId: m.roomId,
      createdAt: m.createdAt,
    }));

    res.json(shaped);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch room messages",
    });
  }
});

// GET PRIVATE MESSAGES
// /api/messages/private/:toUserId
router.get("/private/:toUserId", authMiddleware, async (req, res) => {
  try {
    // Derive identity from authenticated JWT only
    const currentUserId = req.user.id;
    const { toUserId } = req.params;

    // Validate toUserId
    const validId = objectIdSchema.safeParse(toUserId);
    if (!validId.success) {
      return res.status(400).json({
        error: "INVALID_USER_ID",
        message: "Invalid target user ID.",
      });
    }

    // Friendship verification: private history only available between accepted friends
    const relationship = await Friendship.getRelationship(currentUserId, toUserId);

    if (!relationship || relationship.status !== "accepted") {
      if (relationship?.status === "blocked") {
        return res.status(403).json({
          error: "BLOCKED",
          code: "BLOCKED",
          message: "Conversation history is not accessible because a user is blocked.",
        });
      }
      return res.status(403).json({
        error: "NOT_FRIENDS",
        code: "NOT_FRIENDS",
        message: "You can only view messages with accepted friends.",
      });
    }

    const messages = await Message.find({
      isPrivate: true,
      $or: [
        { sender: currentUserId, recipient: toUserId },
        { sender: toUserId, recipient: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    const shaped = messages.map((m) => ({
      id: m._id.toString(),
      senderId: m.sender.toString(),
      type: m.type,
      attachment: m.attachment,
      content: m.message,
      createdAt: m.createdAt,
      isPrivate: true,
    }));

    res.json(shaped);
  } catch (err) {
    console.error("GET /api/messages/private/:toUserId error:", err);
    res.status(500).json({
      error: "Failed to fetch private messages",
    });
  }
});

module.exports = router;