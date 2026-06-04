// routes/map.routes.js

const express = require("express");
const router = express.Router();

const {
  getMap
} = require("../controllers/map.controller");

router.get("/getMap", getMap);

module.exports = router;