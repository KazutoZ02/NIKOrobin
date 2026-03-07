const { Events } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const roleId = member.user.bot ? config.botRoleId : config.userRoleId;
        const type = member.user.bot ? 'Bot' : 'User';

        if (!roleId) {
            console.warn(`[Auto-Role] ${type} role ID is not configured. Skipping for ${member.user.tag}.`);
            return;
        }

        try {
            const role = member.guild.roles.cache.get(roleId);
            if (role) {
                await member.roles.add(role);
                console.log(`[Auto-Role] Assigned ${type} role ${role.name} to ${member.user.tag}`);
            } else {
                console.warn(`[Auto-Role] Failed to find ${type} role with ID ${roleId}.`);
            }
        } catch (error) {
            console.error(`[Auto-Role] Failed to assign role to ${member.user.tag}. Error:`, error);
        }
    },
};
