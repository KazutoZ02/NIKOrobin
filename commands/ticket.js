const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ticket').setDescription('Open a support ticket').addStringOption(opt => opt.setName('subject').setDescription('Short subject for the ticket').setRequired(false)),

  async execute(interaction, client, cfg) {
    await interaction.deferReply({ ephemeral: true });
    cfg = cfg || JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json')));

    // check roleCanRaise
    if (cfg.ticket.roleCanRaise && cfg.ticket.roleCanRaise.length > 0) {
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(()=>null);
      const hasRole = member && member.roles.cache.some(r => cfg.ticket.roleCanRaise.includes(r.id));
      if (!hasRole) return interaction.editReply({ content: 'You are not permitted to create a ticket.' });
    }

    const subject = interaction.options.getString('subject') || 'No subject';
    const category = interaction.guild.channels.cache.find(c => c.type === 4 && c.name === cfg.ticket.categoryName) || await interaction.guild.channels.create({ name: cfg.ticket.categoryName, type: 4 }).catch(()=>null);
    const ticketId = Math.floor(Math.random()*9000)+1000;
    const channelName = `ticket-${ticketId}`;

    const everyone = interaction.guild.roles.everyone;
    let permissionOverwrites = [ { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] } ];
    permissionOverwrites.push({ id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] });
    permissionOverwrites.push({ id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
    if (cfg.ticket.roleCanClaim && cfg.ticket.roleCanClaim.length > 0) {
      for (const roleId of cfg.ticket.roleCanClaim) permissionOverwrites.push({ id: roleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
    }

    const ticketChannel = await interaction.guild.channels.create({ name: channelName, type: 0, parent: category?.id, permissionOverwrites }).catch(err => { console.error(err); return null; });
    if (!ticketChannel) return interaction.editReply({ content: 'Failed to create ticket channel.' });

    const bannerPath = path.join(__dirname, '..', cfg.bannerImage || 'assets/banner.jpg');
    const attachment = fs.existsSync(bannerPath) ? new AttachmentBuilder(fs.readFileSync(bannerPath), { name: 'banner.jpg' }) : null;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_${ticketChannel.id}`).setLabel('Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`close_${ticketChannel.id}`).setLabel('Close').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder().setTitle(`Ticket ${ticketId}`).setDescription(`**Subject:** ${subject}
**Opened by:** <@${interaction.user.id}>`).setColor(0xFFD166).setTimestamp();
    const msgPayload = { content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] };
    if (attachment) msgPayload.files = [attachment];
    await ticketChannel.send(msgPayload);
    await interaction.editReply({ content: `Ticket created: ${ticketChannel}` });
  },

  // handle button interactions (claim/close)
  async handleButton(interaction, client, cfg, readConfig) {
    if (!interaction.customId) return;
    const cid = interaction.customId;
    if (cid.startsWith('claim_')) {
      const channelId = cid.split('_')[1];
      if (interaction.channel.id !== channelId) return interaction.reply({ content: 'This button is not for this channel.', ephemeral: true });
      cfg = readConfig ? readConfig() : cfg;
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(()=>null);
      const isAllowed = (member && member.permissions.has(PermissionsBitField.Flags.Administrator)) || (cfg.ticket.roleCanClaim || []).some(r => member.roles.cache.has(r));
      if (!isAllowed) return interaction.reply({ content: 'You are not allowed to claim tickets.', ephemeral: true });
      await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true }).catch(()=>{});
      await interaction.reply({ content: `Ticket claimed by <@${interaction.user.id}>` });
      await interaction.channel.send({ content: `🔒 Ticket claimed by <@${interaction.user.id}>` });
    }

    if (cid.startsWith('close_')) {
      const channelId = cid.split('_')[1];
      if (interaction.channel.id !== channelId) return interaction.reply({ content: 'This button is not for this channel.', ephemeral: true });
      await interaction.reply({ content: 'Closing ticket in 5 seconds...' });
      setTimeout(async () => { try { await interaction.channel.delete(`Ticket closed by ${interaction.user.tag}`); } catch (e) { console.error('Failed to delete ticket channel', e); } }, 5000);
    }
  }
};
