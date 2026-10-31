const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const server = http.createServer(app);

const conversationRoutes = require("./src/sockets/conversations.routes");
app.use("/api/conversations", conversationRoutes);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL === "*"
      ? "*"
      : process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

// Provide io instance to Express app for REST route triggers
app.set("io", io);

// Redis Adapter setup (enabled when REDIS_URL is provided, fallback to memory)
if (process.env.REDIS_URL) {
  try {
    const { createClient } = require("redis");
    const { createAdapter } = require("@socket.io/redis-adapter");

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO connected to Redis adapter at", process.env.REDIS_URL);
      })
      .catch((err) => {
        console.warn("Failed to connect Redis adapter, falling back to in-memory adapter:", err.message);
      });
  } catch (err) {
    console.warn("Redis dependencies not loaded, falling back to in-memory adapter:", err.message);
  }
}

// Authentication middleware: validates JWT from handshake.auth.token
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Invalid or expired token", { cause: error }));
  }
});

// Initialize socket modules
require("./src/sockets")(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

module.exports = { app, server, io };