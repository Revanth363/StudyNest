const express = require("express");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllNotificationsRead);
router.put("/:id/read", protect, markNotificationRead);

module.exports = router;