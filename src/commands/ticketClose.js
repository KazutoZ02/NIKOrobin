// src/commands/ticketClose.js
const { SlashCommandBuilder } = require('discord.js');
const {
    GUILD_ID,
    loadTicketData,
    saveTicketData
} = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-close')
        .setDescription('Close the current ticket'),
    
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
        const settings = data.settings;
        
        // Check permissions (ticket owner, claimer, or staff with claim permissions)
        const canClose = 
            ticket.userId === user.id ||
            ticket.claimedBy === user.id ||
            (settings.claimRoles && settings.claimRoles.length > 0 && 
             settings.claimRoles.some(roleId => user.roles.cache.has(roleId)));
        
        if (!canClose) {
            return interaction.reply({
                content: '❌ You don\'t have permission to close this ticket!',
                ephemeral: true
            });
        }
        
        // Update ticket status
        ticket.status = 'closed';
        ticket.closedAt = new Date().toISOString();
        ticket.closedBy = user.id;
        data.tickets[ticketId] = ticket;
        saveTicketData(data);
        
        // Send close message
        const embed = {
            title: `🎫 Ticket #${ticket.ticketNumber} Closed`,
            description: `Ticket closed by ${user.toString()}`,
            color: 0xff0000,
            footer: {
                text: "Niko Robin's Crew",
                icon_url: interaction.client.user.displayAvatarURL()
            }
        };
        
        await interaction.reply({ embeds: [embed] });
        
        // Delete channel after a short delay
        setTimeout(async () => {
            try {
                await channel.delete();
                console.log(`🎫 Ticket #${ticket.ticketNumber} closed by ${user.username}`);
            } catch (error) {
                console.error('Error deleting ticket channel:', error);
            }
        }, 3000);
    }
};
