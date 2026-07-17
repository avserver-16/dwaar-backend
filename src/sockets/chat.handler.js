const Group = require("./group.model");
const Message = require("./message.model");

module.exports = (io, socket, onlineUsers) => {

  // Join a group room
  socket.on("join_group", async (groupId) => {
    try {
      socket.join(`group:${groupId}`);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    } catch (err) {
      console.error(err);
    }
  });

  // Leave a group room
  socket.on("leave_group", (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  // Send a group message
  socket.on("send_group_message", async (data) => {
    try {
      const {
        groupId,
        message,
        sender,
        type = "TEXT",
        attachment = null,
      } = data;

      // Optional: verify sender is a member
      const group = await Group.findOne({
        _id: groupId,
        members: sender.id,
      });

      if (!group) {
        return socket.emit("group_error", {
          message: "You are not a member of this group.",
        });
      }



      const saved = await Message.create({
        sender: sender.id,
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
        sender,
        type: saved.type,
        attachment: saved.attachment,
        timestamp: saved.createdAt,
        isPrivate: false,
      };

      io.to(groupId).emit("receive_group_message", msgData);

    } catch (err) {
      console.error("Failed to save group message:", err);
    }
  });

};