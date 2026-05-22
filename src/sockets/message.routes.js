const express = require("express");
const router = express.Router();
const Message = require("./message.model");

// GET ROOM MESSAGES
// /api/messages/rooms/:roomId
router.get("/rooms/:roomId", async (req, res) => {
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
      type: "TEXT",
      content: m.message,
      roomId: m.roomId,
      createdAt: m.createdAt,
      isPrivate: false,
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
router.get("/private/:toUserId", async (req, res) => {
  try {
    const currentUserId = req.headers["x-user-id"];
    const { toUserId } = req.params;

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
      type: "TEXT",
      content: m.message,
      createdAt: m.createdAt,
      isPrivate: true,
    }));

    res.json(shaped);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch private messages",
    });
  }
});

module.exports = router;