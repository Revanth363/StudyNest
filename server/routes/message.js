const express = require("express");
const {
  getMessages,
  getSavedMessages,
  sendMessage,
  uploadFile,
  deleteMessage,
  saveMessage,
  unsaveMessage,
  pinMessage,
  unpinMessage,
  reportMessage,
} = require("../controllers/messageController.js");
const { protect } = require("../middleware/auth.js");
const upload = require("../middleware/upload.js");

const router = express.Router();

router.get("/saved", protect, getSavedMessages);
router.get("/:roomId", protect, getMessages);
router.post("/:roomId", protect, sendMessage);
router.post("/:roomId/upload", protect, upload.single("file"), uploadFile);
router.delete("/:messageId", protect, deleteMessage);
router.post("/:messageId/save", protect, saveMessage);
router.delete("/:messageId/save", protect, unsaveMessage);
router.post("/:messageId/pin", protect, pinMessage);
router.post("/:messageId/unpin", protect, unpinMessage);
router.post("/:messageId/report", protect, reportMessage);

module.exports = router;