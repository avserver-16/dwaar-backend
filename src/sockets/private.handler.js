module.exports = (io, socket, onlineUsers) => {

  // Send a private message to a specific user
  socket.on("send_private_message", (data) => {
    const { toUserId, message, sender } = data;

    const msgData = {
      message,
      sender,           // { id, name } or whatever your user shape is
      toUserId,
      timestamp: new Date(),
      isPrivate: true,
    };

    const recipientSocketId = onlineUsers.get(toUserId);

    if (recipientSocketId) {
      // Deliver to recipient
      io.to(recipientSocketId).emit("receive_private_message", msgData);
    } else {
      // Recipient is offline — notify sender
      socket.emit("private_message_error", {
        toUserId,
        error: "User is offline or not found.",
      });
    }

    // Echo back to sender so their own UI updates immediately
    socket.emit("receive_private_message", msgData);
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