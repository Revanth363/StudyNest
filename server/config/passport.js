const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.js');
const crypto = require('crypto');

// Configure Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) return done(null, false, { message: 'No email from Google' });

        let user = await User.findOne({ email });
        if (!user) {
          // derive a safe username from displayName or email prefix
          const base = (profile.displayName || email.split('@')[0]).replace(/\s+/g, '').toLowerCase().slice(0, 18);
          let username = base;
          let counter = 0;
          while (await User.findOne({ username })) {
            counter += 1;
            username = `${base}${counter}`;
          }

          // create a random password since local login may not be used
          const randomPwd = crypto.randomBytes(16).toString('hex');

          user = await User.create({
            username,
            email,
            password: randomPwd,
            avatar: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
