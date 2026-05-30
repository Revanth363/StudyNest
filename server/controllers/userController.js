const User = require("../models/User.js");
const Message = require("../models/Message.js");
const { AppError } = require("../middleware/error.js");
const { cloudinary } = require("../config/cloudinary.js");
const Room = require("../models/Room.js");
const { getRedis } = require("../config/redis.js");

const invalidateUserRoomsCache = async (userId) => {
  try {
    const redis = getRedis();
    let cursor = "0";
    do {
      const res = await redis.scan(cursor, { MATCH: `user:${userId}:rooms*`, COUNT: 100 });
      // res can be [nextCursor, keys]
      const nextCursor = Array.isArray(res) ? res[0] : res.cursor || "0";
      const keys = Array.isArray(res) ? res[1] : res.keys || [];
      cursor = nextCursor;
      if (keys && keys.length) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
    } while (cursor !== "0");
  } catch (err) {
    // ignore
  }
};

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
    // Support pagination (page, limit) and server-side caching in Redis
    const page = parseInt(req.query.page || "1", 10);
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const cacheKey = `user:${req.user._id}:rooms:page:${page}:limit:${limit}`;

    try {
      const redis = getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        const payload = typeof cached === "string" ? JSON.parse(cached) : cached;
        return res.status(200).json({ success: true, ...payload });
      }
    } catch (err) {
      // Redis cache miss or unavailable; continue without failing
    }

    // Load only necessary fields and limit member previews to speed up response
    const userDoc = await User.findById(req.user._id).select("roomsJoined favoriteRooms").lean();
    const roomIds = Array.isArray(userDoc?.roomsJoined) ? userDoc.roomsJoined : [];

    const skip = (page - 1) * limit;
    const pagedRoomIds = roomIds.slice(skip, skip + limit);

    // Fetch room documents with minimal fields and only a preview of members (perDocumentLimit)
    const roomsFound = await Room.find({ _id: { $in: pagedRoomIds }, isActive: true })
      .select("name topic isPrivate createdBy admins members description updatedAt createdAt")
      .populate("createdBy", "username avatar")
      .populate({ path: "members", select: "username avatar", perDocumentLimit: 3 })
      .lean();

    // Preserve order from user's roomsJoined slice
    const roomsMap = new Map(roomsFound.map((r) => [r._id.toString(), r]));
    const orderedRooms = pagedRoomIds.map((id) => roomsMap.get(id.toString())).filter(Boolean);

    const payload = {
      rooms: orderedRooms,
      favoriteRoomIds: (userDoc.favoriteRooms || []).map((id) => id.toString()),
      page,
      limit,
      total: roomIds.length,
    };

    try {
      const redis = getRedis();
      // cache for short duration
      await redis.set(cacheKey, JSON.stringify(payload), { ex: 120 });
    } catch (err) {
      // ignore caching errors
    }

    return res.status(200).json({ success: true, ...payload });
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

    // Invalidate cached rooms for this user
    try {
      await invalidateUserRoomsCache(req.user._id);
    } catch (err) {
      // ignore
    }

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