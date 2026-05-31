const Message = require("../messages/message.model");
const Group = require("./group.model");

module.exports = (io, socket, onlineUsers) => {

  // Join all groups the user belongs to on connect
  socket.on("join_groups", async (userId) => {
    try {
      const groups = await Group.find({ members: userId }).select("_id");
      groups.forEach(({ _id }) => socket.join(`group:${_id}`));
    } catch (err) {
      console.error("join_groups error:", err);
    }
  });

  // Send a group message
  socket.on("group_message", async ({ groupId, senderId, message }) => {
    try {
      const saved = await Message.create({
        sender: senderId,
        message,
        groupId,
        isPrivate: false,
      });

      const payload = {
        id: saved._id.toString(),
        senderId,
        groupId,
        content: message,
        type: "TEXT",
        createdAt: saved.createdAt,
      };

      // Broadcast to everyone in the group room (including sender)
      io.to(`group:${groupId}`).emit("group_message", payload);
    } catch (err) {
      console.error("group_message error:", err);
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