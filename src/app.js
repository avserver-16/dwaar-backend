require("dotenv").config();

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/user.routes");
const spatialRoutes = require("./routes/spatial.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/spatial", spatialRoutes);
app.use("/api/messages", require("./sockets/message.routes"));
app.use("/api/groups", require("./sockets/group.routes"));
app.use("/api/upload", uploadRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Scalar API documentation
if (process.env.NODE_ENV !== "test") {
  const openapi = require("./config/openapi");

  import("@scalar/express-api-reference").then(
    ({ apiReference }) => {
      app.use(
        "/docs",
        apiReference({
          spec: {
            content: openapi,
          },
        })
      );
    }
  );
}

module.exports = app;