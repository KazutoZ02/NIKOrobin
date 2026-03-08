// src/commands/ticketClaim.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {
    GUILD_ID,
    loadTicketData,
    saveTicketData
} = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-claim')
        .setDescription('Claim a support ticket'),
    
    async execute(interaction) {
        // Only respond in the configured guild
        if (interaction.guildId !== GUILD_ID) {
            return interaction.reply({
                content: '⚠️ This command is only available in the designated server!',
                ephemeral: true
            });
        }
        
        const channel = interaction.channel;
        const user = interaction.user;
        
        // Load ticket data
        const data = loadTicketData();
        const ticketId = channel.id;
        
        // Check if this is a ticket channel
        if (!data.tickets[ticketId]) {
            return interaction.reply({
                content: '❌ This channel is not a ticket!',
                ephemeral: true
            });
        }
        
        const ticket = data.tickets[ticketId];
        
        // Check if ticket is already closed
        if (ticket.status === 'closed') {
            return interaction.reply({
                content: '❌ This ticket is already closed!',
                ephemeral: true
            });
        }
        
        // Check if ticket is already claimed
        if (ticket.claimedBy) {
            return interaction.reply({
                content: '⚠️ This ticket is already claimed!',
                ephemeral: true
            });
        }
        
        // Get settings and check permissions
        const settings = data.settings;
        
        if (settings.claimRoles && settings.claimRoles.length > 0) {
            const userRoleIds = user.roles.cache.map(r => r.id);
            const hasPermission = settings.claimRoles.some(roleId => userRoleIds.includes(roleId));
            
            if (!hasPermission) {
                return interaction.reply({
                    content: '❌ You don\'t have permission to claim tickets!',
                    ephemeral: true
                });
            }
        }
        
        // Update ticket
        ticket.claimedBy = user.id;
        ticket.claimedByName = user.username;
        data.tickets[ticketId] = ticket;
        saveTicketData(data);
        
        // Update embed
        const embed = {
            title: `🎫 Ticket #${ticket.ticketNumber}: ${ticket.title}`,
            description: ticket.description,
            color: 0xffa500,
            fields: [
                {
                    name: '👤 Created by',
                    value: `<@${ticket.userId}>`,
                    inline: true
                },
                {
                    name: '📊 Status',
                    value: '🟠 Claimed',
                    inline: true
                },
                {
                    name: '👮 Claimed by',
                    value: user.toString(),
                    inline: true
                }
            ],
            footer: {
                text: "Niko Robin's Crew",
                icon_url: interaction.client.user.displayAvatarURL()
            }
        };
        
        await channel.send({ embeds: [embed] });
        
        await interaction.reply({
            content: '✅ You have claimed this ticket!',
            ephemeral: true
        });
        
        console.log(`🎫 Ticket #${ticket.ticketNumber} claimed by ${user.username}`);
    }
};
