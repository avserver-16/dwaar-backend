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
  joinRoom,
  getJoinedRooms,
  getCurrentUser,
} = require("../controllers/user.controller");
const { getNearbyBuildings } = require("../controllers/geolocation.controller");

router.post("/", createUser);
router.post("/check-phone", checkUserByPhone);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUserById);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);

router.post("/logout", authMiddleware, logoutUser);

router.get("/get-location", authMiddleware, getLocation);
router.post("/add-location", authMiddleware, addLocation);
router.post("/nearby-buildings", authMiddleware, getNearbyBuildings);
router.post("/join-room", authMiddleware, joinRoom);
router.get("/joined-rooms", authMiddleware, getJoinedRooms);
module.exports = router;