const crypto = require("crypto");

const generateRoomCode = () => {
  // Generates a clean 8-character uppercase code e.g. "A3F9KZ2M"
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

module.exports = { generateRoomCode };