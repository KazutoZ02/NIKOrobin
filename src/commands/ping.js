// src/commands/ping.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const {
    GUILD_ID,
    BANNER_IMAGE,
    imageExists
} = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency'),
    
    async execute(interaction) {
        // Only respond in the configured guild
        if (interaction.guildId !== GUILD_ID) {
            return interaction.reply({
                content: '⚠️ This bot is only available in the designated server!',
                ephemeral: true
            });
        }
        
        // Calculate ping
        const latency = Math.round(interaction.client.ws.ping);
        const timestamp = Date.now();
        
        // Determine ping quality
        let quality, color;
        if (latency < 100) {
            quality = '🟢 Excellent';
            color = 0x00ff00;
        } else if (latency < 200) {
            quality = '🟡 Good';
            color = 0xffff00;
        } else if (latency < 400) {
            quality = '🟠 Fair';
            color = 0xffa500;
        } else {
            quality = '🔴 Poor';
            color = 0xff0000;
        }
        
        // Create embed
        const embed = {
            title: '🏓 Pong!',
            description: `**${quality}**`,
            color: color,
            fields: [
                {
                    name: '📡 Websocket Latency',
                    value: `\`${latency}ms\``,
                    inline: true
                },
                {
                    name: '⏱️ Response Time',
                    value: `\`${Date.now() - timestamp}ms\``,
                    inline: true
                }
            ],
            footer: {
                text: "Niko Robin's Crew",
                icon_url: interaction.client.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };
        
        // Check if banner image exists
        const hasBanner = imageExists(BANNER_IMAGE);
        
        if (hasBanner) {
            const attachment = new AttachmentBuilder(BANNER_IMAGE, { name: 'banner.jpg' });
            embed.image = { url: 'attachment://banner.jpg' };
            
            await interaction.reply({
                embeds: [embed],
                files: [attachment]
            });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
