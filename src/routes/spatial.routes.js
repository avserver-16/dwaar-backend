const express = require("express");

const router = express.Router();

const {
    getNearbyBuildings
} = require("../controllers/spatial.controller");

router.post("/nearby", getNearbyBuildings);

module.exports = router;