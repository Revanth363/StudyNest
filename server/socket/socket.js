const { getRedis } = require("../config/redis.js");
const { logger } = require("../utils/logger.js");
const { chatHandler } = require("./handlers/chat.js");
const { roomHandler } = require("./handlers/room.js");
const { presenceHandler } = require("./handlers/presence.js");

const initSocket = (io) => {
  io.use(async (socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error("Authentication error"));
    }
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    logger.socket(`User connected: ${socket.userId}`);
    socket.join(`user:${socket.userId}`);

    presenceHandler(io, socket);
    roomHandler(io, socket);
    chatHandler(io, socket);

    socket.on("disconnect", async () => {
      logger.socket(`User disconnected: ${socket.userId}`);
      const redis = getRedis();
      await redis.del(`online:${socket.userId}`);
      io.emit("user:offline", { userId: socket.userId });
    });
  });
};

module.exports = { initSocket };