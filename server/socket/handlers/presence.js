const { getRedis } = require("../../config/redis.js");

const presenceHandler = (io, socket) => {
  socket.on("user:online", async () => {
    const redis = getRedis();
    await redis.set(`online:${socket.userId}`, "true", { ex: 3600 });
    io.emit("user:online", { userId: socket.userId });
  });

  socket.on("user:status", async ({ userId }) => {
    const redis = getRedis();
    const isOnline = await redis.get(`online:${userId}`);
    socket.emit("user:status:response", {
      userId,
      isOnline: !!isOnline,
    });
  });
};

module.exports = { presenceHandler };