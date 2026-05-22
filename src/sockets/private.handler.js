const Message = require("./message.model");

module.exports = (io, socket, onlineUsers) => {

  socket.on("send_private_message", async (data) => {
    const { toUserId, message, sender } = data;

    try {
      // ✅ Save to MongoDB
      const saved = await Message.create({
        sender: sender.id,        // must be a real MongoDB ObjectId
        recipient: toUserId,
        message,
        isPrivate: true,
      });

      const msgData = {
        message,
        sender,
        toUserId,
        timestamp: saved.createdAt,
        isPrivate: true,
        _id: saved._id,
      };

      const recipientSocketId = onlineUsers.get(toUserId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receive_private_message", msgData);
      } else {
        socket.emit("private_message_error", {
          toUserId,
          error: "User is offline or not found.",
        });
      }

      // Echo to sender
      socket.emit("receive_private_message", msgData);

    } catch (err) {
      console.error("Failed to save message:", err);
      socket.emit("private_message_error", { error: "Failed to send message." });
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