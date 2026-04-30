module.exports = (io, socket) => {

  // Join room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Send message
  socket.on("send_message", (data) => {
    const { roomId, message, sender } = data;

    const msgData = {
      message,
      sender,
      timestamp: new Date(),
    };

    // Broadcast to room
    io.to(roomId).emit("receive_message", msgData);
  });

};