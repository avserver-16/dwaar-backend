require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const userRoutes = require("./routes/user.routes");
const spatialRoutes = require("./routes/spatial.routes");
const mapRoutes = require("./routes/map.routes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/users", userRoutes);
app.use("/api/spatial", spatialRoutes);
app.use("/api/messages", require("./sockets/message.routes"));
app.use("/api/maps", mapRoutes);

module.exports = app;