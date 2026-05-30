const jwt = require("jsonwebtoken");

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  // Set token in HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,                                    // JS cannot access it
    secure: process.env.NODE_ENV === "production",     // HTTPS only in prod
    sameSite: "strict",                                // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,                 // 7 days in ms
  });

  return token;
};

module.exports = { generateToken };