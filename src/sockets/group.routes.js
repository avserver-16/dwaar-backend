const express = require("express");
const router = express.Router();
const Group = require("./group.model");
const Message = require("./message.model");
const authMiddleware = require("../middleware/auth");

// Create group
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      adminId,
      memberIds = [],
      category,
      subCategory,
    } = req.body;

    const members = [...new Set([adminId, ...memberIds])];

    const group = await Group.create({
      name,
      description,
      admin: adminId,
      members,
      category,
      subCategory,
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group", details: err.message });
  }
});

// Get groups for a user
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId }).lean();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups", details: err.message });
  }
});

// Add member
router.post("/:groupId/members", authMiddleware, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $addToSet: { members: req.body.userId } },
      { new: true }
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to add member", details: err.message });
  }
});

// Remove member
router.delete("/:groupId/members/:userId", authMiddleware, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $pull: { members: req.params.userId } },
      { new: true }
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member", details: err.message });
  }
});

// Get group messages
router.get("/:groupId/messages", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId })
      .sort({ createdAt: 1 })
      .lean();

    const shaped = messages.map((m) => ({
      id: m._id.toString(),
      senderId: m.sender.toString(),
      type: m.type,
      attachment: m.attachment,
      content: m.message,
      groupId: m.groupId.toString(),
      createdAt: m.createdAt,
    }));

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group messages", details: err.message });
  }
});


//user joins a group
router.post("/:groupId/join", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      {
        $addToSet: { members: userId }
      },
      { new: true }
    );

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to join group", details: err.message });
  }
});
module.exports = router;