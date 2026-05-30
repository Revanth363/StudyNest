import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "";
const URL = apiUrl ? apiUrl.replace("/api", "") : window.location.origin;

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(URL, {
    auth: { userId },
    withCredentials: true,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("user:online");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinRoom = (roomId) => {
  if (socket) {
    socket.emit("room:join", { roomId });
  }
};

export const leaveRoom = (roomId) => {
  if (socket) {
    socket.emit("room:leave", { roomId });
  }
};

export const onRoomOnlineUsers = (callback) => {
  if (socket) {
    socket.on("room:online-users", callback);
  }
};

export const offRoomOnlineUsers = () => {
  if (socket) {
    socket.off("room:online-users");
  }
};

export const onUserJoined = (callback) => {
  if (socket) {
    socket.on("room:user-joined", callback);
  }
};

export const offUserJoined = () => {
  if (socket) {
    socket.off("room:user-joined");
  }
};

export const onUserLeft = (callback) => {
  if (socket) {
    socket.on("room:user-left", callback);
  }
};

export const offUserLeft = () => {
  if (socket) {
    socket.off("room:user-left");
  }
};

export const onNotificationNew = (callback) => {
  if (socket) {
    socket.on("notification:new", callback);
  }
};

export const offNotificationNew = () => {
  if (socket) {
    socket.off("notification:new");
  }
};