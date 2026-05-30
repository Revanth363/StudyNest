const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const getTimestamp = () => new Date().toISOString();

const writeToFile = (level, message) => {
  const logLine = `[${getTimestamp()}] [${level}] ${message}\n`;
  const logFile = path.join(logsDir, "app.log");
  fs.appendFileSync(logFile, logLine, "utf8");
};

const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
    writeToFile("INFO", message);
  },
  error: (message) => {
    console.error(`[ERROR] ${message}`);
    writeToFile("ERROR", message);
  },
  warn: (message) => {
    console.warn(`[WARN] ${message}`);
    writeToFile("WARN", message);
  },
  socket: (message) => {
    console.log(`[SOCKET] ${message}`);
    writeToFile("SOCKET", message);
  },
};

module.exports = { logger };