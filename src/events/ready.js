// src/events/ready.js
const { ActivityType } = require('discord.js');
const { GUILD_ID } = require('../config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`🤖 ${client.user.tag} is online!`);
        console.log(`📌 Bot ID: ${client.user.id}`);
        
        // Set bot status
        client.user.setActivity({
            type: ActivityType.Watching,
            name: BOT_STATUS || "the crew"
        });
        
        // Sync slash commands to specific guild
        try {
            const guild = client.guilds.cache.get(GUILD_ID);
            
            if (guild) {
                // Clear existing commands and sync new ones
                await client.application.commands.set([]);
                
                const commands = client.commands.map(cmd => cmd.data);
                await guild.commands.set(commands);
                
                console.log(`✅ Slash commands synced to guild ${GUILD_ID}`);
            } else {
                console.log(`⚠️ Guild ${GUILD_ID} not found! Bot may not be in the server.`);
            }
        } catch (error) {
            console.error('❌ Error syncing commands:', error);
        }
        
        console.log('🎉 Bot is ready to serve!\n');
    }
};
