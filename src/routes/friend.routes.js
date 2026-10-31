const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  blockUser,
  getFriends,
  getPendingRequests,
} = require("../controllers/friend.controller");

router.use(authMiddleware);

router.post("/request/:userId", sendFriendRequest);
router.post("/accept/:requestId", acceptFriendRequest);
router.post("/reject/:requestId", rejectFriendRequest);
router.delete("/:userId", unfriend);
router.post("/block/:userId", blockUser);
router.get("/", getFriends);
router.get("/requests", getPendingRequests);

module.exports = router;
