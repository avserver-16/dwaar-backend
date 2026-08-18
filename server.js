require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { Server } = require("socket.io");

const server = http.createServer(app);

const conversationRoutes = require("./src/sockets/conversations.routes");
app.use("/api/conversations", conversationRoutes);

const jwt = require("jsonwebtoken");

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL === '*'
      ? '*'
      : process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'],
    methods: ["GET", "POST"],
  },
});

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

// Initialize sockets
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

startServer();