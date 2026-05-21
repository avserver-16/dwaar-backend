// Map to track online users: userId -> socketId
const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    require("./chat.handler")(io, socket, onlineUsers);
    require("./private.handler")(io, socket, onlineUsers);

    socket.on("register_user", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`✅ Registered: ${userId} → ${socket.id}`);
      console.log(`📋 Online users:`, Array.from(onlineUsers.entries()));
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("user_offline", { userId });
          break;
        }
      }
    });
  });
};
