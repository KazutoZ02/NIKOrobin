const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Creates the ticket generation panel in the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Support Tickets')
            .setDescription('Need help? Click the button below to open a private ticket with our support team.')
            .setFooter({ text: 'Royals Paradise Support' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫'),
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // Reply ephemerally to confirm setup
        await interaction.reply({ content: 'Ticket panel has been set up successfully!', ephemeral: true });
    },
};
