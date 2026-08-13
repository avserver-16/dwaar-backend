const Message = require("./message.model");

module.exports = (io, socket, onlineUsers) => {

  socket.on("send_private_message", async (data) => {
  const { toUserId, message } = data;

  const senderId = socket.userId;

  try {
    const saved = await Message.create({
      sender: senderId,
      recipient: toUserId,
      message,
      isPrivate: true,
    });

    const msgData = {
      _id: saved._id,
      message,
      senderId,
      toUserId,
      timestamp: saved.createdAt,
      isPrivate: true,
      type: saved.type,
      attachment: saved.attachment,
    };

    const recipientSocketId = onlineUsers.get(toUserId);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit(
        "receive_private_message",
        msgData
      );
    }

    socket.emit(
      "receive_private_message",
      msgData
    );

  } catch (err) {
    console.error(err);

    socket.emit("private_message_error", {
      error: "Failed to send message.",
    });
  }
});


  // Typing indicator for private chat
  socket.on("private_typing", ({ toUserId, fromUserId, isTyping }) => {
    const recipientSocketId = onlineUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("private_typing", { fromUserId, isTyping });
    }
  });

  // Fetch list of currently online users on demand
  socket.on("get_online_users", () => {
    socket.emit("online_users", Array.from(onlineUsers.keys()));
  });

};