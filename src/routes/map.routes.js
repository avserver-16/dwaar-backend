// routes/map.routes.js

const express = require("express");
const router = express.Router();

const {
  getMap
} = require("../controllers/map.controller");

router.get("/getMap", getMap);
router.get("/test", (req, res) => {
  res.send("Map route working");
});

module.exports = router;