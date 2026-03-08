const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Bot ping and status'),
  async execute(interaction, client, cfg) {
    await interaction.deferReply();
    cfg = cfg || JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json')));
    const imagePath = path.join(__dirname, '..', cfg.bannerImage || 'assets/banner.jpg');
    const attachment = fs.existsSync(imagePath) ? new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'banner.jpg' }) : null;
    const embed = new EmbedBuilder()
      .setTitle('Pong!')
      .addFields(
        { name: 'API Latency', value: `${Math.round(client.ws.ping)} ms`, inline: true },
        { name: 'Bot Latency', value: `${Date.now() - interaction.createdTimestamp} ms`, inline: true }
      )
      .setColor(0x00AAFF)
      .setTimestamp();
    const payload = { embeds: [embed] };
    if (attachment) payload.files = [attachment];
    await interaction.editReply(payload);
  }
};
