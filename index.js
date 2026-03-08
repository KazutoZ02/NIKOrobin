require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  ActivityType,
} = require('discord.js');
const express = require('express');
const fs      = require('fs');
const path    = require('path');

// --- Env vars (Express starts regardless so Render health check always passes) ---
const TOKEN     = process.env.TOKEN     || null;
const CLIENT_ID = process.env.CLIENT_ID || null;
const GUILD_ID  = process.env.GUILD_ID  || null;

const _missing = [!TOKEN && 'TOKEN', !CLIENT_ID && 'CLIENT_ID', !GUILD_ID && 'GUILD_ID'].filter(Boolean);
if (_missing.length) {
  console.error('WARNING: Missing env vars: ' + _missing.join(', '));
  console.error('  Go to: Render Dashboard > your service > Environment > add TOKEN, CLIENT_ID, GUILD_ID > Save Changes > Manual Deploy');
}

// ─── Load config ──────────────────────────────────────────────────────────────
let config;
try {
  config = require('./config.json');
} catch (e) {
  console.error('❌ Could not load config.json:', e.message);
  process.exit(1);
}

// ─── Client Setup ─────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.commands = new Collection();

// ─── Load Commands ────────────────────────────────────────────────────────────
const commandsData = [];
try {
  const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands'))
    .filter((f) => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commandsData.push(command.data.toJSON());
    console.log(`📦 Loaded command: ${command.data.name}`);
  }
} catch (e) {
  console.error('❌ Failed to load commands:', e.message);
  process.exit(1);
}

// ─── Register Slash Commands ──────────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('⏳ Registering slash commands…');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commandsData }
    );
    console.log('✅ Slash commands registered successfully.');
  } catch (err) {
    console.error('⚠️  Slash command registration failed:', err.message);
  }
}

// ─── Ticket Storage ───────────────────────────────────────────────────────────
const ticketDataPath = path.join(__dirname, 'tickets.json');

function loadTickets() {
  if (!fs.existsSync(ticketDataPath)) return {};
  try { return JSON.parse(fs.readFileSync(ticketDataPath, 'utf8')); }
  catch { return {}; }
}
function saveTickets(data) {
  try { fs.writeFileSync(ticketDataPath, JSON.stringify(data, null, 2)); }
  catch (e) { console.error('saveTickets error:', e.message); }
}

let ticketStore   = loadTickets();
let ticketCounter = Object.keys(ticketStore).length;

// ─── Dashboard Config ─────────────────────────────────────────────────────────
const dashConfigPath    = path.join(__dirname, 'dashConfig.json');
const defaultDashConfig = {
  ticketCreateRoles: [config.roles.users],
  ticketClaimRoles:  [config.roles.bot],
};

function loadDashConfig() {
  if (!fs.existsSync(dashConfigPath)) return { ...defaultDashConfig };
  try { return JSON.parse(fs.readFileSync(dashConfigPath, 'utf8')); }
  catch { return { ...defaultDashConfig }; }
}
function saveDashConfig(data) {
  try { fs.writeFileSync(dashConfigPath, JSON.stringify(data, null, 2)); }
  catch (e) { console.error('saveDashConfig error:', e.message); }
}

let dashConfig = loadDashConfig();

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag} (${client.user.id})`);
  console.log(`🏠 Serving guild: ${GUILD_ID}`);
  client.user.setActivity('Niko Robin | /ticket', { type: ActivityType.Watching });
  await registerCommands();
});

// ─── Client Error Handlers ────────────────────────────────────────────────────
client.on('error',      (e) => console.error('Discord client error:', e.message));
client.on('warn',       (w) => console.warn('Discord warning:', w));
client.on('shardError', (e) => console.error('Shard error:', e.message));

// ─── Guild Member Add (Welcome + Auto-Role) ───────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== GUILD_ID) return;

  // Auto-role
  try {
    const role = member.guild.roles.cache.get(config.roles.users);
    if (role) {
      await member.roles.add(role);
      console.log(`✅ Auto-role given to ${member.user.tag}`);
    }
  } catch (err) {
    console.error('Auto-role error:', err.message);
  }

  // Welcome embed
  try {
    const channel = member.guild.channels.cache.get(config.channels.welcome);
    if (!channel) { console.warn(`⚠️  Welcome channel ${config.channels.welcome} not found.`); return; }

    const welcomeImg = path.join(__dirname, 'assets', 'welcome.jpg');
    const files = fs.existsSync(welcomeImg)
      ? [new AttachmentBuilder(welcomeImg, { name: 'welcome.jpg' })]
      : [];

    const embed = new EmbedBuilder()
      .setColor(0xe91e63)
      .setTitle('✨ Welcome to the Server!')
      .setDescription(`Hey ${member}, welcome to **${member.guild.name}**! 🌸\nWe're glad you're here. Enjoy your stay!`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({
        text: `Member #${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }) ?? undefined,
      })
      .setTimestamp();

    if (files.length) embed.setImage('attachment://welcome.jpg');
    await channel.send({ embeds: [embed], files });
  } catch (err) {
    console.error('Welcome embed error:', err.message);
  }
});

