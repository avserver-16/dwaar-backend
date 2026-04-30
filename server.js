require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io");

const server = http.createServer(app);

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