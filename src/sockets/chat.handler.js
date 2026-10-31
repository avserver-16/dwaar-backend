const Group = require("./group.model");
const Message = require("./message.model");
const User = require("../models/User");
const { isLocationFresh, isPointInGroup } = require("../utils/geo.utils");
const { sendGroupMessageSchema } = require("../utils/validators");

module.exports = (io, socket) => {
  const senderId = socket.userId;

  /**
   * Send a group message (Strictly Location Protected)
   */
  socket.on("send_group_message", async (data) => {
    try {
      // Validate input payload
      const parseResult = sendGroupMessageSchema.safeParse(data);
      if (!parseResult.success) {
        return socket.emit("group_error", {
          code: "VALIDATION_ERROR",
          message: "Invalid group message payload.",
          details: parseResult.error.format(),
        });
      }

      const { groupId, message, type = "TEXT", attachment = null } = parseResult.data;

      // 1. Fetch group
      const group = await Group.findById(groupId);
      if (!group) {
        return socket.emit("group_error", {
          code: "GROUP_NOT_FOUND",
          message: "Target group does not exist.",
        });
      }

      // 2. Fetch sender user and check location freshness
      const user = await User.findById(senderId).select("lastLocation lastLocationAt");
      if (!user || !user.lastLocation?.coordinates || user.lastLocation.coordinates.length < 2) {
        return socket.emit("group_error", {
          code: "LOCATION_REQUIRED",
          message: "A registered location is required to send group messages.",
        });
      }

      if (!isLocationFresh(user.lastLocationAt)) {
        return socket.emit("group_error", {
          code: "LOCATION_STALE",
          message: "Your location is stale or expired. Please update your location.",
        });
      }

      // 3. Re-verify user is within group radius on EVERY send
      const [userLng, userLat] = user.lastLocation.coordinates;
      const inRange = isPointInGroup(userLat, userLng, group);

      if (!inRange) {
        return socket.emit("group_error", {
          code: "OUT_OF_RANGE",
          message: "You are outside this group's active radius.",
        });
      }

      // 4. Save message to MongoDB
      const saved = await Message.create({
        sender: senderId,
        message,
        type,
        attachment,
        groupId,
        isPrivate: false,
      });

      const msgData = {
        _id: saved._id,
        groupId,
        message,
        senderId,
        type: saved.type,
        attachment: saved.attachment,
        timestamp: saved.createdAt,
        isPrivate: false,
      };

      // 5. Broadcast to all members currently in the group room
      io.to(`group:${groupId}`).emit("receive_group_message", msgData);

    } catch (err) {
      console.error("send_group_message error:", err);
      socket.emit("group_error", {
        code: "SERVER_ERROR",
        message: "Failed to send message.",
      });
    }
  });
};