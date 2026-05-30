const express = require('express');
const passport = require('passport');
const { generateToken } = require('../utils/generateToken.js');

const router = express.Router();

// Redirect user to Google for authentication
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Google callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.CLIENT_URL + '/login', session: false }),
  (req, res) => {
    // req.user is set by passport's verify callback
    if (!req.user) return res.redirect(process.env.CLIENT_URL + '/login');

    // issue JWT cookie
    generateToken(res, req.user._id);

    // redirect to client app
    res.redirect(process.env.CLIENT_URL || '/');
  }
);

module.exports = router;
