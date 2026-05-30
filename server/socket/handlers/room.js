const { getRedis } = require("../../config/redis.js");

const roomHandler = (io, socket) => {
  socket.on("room:join", async ({ roomId }) => {
    socket.join(roomId);

    const redis = getRedis();
    await redis.sadd(`room:${roomId}:online`, socket.userId);

    const onlineUsers = await redis.smembers(`room:${roomId}:online`);

    io.to(roomId).emit("room:online-users", { roomId, onlineUsers });

    socket.to(roomId).emit("room:user-joined", {
      userId: socket.userId,
      roomId,
    });
  });

  socket.on("room:leave", async ({ roomId }) => {
    socket.leave(roomId);

    const redis = getRedis();
    await redis.srem(`room:${roomId}:online`, socket.userId);

    const onlineUsers = await redis.smembers(`room:${roomId}:online`);

    io.to(roomId).emit("room:online-users", { roomId, onlineUsers });

    socket.to(roomId).emit("room:user-left", {
      userId: socket.userId,
      roomId,
    });
  });

  socket.on("disconnecting", async () => {
    const redis = getRedis();
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        await redis.srem(`room:${roomId}:online`, socket.userId);
        const onlineUsers = await redis.smembers(`room:${roomId}:online`);
        io.to(roomId).emit("room:online-users", { roomId, onlineUsers });
      }
    }
  });
};

module.exports = { roomHandler };