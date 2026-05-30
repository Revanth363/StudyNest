const Message = require("../../models/Message.js");
const User = require("../../models/User.js");
const Room = require("../../models/Room.js");
const { createNotifications } = require("../../utils/notification.js");

const chatHandler = (io, socket) => {
  socket.on("message:send", async ({ roomId, content, messageId }) => {
    try {
      let message;

      if (messageId) {
        // File upload case - message already created, just broadcast it
        message = await Message.findById(messageId).populate("sender", "username avatar");
      } else {
        // Text message case - create new message
        message = await Message.create({
          room: roomId,
          sender: socket.userId,
          content,
          fileType: "none",
        });

        await message.populate("sender", "username avatar");
      }
      
      // Update room's updatedAt timestamp for sidebar activity display
      await Room.findByIdAndUpdate(roomId, { updatedAt: new Date() });

      io.to(roomId).emit("message:receive", { message });
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("message:delete", async ({ messageId, roomId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { isDeleted: true });
      io.to(roomId).emit("message:deleted", { messageId });
    } catch (error) {
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  socket.on("message:pin", async ({ messageId, roomId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { isPinned: true });
      const room = await Room.findById(roomId);
      const user = await User.findById(socket.userId).select("username");

      if (room && user) {
        await createNotifications({
          recipientIds: room.members.filter(
            (memberId) => memberId.toString() !== socket.userId.toString()
          ),
          type: "message_pinned",
          roomId: room._id,
          message: `${user.username} pinned a message in ${room.name}`,
        });
      }

      io.to(roomId).emit("message:pinned", { messageId });
    } catch (error) {
      socket.emit("error", { message: "Failed to pin message" });
    }
  });

  socket.on("message:unpin", async ({ messageId, roomId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { isPinned: false });
      const room = await Room.findById(roomId);

      if (room) {
        room.pinnedMessages = room.pinnedMessages.filter(
          (pinnedMessageId) => pinnedMessageId.toString() !== messageId
        );
        await room.save();
      }

      io.to(roomId).emit("message:unpinned", { messageId });
    } catch (error) {
      socket.emit("error", { message: "Failed to unpin message" });
    }
  });

  socket.on("typing:start", ({ roomId }) => {
    socket.to(roomId).emit("typing:start", { userId: socket.userId });
  });

  socket.on("typing:stop", ({ roomId }) => {
    socket.to(roomId).emit("typing:stop", { userId: socket.userId });
  });
};

module.exports = { chatHandler };