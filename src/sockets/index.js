// Map to track online users: userId -> Set<socketId> (multi-device support)
const onlineUsers = new Map();
const User = require("../models/User");
const Group = require("./group.model");
const { isLocationFresh, findGroupsContainingPoint } = require("../utils/geo.utils");

module.exports = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: socket ${socket.id} (userId: ${userId})`);

    // 1. Join personal room for multi-device message delivery
    socket.join(`user:${userId}`);

    // 2. Multi-device presence tracking: Set of sockets per user
    let userSockets = onlineUsers.get(userId);
    const isFirstSocket = !userSockets || userSockets.size === 0;

    if (!userSockets) {
      userSockets = new Set();
      onlineUsers.set(userId, userSockets);
    }
    userSockets.add(socket.id);

    // 3. Auto-broadcast online_users if this is the user's first active connection
    if (isFirstSocket) {
      io.emit("online_users", Array.from(onlineUsers.keys()));
    }

    // 4. Auto-rejoin eligible group rooms on connect/reconnect using stored fresh location
    try {
      const user = await User.findById(userId).select("lastLocation lastLocationAt");
      if (
        user?.lastLocation?.coordinates &&
        user.lastLocation.coordinates.length === 2 &&
        isLocationFresh(user.lastLocationAt)
      ) {
        const [lng, lat] = user.lastLocation.coordinates;
        const eligibleGroups = await findGroupsContainingPoint(lng, lat, Group);
        eligibleGroups.forEach((g) => socket.join(`group:${g._id}`));
        socket.emit("groups_updated", {
          joined: eligibleGroups.map((g) => g._id.toString()),
          left: [],
        });
      }
    } catch (err) {
      console.error("Auto-joining groups on connect error:", err);
    }

    // 5. Mount socket handlers
    require("./private.handler")(io, socket, onlineUsers);
    require("./group.handler")(io, socket, onlineUsers);
    require("./chat.handler")(io, socket, onlineUsers);

    // 6. Explicit register_user event (idempotent, for backwards compatibility)
    socket.on("register_user", () => {
      socket.join(`user:${userId}`);
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set([socket.id]));
      } else {
        onlineUsers.get(userId).add(socket.id);
      }
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    // 7. Disconnect handler: cleanup socket and only emit user_offline if last socket disconnected
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id} (userId: ${userId})`);
      if (onlineUsers.has(userId)) {
        const sockets = onlineUsers.get(userId);
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("user_offline", { userId });
        }
      }
    });
  });

  return { onlineUsers };
};
