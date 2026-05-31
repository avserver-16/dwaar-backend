const express = require("express");
const router = express.Router();
const Group = require("./group.model");
const Message = require("../messages/message.model");

// Create group
router.post("/", async (req, res) => {
  try {
    const { name, description, adminId, memberIds = [] } = req.body;
    const members = [...new Set([adminId, ...memberIds])];
    const group = await Group.create({ name, description, admin: adminId, members });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get groups for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId }).lean();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Add member
router.post("/:groupId/members", async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $addToSet: { members: req.body.userId } },
      { new: true }
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Remove member
router.delete("/:groupId/members/:userId", async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $pull: { members: req.params.userId } },
      { new: true }
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Get group messages
router.get("/:groupId/messages", async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId })
      .sort({ createdAt: 1 })
      .lean();

    const shaped = messages.map((m) => ({
      id: m._id.toString(),
      senderId: m.sender.toString(),
      type: "TEXT",
      content: m.message,
      groupId: m.groupId.toString(),
      createdAt: m.createdAt,
    }));

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
});

module.exports = router;