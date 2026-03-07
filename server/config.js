require('dotenv').config();

const config = {
  discordToken: (process.env.DISCORD_TOKEN || '').trim(),
  clientId: (process.env.CLIENT_ID || '').trim(),
  guildId: (process.env.GUILD_ID || '').trim(),
  ticketCategoryId: (process.env.TICKET_CATEGORY_ID || '').trim(),
  supportRoleId: (process.env.SUPPORT_ROLE_ID || '').trim(),
  userRoleId: (process.env.USER_ROLE_ID || '').trim(),
  botRoleId: (process.env.BOT_ROLE_ID || '').trim(),
  renderExternalUrl: (process.env.RENDER_EXTERNAL_URL || '').trim(),
  port: process.env.PORT || 3000
};

module.exports = config;
