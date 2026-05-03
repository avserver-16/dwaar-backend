// Map to track online users: userId -> socketId
const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register handlers — pass onlineUsers so both handlers can share it
    require("./chat.handler")(io, socket, onlineUsers);
    require("./private.handler")(io, socket, onlineUsers);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove user from onlineUsers map and notify others
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