// src/events/guildMemberRemove.js
const { AttachmentBuilder } = require('discord.js');
const {
    GUILD_ID,
    LEAVE_CHANNEL_ID,
    LEAVE_IMAGE,
    imageExists
} = require('../config');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        // Only respond to the configured guild
        if (member.guild.id !== GUILD_ID) return;
        
        const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
        
        if (!channel) {
            console.log(`⚠️ Leave channel ${LEAVE_CHANNEL_ID} not found`);
            return;
        }
        
        // Create leave embed
        const embed = {
            title: '🚢 Farewell, Crew Member!',
            description: `**${member.user.username}** has left the server. We'll miss you!`,
            color: 0xff0000,
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
        const hasImage = imageExists(LEAVE_IMAGE);
        
        if (hasImage) {
            const attachment = new AttachmentBuilder(LEAVE_IMAGE, { name: 'leave.png' });
            embed.image = { url: 'attachment://leave.png' };
            
            await channel.send({
                embeds: [embed],
                files: [attachment]
            });
        } else {
            await channel.send({ embeds: [embed] });
        }
        
        console.log(`👋 Leave message sent for ${member.user.username}`);
    }
};