// ─── Guild Member Remove (Leave) ──────────────────────────────────────────────
client.on('guildMemberRemove', async (member) => {
  if (member.guild.id !== GUILD_ID) return;

  try {
    const channel = member.guild.channels.cache.get(config.channels.leave);
    if (!channel) { console.warn(`⚠️  Leave channel ${config.channels.leave} not found.`); return; }

    const leaveImg = path.join(__dirname, 'assets', 'leave.jpg');
    const files = fs.existsSync(leaveImg)
      ? [new AttachmentBuilder(leaveImg, { name: 'leave.jpg' })]
      : [];

    const embed = new EmbedBuilder()
      .setColor(0x607d8b)
      .setTitle('👋 A Member Has Left')
      .setDescription(`**${member.user.tag}** has left the server.\nWe'll miss you! 💔`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({
        text: `Members: ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }) ?? undefined,
      })
      .setTimestamp();

    if (files.length) embed.setImage('attachment://leave.jpg');
    await channel.send({ embeds: [embed], files });
  } catch (err) {
    console.error('Leave embed error:', err.message);
  }
});

// ─── Interaction Handler ──────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {

  // ── Slash Commands ──────────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    if (interaction.guildId !== GUILD_ID) {
      return interaction.reply({ content: '⛔ This bot only works in its designated server.', ephemeral: true });
    }
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client, dashConfig);
    } catch (err) {
      console.error(`Command error [${interaction.commandName}]:`, err.message);
      const msg = { content: '❌ An error occurred executing that command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
      else await interaction.reply(msg).catch(() => {});
    }
    return;
  }

  if (!interaction.isButton()) return;
  const { customId, guild, channel, member } = interaction;

  // ── Open Ticket ───────────────────────────────────────────────────────────────
  if (customId === 'open_ticket') {
    await interaction.deferReply({ ephemeral: true });

    const memberRoles = member.roles.cache.map((r) => r.id);
    const canCreate =
      dashConfig.ticketCreateRoles.some((rid) => memberRoles.includes(rid)) ||
      member.permissions.has(PermissionFlagsBits.Administrator);

    if (!canCreate) return interaction.editReply({ content: '⛔ You do not have permission to open a ticket.' });

    const existing = Object.entries(ticketStore).find(([, d]) => d.userId === member.id && !d.closed);
    if (existing) return interaction.editReply({ content: `⚠️ You already have an open ticket: <#${existing[0]}>` });

    ticketCounter++;
    const ticketNum = String(ticketCounter).padStart(4, '0');

    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'tickets'
    );
    if (!category) {
      category = await guild.channels.create({ name: 'Tickets', type: ChannelType.GuildCategory });
    }

    const overwrites = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ];
    for (const roleId of dashConfig.ticketClaimRoles) {
      overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${ticketNum}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: overwrites,
    });

    ticketStore[ticketChannel.id] = { userId: member.id, number: ticketNum, claimedBy: null, closed: false, createdAt: Date.now() };
    saveTickets(ticketStore);

    const bannerPath  = path.join(__dirname, 'assets', 'banner.jpg');
    const bannerFiles = fs.existsSync(bannerPath) ? [new AttachmentBuilder(bannerPath, { name: 'banner.jpg' })] : [];

    const ticketEmbed = new EmbedBuilder()
      .setColor(0xe91e63)
      .setTitle(`🎟️ Ticket #${ticketNum}`)
      .setDescription(`Hello ${member}, support is on the way!\n\nPlease describe your issue and a staff member will assist you shortly.`)
      .setFooter({ text: 'Niko Robin • Ticket System' })
      .setTimestamp();

    if (bannerFiles.length) ticketEmbed.setImage('attachment://banner.jpg');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('claim_ticket').setLabel('✋ Claim').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close').setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `${member} — Welcome to your ticket!`, embeds: [ticketEmbed], files: bannerFiles, components: [row] });
    return interaction.editReply({ content: `✅ Ticket created: ${ticketChannel}` });
  }

  // ── Claim Ticket ──────────────────────────────────────────────────────────────
  if (customId === 'claim_ticket') {
    await interaction.deferReply({ ephemeral: true });

    const memberRoles = member.roles.cache.map((r) => r.id);
    const canClaim =
      dashConfig.ticketClaimRoles.some((rid) => memberRoles.includes(rid)) ||
      member.permissions.has(PermissionFlagsBits.Administrator);

    if (!canClaim) return interaction.editReply({ content: '⛔ You do not have permission to claim tickets.' });

    const tData = ticketStore[channel.id];
    if (!tData) return interaction.editReply({ content: '❌ Ticket data not found.' });
    if (tData.claimedBy) return interaction.editReply({ content: `⚠️ Already claimed by <@${tData.claimedBy}>.` });

    tData.claimedBy = member.id;
    saveTickets(ticketStore);

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x4caf50)
          .setDescription(`✋ **${member.displayName}** has claimed this ticket and will assist you shortly.`)
          .setTimestamp(),
      ],
    });
    return interaction.editReply({ content: '✅ You have claimed this ticket.' });
  }

  // ── Close Ticket ───────────────────────────────────────────────────────────────
  if (customId === 'close_ticket') {
    await interaction.deferReply({ ephemeral: true });

    const tData = ticketStore[channel.id];
    if (!tData) return interaction.editReply({ content: '❌ Ticket data not found.' });

    const memberRoles = member.roles.cache.map((r) => r.id);
    const canClose =
      dashConfig.ticketClaimRoles.some((rid) => memberRoles.includes(rid)) ||
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      tData.userId === member.id;

    if (!canClose) return interaction.editReply({ content: '⛔ You cannot close this ticket.' });

    tData.closed = true;
    saveTickets(ticketStore);

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf44336)
          .setDescription(`🔒 Ticket closed by **${member.displayName}**.\nThis channel will be deleted in 5 seconds.`)
          .setTimestamp(),
      ],
    });
    await interaction.editReply({ content: '✅ Closing ticket…' });

    setTimeout(async () => {
      try {
        delete ticketStore[channel.id];
        saveTickets(ticketStore);
        await channel.delete('Ticket closed');
      } catch (e) { console.error('Channel delete error:', e.message); }
    }, 5000);
  }
});

