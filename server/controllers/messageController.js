const Message = require("../models/Message.js");
const Room = require("../models/Room.js");
const { AppError } = require("../middleware/error.js");
const { cloudinary } = require("../config/cloudinary.js");
const { createNotifications } = require("../utils/notification.js");

// @desc    Get messages for a room
// @route   GET /api/messages/:roomId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { search, mode = "recent", before, limit: limitQuery } = req.query;
    const limit = Math.min(parseInt(limitQuery || "50", 10), 200);

    let filter = { room: roomId, isDeleted: false };

    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    // Initial load: only today + yesterday
    if (mode === "recent") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      filter.createdAt = { $gte: startOfYesterday };
    }

    // Older pagination: load messages older than the current oldest timestamp
    if (mode === "before" && before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    // Query in descending order for efficient pagination, then reverse for chat rendering
    const queried = await Message.find(filter)
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit);

    const messages = queried.reverse();

    let hasMore = false;
    if (messages.length > 0) {
      const oldest = messages[0].createdAt;
      const olderCount = await Message.countDocuments({
        room: roomId,
        isDeleted: false,
        createdAt: { $lt: oldest },
      });
      hasMore = olderCount > 0;
    }

    res.status(200).json({ success: true, messages, hasMore });
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved messages for current user
// @route   GET /api/messages/saved
// @access  Private
const getSavedMessages = async (req, res, next) => {
  try {
    await req.user.populate({
      path: "savedMessages",
      populate: [
        { path: "sender", select: "username avatar" },
        { path: "room", select: "name" },
      ],
    });

    const messages = (req.user.savedMessages || [])
      .filter((message) => message && !message.isDeleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a text message
// @route   POST /api/messages/:roomId
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content) {
      return next(new AppError("Message content is required", 400));
    }

    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      content,
      fileType: "none",
    });

    await message.populate("sender", "username avatar");

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload a file message (image, pdf, txt)
// @route   POST /api/messages/:roomId/upload
// @access  Private
const uploadFile = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!req.file) {
      return next(new AppError("No file uploaded", 400));
    }

    const { mimetype, originalname, buffer } = req.file;

    // Determine file type
    let fileType = "none";
    let resourceType = "raw";

    if (mimetype.startsWith("image/")) {
      fileType = "image";
      resourceType = "image";
    } else if (mimetype === "application/pdf") {
      fileType = "pdf";
    } else if (mimetype === "text/plain") {
      fileType = "txt";
    }

    // Upload to Cloudinary - preserve original filename when possible
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: resourceType,
        folder: "studynest",
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      };
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(buffer);
    });

    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      content: content || "",
      fileUrl: uploadResult.secure_url,
      fileType,
      fileName: originalname,
    });

    await message.populate("sender", "username avatar");
    
    // Update room's updatedAt timestamp for sidebar activity display
    await Room.findByIdAndUpdate(roomId, { updatedAt: new Date() });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("File upload error:", error.message);
    next(error);
  }
};

// @desc    Delete a message (admin or sender)
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) return next(new AppError("Message not found", 404));

    const room = await Room.findById(message.room);

    const isAdmin = room.admins.includes(req.user._id);
    const isSender = message.sender.toString() === req.user._id.toString();

    if (!isAdmin && !isSender) {
      return next(new AppError("Not authorized to delete this message", 403));
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Save a message
// @route   POST /api/messages/:messageId/save
// @access  Private
const saveMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) return next(new AppError("Message not found", 404));

    const user = await req.user.populate("savedMessages");
    const alreadySaved = (user.savedMessages || []).some(
      (savedMessage) => savedMessage._id.toString() === message._id.toString()
    );

    if (!alreadySaved) {
      user.savedMessages.push(message._id);
      await user.save();
    }

    res.status(200).json({ success: true, message: "Message saved" });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsave a message
// @route   DELETE /api/messages/:messageId/save
// @access  Private
const unsaveMessage = async (req, res, next) => {
  try {
    const user = await req.user.populate("savedMessages");
    user.savedMessages = (user.savedMessages || []).filter(
      (savedMessage) => savedMessage._id.toString() !== req.params.messageId
    );
    await user.save();

    res.status(200).json({ success: true, message: "Message unsaved" });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin a message (admin only)
// @route   POST /api/messages/:messageId/pin
// @access  Private
const pinMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) return next(new AppError("Message not found", 404));

    const room = await Room.findById(message.room);

    if (!room.admins.includes(req.user._id)) {
      return next(new AppError("Only admins can pin messages", 403));
    }

    message.isPinned = true;
    await message.save();

    // Add to room's pinnedMessages
    if (!room.pinnedMessages.includes(message._id)) {
      room.pinnedMessages.push(message._id);
      await room.save();
    }

    await createNotifications({
      recipientIds: room.members.filter((memberId) => memberId.toString() !== req.user._id.toString()),
      type: "message_pinned",
      roomId: room._id,
      message: `${req.user.username} pinned a message in ${room.name}`,
    });

    res.status(200).json({ success: true, message: "Message pinned" });
  } catch (error) {
    next(error);
  }
};

// @desc    Unpin a message (admin only)
// @route   POST /api/messages/:messageId/unpin
// @access  Private
const unpinMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) return next(new AppError("Message not found", 404));

    const room = await Room.findById(message.room);

    if (!room.admins.includes(req.user._id)) {
      return next(new AppError("Only admins can unpin messages", 403));
    }

    message.isPinned = false;
    await message.save();

    room.pinnedMessages = room.pinnedMessages.filter(
      (pinnedMessageId) => pinnedMessageId.toString() !== message._id.toString()
    );
    await room.save();

    res.status(200).json({ success: true, message: "Message unpinned" });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a message
// @route   POST /api/messages/:messageId/report
// @access  Private
const reportMessage = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) return next(new AppError("Message not found", 404));

    // Check if already reported by this user
    const alreadyReported = message.reports.some(
      (r) => r.reportedBy.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return next(new AppError("You already reported this message", 400));
    }

    message.reports.push({
      reportedBy: req.user._id,
      reason: reason || "No reason provided",
    });

    await message.save();

    res.status(200).json({ success: true, message: "Message reported" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};