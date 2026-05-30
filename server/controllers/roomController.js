const Room = require("../models/Room.js");
const User = require("../models/User.js");
const Message = require("../models/Message.js");
const { AppError } = require("../middleware/error.js");
const { generateRoomCode } = require("../utils/generateRoomCode.js");
const { createNotifications } = require("../utils/notification.js");
const { getRedis } = require("../config/redis.js");

const invalidateUserRoomsCache = async (userId) => {
  try {
    const redis = getRedis();
    let cursor = "0";
    do {
      const res = await redis.scan(cursor, { MATCH: `user:${userId}:rooms*`, COUNT: 100 });
      const nextCursor = Array.isArray(res) ? res[0] : res.cursor || "0";
      const keys = Array.isArray(res) ? res[1] : res.keys || [];
      cursor = nextCursor;
      if (keys && keys.length) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
    } while (cursor !== "0");
  } catch (err) {
    // ignore cache errors
  }
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res, next) => {
  try {
    const { name, description, topic, isPrivate } = req.body;

    if (!name || !topic) {
      return next(new AppError("Name and topic are required", 400));
    }

    // Generate room code only for private rooms
    const roomCode = isPrivate ? generateRoomCode() : undefined;

    const room = await Room.create({
      name,
      description,
      topic,
      isPrivate: isPrivate || false,
      roomCode,
      createdBy: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
    });

    // Add room to user's roomsJoined
    await User.findByIdAndUpdate(req.user._id, {
      $push: { roomsJoined: room._id },
    });

    try { await invalidateUserRoomsCache(req.user._id); } catch (e) {}

    const populatedRoom = await Room.findById(room._id)
      .populate("createdBy", "username avatar")
      .populate("members", "username avatar")
      .populate("admins", "username avatar");

    res.status(201).json({ success: true, room: populatedRoom });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public rooms
// @route   GET /api/rooms
// @access  Private
const getAllRooms = async (req, res, next) => {
  try {
    const { topic, search } = req.query;
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    let filter = { isPrivate: false, isActive: true };

    if (topic) filter.topic = topic;

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const rooms = await Room.find(filter)
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Room.countDocuments(filter);

    res.status(200).json({ success: true, rooms, page, limit, total });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Private
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("createdBy", "username avatar")
      .populate("members", "username avatar")
      .populate("admins", "username avatar")
      .populate("pinnedMessages");

    if (!room) {
      return next(new AppError("Room not found", 404));
    }

    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a public room
// @route   POST /api/rooms/:id/join
// @access  Private
const joinRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return next(new AppError("Room not found", 404));
    if (room.isPrivate) return next(new AppError("This is a private room. Use room code to join", 400));

    // Already a member
    if (room.members.includes(req.user._id)) {
      const populatedRoom = await Room.findById(room._id)
        .populate("createdBy", "username avatar")
        .populate("members", "username avatar")
        .populate("admins", "username avatar");
      return res.status(200).json({ success: true, message: "Already a member", room: populatedRoom });
    }

    room.members.push(req.user._id);
    await room.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { roomsJoined: room._id },
    });

    try { await invalidateUserRoomsCache(req.user._id); } catch (e) {}

    await createNotifications({
      recipientIds: room.admins.filter((adminId) => adminId.toString() !== req.user._id.toString()),
      type: "user_joined",
      roomId: room._id,
      message: `${req.user.username} joined ${room.name}`,
    });

    const populatedRoom = await Room.findById(room._id)
      .populate("createdBy", "username avatar")
      .populate("members", "username avatar")
      .populate("admins", "username avatar");

    res.status(200).json({ success: true, message: "Joined room successfully", room: populatedRoom });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a private room using room code
// @route   POST /api/rooms/join-private
// @access  Private
const joinPrivateRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) return next(new AppError("Room code is required", 400));

    const room = await Room.findOne({ roomCode, isActive: true });

    if (!room) return next(new AppError("Invalid room code", 404));

    // Already a member
    if (room.members.includes(req.user._id)) {
      const populatedRoom = await Room.findById(room._id)
        .populate("createdBy", "username avatar")
        .populate("members", "username avatar")
        .populate("admins", "username avatar");
      return res.status(200).json({ success: true, message: "Already a member", room: populatedRoom });
    }

    room.members.push(req.user._id);
    await room.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { roomsJoined: room._id },
    });

    try { await invalidateUserRoomsCache(req.user._id); } catch (e) {}

    await createNotifications({
      recipientIds: room.admins.filter((adminId) => adminId.toString() !== req.user._id.toString()),
      type: "user_joined",
      roomId: room._id,
      message: `${req.user.username} joined ${room.name}`,
    });

    const populatedRoom = await Room.findById(room._id)
      .populate("createdBy", "username avatar")
      .populate("members", "username avatar")
      .populate("admins", "username avatar");

    res.status(200).json({ success: true, message: "Joined private room successfully", room: populatedRoom });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a room
