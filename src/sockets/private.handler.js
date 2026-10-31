const Message = require("./message.model");
const Friendship = require("../models/Friendship");
const { sendPrivateMessageSchema, privateTypingSchema } = require("../utils/validators");

module.exports = (io, socket, onlineUsers) => {
  /**
   * Send a private 1-on-1 message (Friends only)
   */
  socket.on("send_private_message", async (data) => {
    const senderId = socket.userId;

    try {
      // Validate payload with Zod
      const parseResult = sendPrivateMessageSchema.safeParse(data);
      if (!parseResult.success) {
        return socket.emit("private_message_error", {
          code: "VALIDATION_ERROR",
          error: "Invalid message payload.",
          details: parseResult.error.format(),
        });
      }

      const { toUserId, message, type = "TEXT", attachment = null } = parseResult.data;

      if (toUserId === senderId) {
        return socket.emit("private_message_error", {
          code: "SELF_MESSAGE_NOT_ALLOWED",
          error: "You cannot send private messages to yourself.",
        });
      }

      // Check Friendship relationship
      const relationship = await Friendship.getRelationship(senderId, toUserId);

      if (!relationship || relationship.status !== "accepted") {
        if (relationship?.status === "blocked") {
          return socket.emit("private_message_error", {
            code: "BLOCKED",
            error: "You cannot message this user because a block is in place.",
          });
        }
        return socket.emit("private_message_error", {
          code: "NOT_FRIENDS",
          error: "You can only message friends.",
        });
      }

      // Save message to MongoDB
      const saved = await Message.create({
        sender: senderId,
        recipient: toUserId,
        message,
        type,
        attachment,
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

      // Multi-device delivery: emit to all recipient sockets and all sender sockets via user rooms
      io.to(`user:${toUserId}`).emit("receive_private_message", msgData);
      io.to(`user:${senderId}`).emit("receive_private_message", msgData);

    } catch (err) {
      console.error("send_private_message error:", err);
      socket.emit("private_message_error", {
        code: "SERVER_ERROR",
        error: "Failed to send message.",
      });
    }
  });

  /**
   * Typing indicator for private chat (Friends only)
   * Identity derived exclusively from socket.userId (cannot be spoofed)
   */
  socket.on("private_typing", async (data) => {
    try {
      const fromUserId = socket.userId;

      // Validate payload with Zod (accepts data.toUserId and data.isTyping, ignores data.fromUserId)
      const parseResult = privateTypingSchema.safeParse(data);
      if (!parseResult.success) return;

      const { toUserId, isTyping } = parseResult.data;

      // Verify friendship status before forwarding typing event
      const areFriends = await Friendship.areFriends(fromUserId, toUserId);
      if (!areFriends) return;

      // Emit to recipient's personal room
      io.to(`user:${toUserId}`).emit("private_typing", {
        fromUserId,
        isTyping: !!isTyping,
      });
    } catch (err) {
      console.error("private_typing error:", err);
    }
  });

  /**
   * Fetch list of currently online users
   */
  socket.on("get_online_users", () => {
    socket.emit("online_users", Array.from(onlineUsers.keys()));
  });
};