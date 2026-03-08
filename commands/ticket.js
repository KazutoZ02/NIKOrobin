const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎟️ Open a support ticket'),

  async execute(interaction, client, dashConfig) {
    await interaction.deferReply({ ephemeral: true });

    // Permission check
    const memberRoles = interaction.member.roles.cache.map((r) => r.id);
    const canCreate =
      dashConfig.ticketCreateRoles.some((rid) => memberRoles.includes(rid)) ||
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!canCreate) {
      return interaction.editReply({
        content: '⛔ You do not have permission to open tickets.',
      });
    }

    const banner = new AttachmentBuilder(
      path.join(__dirname, '..', 'assets', 'banner.jpg'),
      { name: 'banner.jpg' }
    );

    const embed = new EmbedBuilder()
      .setColor(0xe91e63)
      .setTitle('🎟️ Support Tickets')
      .setDescription(
        'Click the button below to open a support ticket.\nOur staff will assist you as soon as possible!'
      )
      .setImage('attachment://banner.jpg')
      .setFooter({ text: 'Niko Robin • Ticket System' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎟️ Open Ticket')
        .setStyle(ButtonStyle.Primary)
    );

    // Send to channel so everyone can use it
    await interaction.channel.send({
      embeds: [embed],
      files: [banner],
      components: [row],
    });

    return interaction.editReply({ content: '✅ Ticket panel posted!' });
  },
};
