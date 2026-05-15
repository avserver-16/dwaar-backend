const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  checkUserByPhone,
  deleteUser,
  loginUser,
  logoutUser,
} = require("../controllers/user.controller");

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.post("/check-phone", checkUserByPhone);
router.post("/login", loginUser);
router.delete("/:id", deleteUser);
router.post("/logout", logoutUser);

module.exports = router;