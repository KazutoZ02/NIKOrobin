// src/events/guildMemberAdd.js
const { ChannelType, AttachmentBuilder } = require('discord.js');
const {
    GUILD_ID,
    WELCOME_CHANNEL_ID,
    WELCOME_IMAGE,
    imageExists
} = require('../config');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // Only respond to the configured guild
        if (member.guild.id !== GUILD_ID) return;
        
        // Skip bots (handled in auto role)
        if (member.bot) return;
        
        const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
        
        if (!channel) {
            console.log(`⚠️ Welcome channel ${WELCOME_CHANNEL_ID} not found`);
            return;
        }
        
        // Create welcome embed
        const embed = {
            title: '🌊 Welcome Aboard!',
            description: `Welcome **${member.user.username}** to the server! We're glad to have you here.`,
            color: 0x00ff00,
            thumbnail: {
                url: member.user.displayAvatarURL({ dynamic: true })
            },
            footer: {
                text: "Niko Robin's Crew",
                icon_url: member.client.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };
        
        // Check if image exists
        const hasImage = imageExists(WELCOME_IMAGE);
        
        if (hasImage) {
            const attachment = new AttachmentBuilder(WELCOME_IMAGE, { name: 'welcome.png' });
            embed.image = { url: 'attachment://welcome.png' };
            
            await channel.send({
                embeds: [embed],
                files: [attachment]
            });
        } else {
            await channel.send({ embeds: [embed] });
        }
        
        console.log(`👋 Welcome message sent for ${member.user.username}`);
    }
};
