const DiscordStrategy = require('passport-discord').Strategy;
const passport = require('passport');
const User = require('../models/User');

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'guilds']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ discordId: profile.id });
      
      if (user) {
        // Update user info
        user.username = profile.username;
        user.avatar = profile.avatar;
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      user = await User.create({
        discordId: profile.id,
        username: profile.username,
        avatar: profile.avatar,
        accessToken,
        refreshToken,
        role: 'user'
      });
      
      return done(null, user);
    } catch (err) {
      console.error('Passport Error:', err);
      return done(err, null);
    }
  }));
};