// @route   POST /api/rooms/:id/leave
// @access  Private
const leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return next(new AppError("Room not found", 404));

    // Creator cannot leave
    if (room.createdBy.toString() === req.user._id.toString()) {
      return next(new AppError("Room creator cannot leave. Delete the room instead.", 400));
    }

    room.members = room.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );

    // Remove from admins too if they were one
    room.admins = room.admins.filter(
      (admin) => admin.toString() !== req.user._id.toString()
    );

    await room.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { roomsJoined: room._id, favoriteRooms: room._id },
    });

    try { await invalidateUserRoomsCache(req.user._id); } catch (e) {}

    res.status(200).json({ success: true, message: "Left room successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a room (admin only)
// @route   DELETE /api/rooms/:id
// @access  Private
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return next(new AppError("Room not found", 404));

    // Only creator can delete
    if (room.createdBy.toString() !== req.user._id.toString()) {
      return next(new AppError("Only room creator can delete this room", 403));
    }

    room.isActive = false;
    await room.save();

    // invalidate cache for all members (best-effort)
    try {
      const memberIds = room.members || [];
      await Promise.all(memberIds.map((id) => invalidateUserRoomsCache(id)));
    } catch (e) {}

    res.status(200).json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a user from room (admin only)
// @route   POST /api/rooms/:id/remove-user
// @access  Private
const removeUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return next(new AppError("Room not found", 404));

    // Check if requester is admin
    if (!room.admins.includes(req.user._id)) {
      return next(new AppError("Only admins can remove users", 403));
    }

    // Cannot remove another admin
    if (room.admins.includes(userId)) {
      return next(new AppError("Cannot remove another admin", 400));
    }

    room.members = room.members.filter((m) => m.toString() !== userId);
    await room.save();

    await User.findByIdAndUpdate(userId, {
      $pull: { roomsJoined: room._id, favoriteRooms: room._id },
    });

    try { await invalidateUserRoomsCache(userId); } catch (e) {}

    await createNotifications({
      recipientIds: [userId],
      type: "removed_from_room",
      roomId: room._id,
      message: `You were removed from ${room.name}`,
    });

    res.status(200).json({ success: true, message: "User removed from room" });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign admin to a user (admin only)
// @route   POST /api/rooms/:id/assign-admin
// @access  Private
const assignAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return next(new AppError("Room not found", 404));

    if (!room.admins.includes(req.user._id)) {
      return next(new AppError("Only admins can assign admin role", 403));
    }

    if (room.admins.includes(userId)) {
      return next(new AppError("User is already an admin", 400));
    }

    room.admins.push(userId);
    await room.save();

    await createNotifications({
      recipientIds: [userId],
      type: "made_admin",
      roomId: room._id,
      message: `You were made admin in ${room.name}`,
    });

    res.status(200).json({ success: true, message: "Admin assigned successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove admin role from a user (admin only)
// @route   POST /api/rooms/:id/remove-admin
// @access  Private
const removeAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return next(new AppError("Room not found", 404));

    if (!room.admins.includes(req.user._id)) {
      return next(new AppError("Only admins can remove admin role", 403));
    }

    if (room.createdBy.toString() === userId) {
      return next(new AppError("Room creator cannot be removed from admins", 400));
    }

    if (!room.admins.includes(userId)) {
      return next(new AppError("User is not an admin", 400));
    }

    room.admins = room.admins.filter((adminId) => adminId.toString() !== userId);
    await room.save();

    res.status(200).json({ success: true, message: "Admin role removed successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a room
// @route   POST /api/rooms/:id/report
// @access  Private
const reportRoom = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return next(new AppError("Room not found", 404));

    const alreadyReported = (room.reports || []).some(
      (r) => r.reportedBy.toString() === req.user._id.toString()
    );

    if (alreadyReported) return next(new AppError("You already reported this room", 400));

    room.reports = room.reports || [];
    room.reports.push({ reportedBy: req.user._id, reason: reason || "" });
    await room.save();

    // Notify admins (excluding reporter)
    await createNotifications({
      recipientIds: room.admins.filter((a) => a.toString() !== req.user._id.toString()),
      type: "room_report",
      roomId: room._id,
      message: `${req.user.username} reported ${room.name}`,
    });

    res.status(200).json({ success: true, message: "Room reported" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

