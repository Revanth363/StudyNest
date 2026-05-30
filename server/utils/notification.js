const Notification = require("../models/Notification.js");
const User = require("../models/User.js");
const { getSocketIO } = require("../config/socket.js");

const createNotifications = async ({ recipientIds = [], type, roomId, message }) => {
  const uniqueRecipients = [...new Set(recipientIds.map((id) => id.toString()))];

  if (!uniqueRecipients.length) return [];

  // Respect per-user mute preferences — skip recipients who muted this room
  let finalRecipients = uniqueRecipients;
  if (roomId) {
    const users = await User.find({ _id: { $in: uniqueRecipients } }).select("mutedRooms");
    finalRecipients = users
      .filter((u) => !(u.mutedRooms || []).some((r) => r.toString() === roomId.toString()))
      .map((u) => u._id.toString());
  }

  if (!finalRecipients.length) return [];

  const notifications = await Notification.insertMany(
    finalRecipients.map((recipient) => ({
      recipient,
      type,
      room: roomId,
      message,
    }))
  );

  const io = getSocketIO();
  if (io) {
    notifications.forEach((notification) => {
      io.to(`user:${notification.recipient.toString()}`).emit("notification:new", notification);
    });
  }

  return notifications;
};

module.exports = { createNotifications };