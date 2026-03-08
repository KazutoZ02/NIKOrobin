const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Check the bot latency'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const sent = await interaction.fetchReply();
    const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const color =
      apiLatency < 100 ? 0x4caf50 : apiLatency < 200 ? 0xff9800 : 0xf44336;

    const banner = new AttachmentBuilder(
      path.join(__dirname, '..', 'assets', 'banner.jpg'),
      { name: 'banner.jpg' }
    );

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🏓 Pong!')
      .setDescription('Here is the current latency status for **Niko Robin**:')
      .addFields(
        {
          name: '⚡ Bot Latency',
          value: `\`${botLatency}ms\``,
          inline: true,
        },
        {
          name: '📡 API Latency',
          value: `\`${apiLatency}ms\``,
          inline: true,
        },
        {
          name: '🟢 Status',
          value:
            apiLatency < 100
              ? '`Excellent`'
              : apiLatency < 200
              ? '`Good`'
              : '`High`',
          inline: true,
        }
      )
      .setImage('attachment://banner.jpg')
      .setFooter({ text: 'Niko Robin • Utility', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [banner] });
  },
};
