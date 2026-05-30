const User = require("../models/User.js");
const Message = require("../models/Message.js");
const { AppError } = require("../middleware/error.js");
const { cloudinary } = require("../config/cloudinary.js");
const Room = require("../models/Room.js");

const buildProfileDetails = async (user) => {
  const [createdRooms, resourcesSharedCount, recentSharedResources] = await Promise.all([
    Room.find({ createdBy: user._id, isActive: true })
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 }),
    Message.countDocuments({ sender: user._id, fileType: { $ne: "none" }, isDeleted: false }),
    Message.find({ sender: user._id, isDeleted: false, fileType: { $ne: "none" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("room", "name topic isPrivate"),
  ]);

  const joinedRooms = Array.isArray(user.roomsJoined) ? user.roomsJoined : [];
  const publicJoinedRooms = joinedRooms.filter((room) => room && !room.isPrivate);
  const privateJoinedRooms = joinedRooms.filter((room) => room && room.isPrivate);

  const recentActivity = [
    ...createdRooms.slice(0, 5).map((room) => ({
      type: "created_room",
      title: `Created room ${room.name}`,
      subtitle: room.isPrivate ? "Private room" : "Public room",
      createdAt: room.createdAt,
      roomId: room._id,
      roomName: room.name,
      roomTopic: room.topic,
    })),
    ...recentSharedResources.map((message) => ({
      type: "shared_resource",
      title: message.fileName || `Shared ${message.fileType.toUpperCase()}`,
      subtitle: message.room ? `in ${message.room.name}` : "in a room",
      createdAt: message.createdAt,
      roomId: message.room?._id || message.room || null,
      roomName: message.room?.name || "",
      roomTopic: message.room?.topic || "",
      fileName: message.fileName || "",
      fileUrl: message.fileUrl || "",
      fileType: message.fileType,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return {
    memberSince: user.createdAt,
    roomsJoinedCount: joinedRooms.length,
    roomsCreatedCount: createdRooms.length,
    resourcesSharedCount,
    publicJoinedRooms,
    privateJoinedRooms,
    createdRooms,
    recentActivity,
  };
};

// @desc    Get user profile by username (public)
// @route   GET /api/users/public/:username
// @access  Public
const getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password")
      .populate("roomsJoined", "name topic isPrivate createdBy createdAt");

    if (!user) return next(new AppError("User not found", 404));

    const profile = await buildProfileDetails(user);

    res.status(200).json({ success: true, user, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("roomsJoined", "name topic isPrivate createdBy createdAt");

    if (!user) return next(new AppError("User not found", 404));

    const profile = await buildProfileDetails(user);

    res.status(200).json({ success: true, user, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile (username, bio)
// @route   PUT /api/users/update
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, bio },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError("No image uploaded", 400));

    const { buffer } = req.file;

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "image", folder: "studynest/avatars" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: uploadResult.secure_url },
      { new: true }
    ).select("-password");

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update study time for user
// @route   PUT /api/users/study-time
// @access  Private
const updateStudyTime = async (req, res, next) => {
  try {
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return next(new AppError("Invalid study time", 400));
    }

    const today = new Date().toISOString().split("T")[0]; // "2025-05-19"

    const user = await User.findById(req.user._id);

    // Update total study time
    user.totalStudyTime += minutes;

    // Update daily log
    const todayLog = user.dailyStudyLog.find((log) => log.date === today);

    if (todayLog) {
      todayLog.minutes += minutes;
    } else {
      user.dailyStudyLog.push({ date: today, minutes });
    }

    await user.save();

    res.status(200).json({
      success: true,
      totalStudyTime: user.totalStudyTime,
      dailyStudyLog: user.dailyStudyLog,
    });
  } catch (error) {
    next(error);
  }
};

const getMyRooms = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "roomsJoined",
      populate: [
        { path: "createdBy", select: "username avatar" },
        { path: "members", select: "username avatar" },
      ],
    });
    res.status(200).json({
      success: true,
      rooms: user.roomsJoined,
      favoriteRoomIds: (user.favoriteRooms || []).map((id) => id.toString()),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Favorite or unfavorite a room for the current user
// @route   POST /api/users/me/rooms/:roomId/favorite
// @access  Private
const favoriteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { favorite } = req.body;

    const room = await Room.findById(roomId).select("members isActive");
    if (!room || !room.isActive) return next(new AppError("Room not found", 404));

    const isMember = (room.members || []).some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) return next(new AppError("You can favorite only joined rooms", 403));

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError("User not found", 404));

    const alreadyFavorite = (user.favoriteRooms || []).some(
      (id) => id.toString() === roomId.toString()
    );

    const shouldFavorite = typeof favorite === "boolean" ? favorite : !alreadyFavorite;

    if (shouldFavorite && !alreadyFavorite) {
      user.favoriteRooms.push(roomId);
    }

    if (!shouldFavorite && alreadyFavorite) {
      user.favoriteRooms = user.favoriteRooms.filter(
        (id) => id.toString() !== roomId.toString()
      );
    }

    await user.save();

    res.status(200).json({
      success: true,
      favoriteRoomIds: (user.favoriteRooms || []).map((id) => id.toString()),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mute or unmute a room for the current user
// @route   POST /api/users/me/rooms/:roomId/mute
// @access  Private
const muteRoom = async (req, res, next) => {
  try {
    const { mute } = req.body; // boolean
    const { roomId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return next(new AppError("User not found", 404));

    if (mute) {
      if (!user.mutedRooms.includes(roomId)) {
        user.mutedRooms.push(roomId);
      }
    } else {
      user.mutedRooms = user.mutedRooms.filter((r) => r.toString() !== roomId.toString());
    }

    await user.save();

    res.status(200).json({ success: true, mutedRooms: user.mutedRooms });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUserByUsername,
  updateProfile,
  updateAvatar,
  updateStudyTime,
  getMyRooms,
  muteRoom,
  favoriteRoom,
};