// ─── Express Web Dashboard ─────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/api/roles', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.roles.fetch();
    const roles = guild.roles.cache
      .filter((r) => !r.managed && r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }));
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/config', (req, res) => res.json(dashConfig));

app.post('/api/config', (req, res) => {
  const { ticketCreateRoles, ticketClaimRoles } = req.body;
  if (!Array.isArray(ticketCreateRoles) || !Array.isArray(ticketClaimRoles)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  dashConfig.ticketCreateRoles = ticketCreateRoles;
  dashConfig.ticketClaimRoles  = ticketClaimRoles;
  saveDashConfig(dashConfig);
  res.json({ success: true, dashConfig });
});

app.get('/api/stats', (req, res) => {
  const all = Object.values(ticketStore);
  res.json({ total: all.length, open: all.filter((t) => !t.closed).length, closed: all.filter((t) => t.closed).length });
});

// Health-check for Render + UptimeRobot
app.get('/health', (req, res) => res.status(200).send('OK'));

// ─── CRITICAL: Bind to 0.0.0.0 — required on Render ──────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Dashboard listening on 0.0.0.0:${PORT}`);
});

// ─── Discord Login ────────────────────────────────────────────────────────────
// --- Discord Login with auto-reconnect ---
function connectBot() {
  if (!TOKEN) {
    console.error('TOKEN missing - set it in Render Environment variables.');
    return;
  }
  console.log('Connecting to Discord...');
  client.login(TOKEN).catch((err) => {
    console.error('Discord login failed:', err.message);
    console.log('Retrying in 10 seconds...');
    setTimeout(connectBot, 10000);
  });
}

client.on('disconnect', () => {
  console.warn('Bot disconnected from Discord. Reconnecting...');
  setTimeout(connectBot, 5000);
});

client.on('invalidated', () => {
  console.error('Session invalidated. Reconnecting...');
  setTimeout(connectBot, 10000);
});

connectBot();

// --- Process-level crash prevention ---
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
