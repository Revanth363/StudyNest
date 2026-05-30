const express = require('express');
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Config
const { connectDB } = require("./config/db.js");
const { connectRedis } = require("./config/redis.js");
const { connectCloudinary } = require("./config/cloudinary.js");

// Routes
const authRoutes = require("./routes/auth.js");
const roomRoutes = require("./routes/room.js");
const messageRoutes = require("./routes/message.js");
const userRoutes = require("./routes/user.js");
const notificationRoutes = require("./routes/notification.js");
const oauthRoutes = require("./routes/oauth.js");

// Middleware
const { errorMiddleware } = require("./middleware/error.js");
const { securityMiddleware } = require("./middleware/security.js");

// Socket
const { initSocket } = require("./socket/socket.js");
const { setSocketIO } = require("./config/socket.js");

dotenv.config();

// Passport config (Google strategy)
require('./config/passport');
const passport = require('passport');

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Security middleware (helmet, rate limiting)
securityMiddleware(app);

// App middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// passport middleware
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use('/auth', oauthRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "StudyNest server is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error middleware (always last)
app.use(errorMiddleware);

// Initialize socket
setSocketIO(io);
initSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    connectCloudinary();        // sync, no await needed
    
    await new Promise((resolve) => {
      httpServer.listen(PORT, () => {
        console.log(`StudyNest server running on http://localhost:${PORT}`);
        resolve();
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { io };