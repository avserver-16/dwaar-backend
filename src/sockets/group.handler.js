// const Message = require("../messages/message.model");
const Group = require("./group.model");

// module.exports = (io, socket, onlineUsers) => {
module.exports = (io, socket) => {


  // Join all groups the user belongs to on connect
  socket.on("join_groups", async (userId) => {
    try {
      const groups = await Group.find({ members: userId }).select("_id");
      groups.forEach(({ _id }) => socket.join(`group:${_id}`));
    } catch (err) {
      console.error("join_groups error:", err);
    }
  });

  // Typing indicator
  socket.on("group_typing", ({ groupId, userId, isTyping }) => {
    socket.to(`group:${groupId}`).emit("group_typing", { userId, isTyping });
  });

  // Leave group room (client-side request)
  socket.on("leave_group", (groupId) => {
    socket.leave(`group:${groupId}`);
  });
};