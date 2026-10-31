const express = require("express");
const router = express.Router();
const Group = require("./group.model");
const Message = require("./message.model");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const {
  validateCoordinates,
  findGroupsContainingPoint,
  isLocationFresh,
  isPointInGroup,
} = require("../utils/geo.utils");
const { objectIdSchema } = require("../utils/validators");

// GET /api/groups/nearby?lat&lng (groups containing the point)
router.get("/nearby", authMiddleware, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    const validation = validateCoordinates(lat, lng);
    if (!validation.valid) {
      return res.status(400).json({ error: "INVALID_COORDINATES", message: validation.error });
    }

    const nearbyGroups = await findGroupsContainingPoint(lng, lat, Group);
    res.json(nearbyGroups);
  } catch (err) {
    console.error("GET /nearby error:", err);
    res.status(500).json({ error: "Failed to fetch nearby groups", details: err.message });
  }
});

// Create group
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      adminId = req.user.id,
      memberIds = [],
      category,
      subCategory,
      lat,
      lng,
      location,
      radiusMeters = parseInt(process.env.DEFAULT_GROUP_RADIUS_METERS, 10) || 1000,
    } = req.body;

    const members = [...new Set([adminId, ...memberIds])];

    // Determine GeoJSON coordinates [lng, lat]
    let coordinates = [0, 0];
    let needsAdminSetup = true;

    if (Array.isArray(location?.coordinates) && location.coordinates.length === 2) {
      coordinates = [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])];
      needsAdminSetup = false;
    } else if (lat !== undefined && lng !== undefined) {
      coordinates = [parseFloat(lng), parseFloat(lat)];
      needsAdminSetup = false;
    }

    const group = await Group.create({
      name,
      description,
      admin: adminId,
      members,
      category,
      subCategory,
      location: {
        type: "Point",
        coordinates,
      },
      radiusMeters: Math.max(100, Math.min(50000, radiusMeters)),
      needsAdminSetup,
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

// Get group messages - strictly location protected
router.get("/:groupId/messages", authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    const validId = objectIdSchema.safeParse(groupId);
    if (!validId.success) {
      return res.status(400).json({ error: "INVALID_GROUP_ID", message: "Invalid group ID." });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "GROUP_NOT_FOUND", message: "Group not found." });
    }

    // Verify user's location is fresh and within group radius
    const user = await User.findById(req.user.id).select("lastLocation lastLocationAt");
    if (!user || !user.lastLocation?.coordinates || user.lastLocation.coordinates.length < 2) {
      return res.status(403).json({
        error: "LOCATION_REQUIRED",
        code: "LOCATION_STALE",
        message: "You must provide a current location to access group messages.",
      });
    }

    if (!isLocationFresh(user.lastLocationAt)) {
      return res.status(403).json({
        error: "LOCATION_STALE",
        code: "LOCATION_STALE",
        message: "Your location is stale or expired. Please update your location.",
      });
    }

    const [userLng, userLat] = user.lastLocation.coordinates;
    const inRange = isPointInGroup(userLat, userLng, group);
    if (!inRange) {
      return res.status(403).json({
        error: "OUT_OF_RANGE",
        code: "OUT_OF_RANGE",
        message: "You are outside this group's active radius.",
      });
    }

    const messages = await Message.find({ groupId })
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

// User joins a group (opt-in record)
router.post("/:groupId/join", authMiddleware, async (req, res) => {
  try {
    const { userId = req.user.id } = req.body;

    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      {
        $addToSet: { members: userId },
      },
      { new: true }
    );

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Failed to join group", details: err.message });
  }
});

module.exports = router;