module.exports = (io, socket, onlineUsers) => {

  // Register user — call this right after connecting with the logged-in userId
  socket.on("register_user", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId; // attach for easy lookup on disconnect
    console.log(`User ${userId} registered with socket ${socket.id}`);

    // Broadcast updated online list to everyone
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

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
  socket.on("send_message", (data) => {
    const { roomId, message, sender } = data;

    const msgData = {
      message,
      sender,
      timestamp: new Date(),
    };

    // Broadcast to everyone in the room (including sender)
    io.to(roomId).emit("receive_message", msgData);
  });

};