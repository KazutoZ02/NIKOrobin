// index.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, Partials, REST, Routes, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'changeme';
const PORT = process.env.PORT || 3000;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('DISCORD_TOKEN, CLIENT_ID and GUILD_ID must be provided in env vars');
  process.exit(1);
}

const CONFIG_PATH = path.join(__dirname, 'config.json');
function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}
function writeConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}
let cfg = readConfig();

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel]
});

// Basic command registration: /ping and /ticket will be registered to guild
async function registerCommands() {
  const commands = [
    {
      name: 'ping',
      description: 'Bot ping and status'
    },
    {
      name: 'ticket',
      description: 'Open a support ticket',
      options: [
        { name: 'subject', description: 'Short subject for the ticket', type: 3, required: false }
      ]
    }
  ];
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Registering guild commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Commands registered.');
  } catch (err) {
    console.error('Error registering commands', err);
  }
}

// Helper: only operate in the configured guild
function isAllowedGuild(guildId) {
  return String(guildId) === String(GUILD_ID);
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
});

// Welcome & auto-role
client.on('guildMemberAdd', async (member) => {
  if (!isAllowedGuild(member.guild.id)) return;
  try {
    cfg = readConfig();
    // Auto role assignment
    if (cfg.usersRoleId) {
      const r = member.guild.roles.cache.get(cfg.usersRoleId) || await member.guild.roles.fetch(cfg.usersRoleId).catch(()=>null);
      if (r) await member.roles.add(r).catch(()=>{});
    }
    // Welcome embed
    const channel = member.guild.channels.cache.get(cfg.welcomeChannel) || await member.guild.channels.fetch(cfg.welcomeChannel).catch(()=>null);
    if (channel) {
      const imagePath = path.join(__dirname, cfg.welcomeImage || 'assets/welcome.jpg');
      const attachment = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'welcome.jpg' });
      const embed = new EmbedBuilder()
        .setTitle(`Welcome ${member.user.username}!`)
        .setDescription(`Welcome to the server, <@${member.id}>!`)
        .setImage('attachment://welcome.jpg')
        .setColor(0x00FF99)
        .setTimestamp();
      await channel.send({ embeds: [embed], files: [attachment] }).catch(console.error);
    }
  } catch (e) { console.error(e); }
});

// Leave embed
client.on('guildMemberRemove', async (member) => {
  if (!isAllowedGuild(member.guild.id)) return;
  try {
    cfg = readConfig();
    const channel = member.guild.channels.cache.get(cfg.leaveChannel) || await member.guild.channels.fetch(cfg.leaveChannel).catch(()=>null);
    if (channel) {
      const imagePath = path.join(__dirname, cfg.leaveImage || 'assets/leave.jpg');
      const attachment = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'leave.jpg' });
      const embed = new EmbedBuilder()
        .setTitle(`Goodbye ${member.user.username}`)
        .setDescription(`${member.user.tag} has left the server.`)
        .setImage('attachment://leave.jpg')
        .setColor(0xFF5555)
        .setTimestamp();
      await channel.send({ embeds: [embed], files: [attachment] }).catch(console.error);
    }
  } catch (e) { console.error(e); }
});

