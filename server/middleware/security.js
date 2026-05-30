const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per window
  message: {
    message: "Too many attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200,
  message: {
    message: "Too many requests, please slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const securityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Apply general rate limiter to all routes
  app.use(generalLimiter);
};

module.exports = { authLimiter, generalLimiter, securityMiddleware };