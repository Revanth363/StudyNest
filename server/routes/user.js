const express = require("express");
const {
  getUserProfile,
  getUserByUsername,
  updateProfile,
  updateAvatar,
  updateStudyTime,
  getMyRooms,
  muteRoom,
  favoriteRoom,
} = require("../controllers/userController.js");
const { protect } = require("../middleware/auth.js");
const upload = require("../middleware/upload.js");

const router = express.Router();

// Public route - get user by username
router.get("/public/:username", getUserByUsername);

// Protected routes
router.get("/:id", protect, getUserProfile);
router.put("/update", protect, updateProfile);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/study-time", protect, updateStudyTime);
router.get("/me/rooms", protect, getMyRooms);
router.post("/me/rooms/:roomId/mute", protect, muteRoom);
router.post("/me/rooms/:roomId/favorite", protect, favoriteRoom);

module.exports = router;