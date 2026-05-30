const express = require("express");
const {
  createRoom,
  getAllRooms,
  getRoomById,
  joinRoom,
  joinPrivateRoom,
  leaveRoom,
  deleteRoom,
  removeUser,
  assignAdmin,
  removeAdmin,
  reportRoom,
} = require("../controllers/roomController.js");
const { protect } = require("../middleware/auth.js");

const router = express.Router();

router.get("/", protect, getAllRooms);
router.post("/", protect, createRoom);
router.post("/join-private", protect, joinPrivateRoom);
router.get("/:id", protect, getRoomById);
router.post("/:id/join", protect, joinRoom);
router.post("/:id/leave", protect, leaveRoom);
router.post("/:id/report", protect, reportRoom);
router.delete("/:id", protect, deleteRoom);
router.post("/:id/remove-user", protect, removeUser);
router.post("/:id/assign-admin", protect, assignAdmin);
router.post("/:id/remove-admin", protect, removeAdmin);

module.exports = router;