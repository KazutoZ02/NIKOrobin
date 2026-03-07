require('dotenv').config();

const config = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
  supportRoleId: process.env.SUPPORT_ROLE_ID,
  userRoleId: process.env.USER_ROLE_ID,
  botRoleId: process.env.BOT_ROLE_ID,
  renderExternalUrl: process.env.RENDER_EXTERNAL_URL,
  port: process.env.PORT || 3000
};

// Validate critical config setup
if (!config.discordToken) {
  console.warn("WARNING: DISCORD_TOKEN is missing from your environment variables.");
}

module.exports = config;
