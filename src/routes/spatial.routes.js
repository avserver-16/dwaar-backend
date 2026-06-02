const express = require("express");
const router = express.Router();

const {
    getNearbyBuildings,
    getNearbyRooms,
} = require("../controllers/spatial.controller");

router.post("/nearby", getNearbyBuildings);
router.post("/nearby-rooms", getNearbyRooms);

module.exports = router;