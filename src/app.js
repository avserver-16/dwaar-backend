
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Message = require("./sockets/message.model");
const userRoutes = require("./routes/user.routes");
const spatialRoutes = require("./routes/spatial.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
connectDB();
app.get("/api/rooms/:roomId/messages", async (req, res) => {
  try {
    const msgs = await Message.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/messages/private/:toUserId", async (req, res) => {
  try {
    const fromUserId = req.headers["x-user-id"];
    const msgs = await Message.find({
      isPrivate: true,
      $or: [
        { sender: fromUserId, recipient: req.params.toUserId },
        { sender: req.params.toUserId, recipient: fromUserId },
      ],
    }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Routes
app.use("/api/users", userRoutes);
app.use("/api/spatial", spatialRoutes);

module.exports = app;