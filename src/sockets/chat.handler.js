module.exports = (io, socket, onlineUsers) => {


  // Join room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Leave room
  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Send message to a room
  const Message = require("./message.model");

  socket.on("send_message", async (data) => {
  try {
    const { roomId, message, sender } = data;

    const saved = await Message.create({
      sender: sender.id,
      message,
      roomId,
      isPrivate: false,
    });

    const msgData = {
      _id: saved._id,
      roomId,
      message,
      sender,
      timestamp: saved.createdAt,
      isPrivate: false,
    };

    io.to(roomId).emit("receive_message", msgData);

  } catch (err) {
    console.error("Failed to save room message:", err);
  }
});

};