const express = require("express");
const { signup, login, logout, getMe } = require("../controllers/authController.js");
const { protect } = require("../middleware/auth.js");
const { authLimiter } = require("../middleware/security.js");

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;