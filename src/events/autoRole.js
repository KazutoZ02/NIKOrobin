// src/events/autoRole.js
const {
    GUILD_ID,
    BOT_ROLE_ID,
    USER_ROLE_ID
} = require('../config');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // Only respond to the configured guild
        if (member.guild.id !== GUILD_ID) return;
        
        // Handle bot role
        if (member.bot && BOT_ROLE_ID) {
            const botRole = member.guild.roles.cache.get(BOT_ROLE_ID);
            if (botRole) {
                try {
                    await member.roles.add(botRole);
                    console.log(`🤖 Added bot role to ${member.user.username}`);
                } catch (error) {
                    console.error(`❌ Failed to add bot role:`, error.message);
                }
            }
            return;
        }
        
        // Handle user role
        if (USER_ROLE_ID) {
            const userRole = member.guild.roles.cache.get(USER_ROLE_ID);
            if (userRole) {
                try {
                    await member.roles.add(userRole);
                    console.log(`✅ Added user role to ${member.user.username}`);
                } catch (error) {
                    console.error(`❌ Failed to add user role:`, error.message);
                }
            }
        }
    }
};
