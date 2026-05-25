require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io");

const server = http.createServer(app);
const conversationRoutes = require("./src/sockets/conversations.routes");

app.use("/api/conversations", conversationRoutes);
const io = new Server(server, {
  cors: {
    origin: "*", // later restrict this
  },
});

// Initialize sockets
require("./src/sockets")(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
