const Group = require("./group.model");
const User = require("../models/User");
const {
  getHaversineDistanceMeters,
  calculateSpeedKmh,
  isLocationFresh,
  findGroupsContainingPoint,
  isPointInGroup,
  MAX_TRAVEL_SPEED_KMH,
} = require("../utils/geo.utils");
const { updateLocationSchema, objectIdSchema, groupTypingSchema } = require("../utils/validators");

module.exports = (io, socket) => {
  const userId = socket.userId;

  /**
   * Update real-time location and recompute eligible groups
   * socket.on("update_location", { lat, lng, accuracy? })
   */
  socket.on("update_location", async (data) => {
    try {
      const parseResult = updateLocationSchema.safeParse(data);
      if (!parseResult.success) {
        return socket.emit("group_error", {
          code: "INVALID_COORDINATES",
          message: "Invalid location coordinates provided.",
          details: parseResult.error.format(),
        });
      }

      const { lat, lng } = parseResult.data;
      const user = await User.findById(userId);

      if (!user) {
        return socket.emit("group_error", {
          code: "USER_NOT_FOUND",
          message: "User not found.",
        });
      }

      const now = new Date();

      // Basic spoofing & rate-limiting protection
      if (
        user.lastLocation?.coordinates &&
        user.lastLocation.coordinates.length === 2 &&
        user.lastLocationAt
      ) {
        const [oldLng, oldLat] = user.lastLocation.coordinates;
        const timeDeltaSeconds = (now.getTime() - new Date(user.lastLocationAt).getTime()) / 1000;

        // Rate limit: 1 update per 5s (unless bypass option specified)
        if (timeDeltaSeconds < 5 && !data.bypassRateLimit) {
          return socket.emit("group_error", {
            code: "RATE_LIMITED",
            message: "Location updates are rate-limited. Please wait 5 seconds between updates.",
          });
        }

        const distanceMeters = getHaversineDistanceMeters(oldLat, oldLng, lat, lng);
        const speedKmh = calculateSpeedKmh(distanceMeters, timeDeltaSeconds);

        // Teleport check: abnormal speed > MAX_TRAVEL_SPEED_KMH (and distance > 500m)
        if (speedKmh > MAX_TRAVEL_SPEED_KMH && distanceMeters > 500) {
          console.warn(
            `[Spoofing Alert] User ${userId} teleported ${distanceMeters.toFixed(0)}m in ${timeDeltaSeconds.toFixed(1)}s (speed: ${speedKmh.toFixed(1)} km/h)`
          );
          return socket.emit("group_error", {
            code: "TELEPORT_DETECTED",
            message: "Location update rejected: abnormal travel speed detected.",
          });
        }
      }

      // Update user in DB
      user.lastLocation = {
        type: "Point",
        coordinates: [lng, lat],
      };
      user.lastLocationAt = now;
      await user.save();

      // Recompute eligible groups for the new location
      const eligibleGroups = await findGroupsContainingPoint(lng, lat, Group);
      const eligibleGroupIds = new Set(eligibleGroups.map((g) => g._id.toString()));

      const joined = [];
      const left = [];

      // Join new eligible rooms across all user's active sockets
      for (const group of eligibleGroups) {
        const roomName = `group:${group._id}`;
        if (!socket.rooms.has(roomName)) {
          socket.join(roomName);
          joined.push(group._id.toString());
        }
      }

      // Leave rooms for groups the user has moved out of
      for (const room of socket.rooms) {
        if (room.startsWith("group:")) {
          const groupId = room.replace("group:", "");
          if (!eligibleGroupIds.has(groupId)) {
            socket.leave(room);
            left.push(groupId);
          }
        }
      }

      // Emit groups_updated { joined: [...], left: [...] } to the user
      socket.emit("groups_updated", { joined, left });

    } catch (err) {
      console.error("update_location error:", err);
      socket.emit("group_error", {
        code: "SERVER_ERROR",
        message: "Failed to update location.",
      });
    }
  });

  /**
   * Join all groups containing the user's current location
   */
  socket.on("join_groups", async () => {
    try {
      const user = await User.findById(userId).select("lastLocation lastLocationAt");

      if (!user || !user.lastLocation?.coordinates || user.lastLocation.coordinates.length < 2) {
        return socket.emit("group_error", {
          code: "LOCATION_REQUIRED",
          message: "No location registered. Please update location first.",
        });
      }

      if (!isLocationFresh(user.lastLocationAt)) {
        return socket.emit("group_error", {
          code: "LOCATION_STALE",
          message: "Location is stale or missing. Please update your location.",
        });
      }

      const [lng, lat] = user.lastLocation.coordinates;
      const groups = await findGroupsContainingPoint(lng, lat, Group);

      groups.forEach(({ _id }) => {
        socket.join(`group:${_id}`);
      });

      socket.emit("groups_updated", {
        joined: groups.map((g) => g._id.toString()),
        left: [],
      });
    } catch (err) {
      console.error("join_groups error:", err);
      socket.emit("group_error", {
        code: "SERVER_ERROR",
        message: "Failed to join location-based groups.",
      });
    }
  });

  /**
   * Join a specific group (strictly verifies location radius)
   */
  socket.on("join_group", async (rawGroupId) => {
    try {
      const groupId = typeof rawGroupId === "object" ? rawGroupId?.groupId : rawGroupId;

      const validId = objectIdSchema.safeParse(groupId);
      if (!validId.success) {
        return socket.emit("group_error", {
          code: "INVALID_GROUP_ID",
          message: "Invalid group ID format.",
        });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return socket.emit("group_error", {
          code: "GROUP_NOT_FOUND",
          message: "Group does not exist.",
        });
      }

      const user = await User.findById(userId).select("lastLocation lastLocationAt");
      if (!user || !user.lastLocation?.coordinates || user.lastLocation.coordinates.length < 2) {
        return socket.emit("group_error", {
          code: "LOCATION_REQUIRED",
          message: "Location is required to join groups.",
        });
      }

      if (!isLocationFresh(user.lastLocationAt)) {
        return socket.emit("group_error", {
          code: "LOCATION_STALE",
          message: "Location is stale or missing. Please update your location.",
        });
      }

      const [lng, lat] = user.lastLocation.coordinates;
      const inRadius = isPointInGroup(lat, lng, group);

      if (!inRadius) {
        return socket.emit("group_error", {
          code: "OUT_OF_RANGE",
          message: "You are outside this group's active radius.",
        });
      }

      socket.join(`group:${groupId}`);

    } catch (err) {
      console.error("join_group error:", err);
      socket.emit("group_error", {
        code: "SERVER_ERROR",
        message: "Unable to join group.",
      });
    }
  });

  /**
   * Leave a group room (single authoritative listener)
   */
  socket.on("leave_group", (rawGroupId) => {
    const groupId = typeof rawGroupId === "object" ? rawGroupId?.groupId : rawGroupId;
    if (groupId) {
      socket.leave(`group:${groupId}`);
      console.log(`Socket ${socket.id} left group ${groupId}`);
    }
  });

  /**
   * Typing indicator for group chat (spoof-proof identity & range-verified)
   */
  socket.on("group_typing", async (data) => {
    try {
      // Derive identity from socket.userId only
      const senderUserId = socket.userId;

      const parseResult = groupTypingSchema.safeParse(data);
      if (!parseResult.success) return;

      const { groupId, isTyping } = parseResult.data;

      // Re-verify location freshness and range
      const user = await User.findById(senderUserId).select("lastLocation lastLocationAt");
      if (!user || !isLocationFresh(user.lastLocationAt)) return;

      const group = await Group.findById(groupId);
      if (!group) return;

      const [lng, lat] = user.lastLocation.coordinates;
      if (!isPointInGroup(lat, lng, group)) return;

      socket.to(`group:${groupId}`).emit("group_typing", {
        userId: senderUserId,
        isTyping: !!isTyping,
      });
    } catch (err) {
      console.error("group_typing error:", err);
    }
  });
};