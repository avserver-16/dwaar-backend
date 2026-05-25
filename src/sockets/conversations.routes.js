const express = require("express");
const router = express.Router();
const Message = require("./message.model");

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      isPrivate: true,
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name")
      .populate("recipient", "name")
      .lean();

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === userId
          ? msg.recipient
          : msg.sender;

      if (!conversationsMap.has(otherUser._id.toString())) {
        conversationsMap.set(otherUser._id.toString(), {
          _id: otherUser._id,
          participants: [
            {
              _id: otherUser._id,
              name: otherUser.name,
            },
          ],
          lastMessage: {
            message: msg.message,
            createdAt: msg.createdAt,
          },
        });
      }
    });

    res.json(Array.from(conversationsMap.values()));

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch conversations",
    });
  }
});

module.exports = router;