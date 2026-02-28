const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');

const configurePassport = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DISCORD_CALLBACK_URL,
        scope: ['identify', 'guilds']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find or create user
          let user = await User.findOne({ discordId: profile.id });

          if (user) {
            // Update user info
            user.username = profile.username;
            user.avatar = profile.avatar;
            user.discriminator = profile.discriminator;
            await user.save();
          } else {
            user = await User.create({
              discordId: profile.id,
              username: profile.username,
              avatar: profile.avatar,
              discriminator: profile.discriminator
            });
          }

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
};

module.exports = configurePassport;
