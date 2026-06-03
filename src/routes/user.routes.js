const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  checkUserByPhone,
  deleteUser,
  loginUser,
  logoutUser,
  refreshToken,
  addLocation,
  getLocation,
} = require("../controllers/user.controller");
const { getNearbyBuildings } = require("../controllers/geolocation.controller");

router.post("/", createUser);
router.get("/", getUsers);
router.get("/get-location", authMiddleware, getLocation);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.post("/check-phone", checkUserByPhone);
router.post("/login", loginUser);
router.delete("/:id", deleteUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshToken);
router.post(
  "/add-location",
  authMiddleware,
  addLocation
);
router.post(
  "/nearby-buildings",
  authMiddleware,
  getNearbyBuildings
);
const { joinRoom, getJoinedRooms } = require("../controllers/user.controller");

router.post(
  "/join-room",
  authMiddleware,
  joinRoom
);
router.get(
  "/joined-rooms",
  authMiddleware,
  getJoinedRooms
);
module.exports = router;