// Slash command handling (ping, ticket)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.inGuild() || !isAllowedGuild(interaction.guildId)) return;
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'ping') {
      await interaction.deferReply();
      cfg = readConfig();
      const imagePath = path.join(__dirname, cfg.bannerImage || 'assets/banner.jpg');
      const attachment = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'banner.jpg' });
      const embed = new EmbedBuilder()
        .setTitle('Pong!')
        .addFields(
          { name: 'API Latency', value: `${Math.round(client.ws.ping)} ms`, inline: true },
          { name: 'Bot Latency', value: `${Date.now() - interaction.createdTimestamp} ms`, inline: true }
        )
        .setImage('attachment://banner.jpg')
        .setColor(0x00AAFF)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed], files: [attachment] });
    }

    if (interaction.commandName === 'ticket') {
      await interaction.deferReply({ ephemeral: true });
      cfg = readConfig();
      // Check if user is allowed to raise a ticket (if cfg.ticket.roleCanRaise non-empty then require one)
      if (cfg.ticket.roleCanRaise && cfg.ticket.roleCanRaise.length > 0) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(()=>null);
        const hasRole = member.roles.cache.some(r => cfg.ticket.roleCanRaise.includes(r.id));
        if (!hasRole) {
          return interaction.editReply({ content: 'You are not permitted to create a ticket.' });
        }
      }
      const subject = interaction.options.getString('subject') || 'No subject';
      // Create ticket channel
      const category = interaction.guild.channels.cache.find(c => c.type === 4 && c.name === cfg.ticket.categoryName) || (await interaction.guild.channels.create({ name: cfg.ticket.categoryName, type: 4 }).catch(()=>null));
      const ticketId = Math.floor(Math.random()*9000)+1000;
      const channelName = `ticket-${ticketId}`;
      const everyone = interaction.guild.roles.everyone;
      let permissionOverwrites = [
        { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] }
      ];
      // allow ticket creator
      permissionOverwrites.push({ id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] });
      // allow bot itself
      permissionOverwrites.push({ id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
      // allow roles that can claim
      if (cfg.ticket.roleCanClaim && cfg.ticket.roleCanClaim.length > 0) {
        for (const roleId of cfg.ticket.roleCanClaim) permissionOverwrites.push({ id: roleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
      }
      const ticketChannel = await interaction.guild.channels.create({ name: channelName, type: 0, parent: category?.id, permissionOverwrites }).catch(err => { console.error(err); return null; });
      if (!ticketChannel) return interaction.editReply({ content: 'Failed to create ticket channel.' });

      const bannerPath = path.join(__dirname, cfg.bannerImage || 'assets/banner.jpg');
      const attachment = new AttachmentBuilder(fs.readFileSync(bannerPath), { name: 'banner.jpg' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId(`claim_${ticketChannel.id}`).setLabel('Claim').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`close_${ticketChannel.id}`).setLabel('Close').setStyle(ButtonStyle.Danger)
        );

      const embed = new EmbedBuilder()
        .setTitle(`Ticket ${ticketId}`)
        .setDescription(`**Subject:** ${subject}\n**Opened by:** <@${interaction.user.id}>`)
        .setImage('attachment://banner.jpg')
        .setColor(0xFFD166)
        .setTimestamp();

      await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], files: [attachment], components: [row] });
      await interaction.editReply({ content: `Ticket created: ${ticketChannel}` });
    }
  }

  // Button interactions for claim & close
  if (interaction.isButton()) {
    const customId = interaction.customId;
    if (customId.startsWith('claim_')) {
      const channelId = customId.split('_')[1];
      if (interaction.channel.id !== channelId) return interaction.reply({ content: 'This button is not for this channel.', ephemeral: true });
      cfg = readConfig();
      // check claimant permissions — must be in roleCanClaim or be admin
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(()=>null);
      const isAllowed = member.permissions.has(PermissionsBitField.Flags.Administrator) || (cfg.ticket.roleCanClaim || []).some(r => member.roles.cache.has(r));
      if (!isAllowed) return interaction.reply({ content: 'You are not allowed to claim tickets.', ephemeral: true });
      // update channel perms: restrict send/view to claimer + original + roles allowed
      await interaction.channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true }).catch(()=>{});
      await interaction.reply({ content: `Ticket claimed by <@${interaction.user.id}>`, ephemeral: false });
      await interaction.channel.send({ content: `🔒 Ticket claimed by <@${interaction.user.id}>` });
    }
    if (customId.startsWith('close_')) {
      const channelId = customId.split('_')[1];
      if (interaction.channel.id !== channelId) return interaction.reply({ content: 'This button is not for this channel.', ephemeral: true });
      // move channel to archived (or delete after 10s)
      await interaction.reply({ content: 'Closing ticket in 5 seconds...' });
      setTimeout(async () => {
        try {
          await interaction.channel.delete(`Ticket closed by ${interaction.user.tag}`);
        } catch (e) {
          console.error('Failed to delete ticket channel', e);
        }
      }, 5000);
    }
  }
});

// Express dashboard and API
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// simple auth middleware
function checkAuth(req, res, next) {
  const pw = req.headers['x-dashboard-password'] || req.body.password || req.query.password;
  if (pw === DASHBOARD_PASSWORD) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

// GET config
app.get('/api/config', checkAuth, (req, res) => {
  try { cfg = readConfig(); res.json(cfg); } catch(e) { res.status(500).json({ error: 'read failed' }); }
});

// POST update config
app.post('/api/config', checkAuth, async (req, res) => {
  try {
    const newCfg = Object.assign(cfg, req.body);
    writeConfig(newCfg);
    cfg = readConfig();
    return res.json({ ok: true, cfg });
  } catch (e) { console.error(e); res.status(500).json({ error: 'save failed' }); }
});

// GET roles list (protected)
app.get('/api/roles', checkAuth, async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const roles = await guild.roles.fetch();
    const arr = roles.map(r => ({ id: r.id, name: r.name, hoist: r.hoist }));
    res.json(arr);
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed to fetch roles' }); }
});

app.listen(PORT, () => {
  console.log(`Express dashboard listening on port ${PORT}`);
});

client.login(TOKEN);
