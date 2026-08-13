const Group = require("./group.model");
const Message = require("./message.model");

// module.exports = (io, socket, onlineUsers) => {
module.exports = (io, socket) => {


  // Join a group room
socket.on("join_group", async (groupId) => {
  try {
    const userId = socket.userId;

    const group = await Group.findOne({
      _id: groupId,
      members: userId,
    });

    if (!group) {
      return socket.emit("group_error", {
        message: "You are not a member of this group.",
      });
    }

    socket.join(`group:${groupId}`);

  } catch (err) {
    console.error(err);

    socket.emit("group_error", {
      message: "Unable to join group.",
    });
  }
});

  // Leave a group room
  socket.on("leave_group", (groupId) => {
    socket.leave(`group:${groupId}`);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  // Send a group message
socket.on("send_group_message", async (data) => {
  try {
    const {
      groupId,
      message,
      type = "TEXT",
      attachment = null,
    } = data;

    const senderId = socket.userId;

    const group = await Group.findOne({
      _id: groupId,
      members: senderId,
    });

    if (!group) {
      return socket.emit("group_error", {
        message: "You are not a member of this group.",
      });
    }

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

    io.to(`group:${groupId}`).emit(
      "receive_group_message",
      msgData
    );

  } catch (err) {
    console.error("Failed to save group message:", err);

    socket.emit("group_error", {
      message: "Failed to send message.",
    });
  }
});

};