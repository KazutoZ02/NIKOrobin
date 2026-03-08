// index.js — bot main + express dashboard (loads commands from commands/)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { Client, GatewayIntentBits, Partials, REST, Routes, Collection, PermissionsBitField } = require('discord.js');

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
function readConfig() { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
function writeConfig(cfg) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8'); }
let cfg = readConfig();

// Create client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});
client.commands = new Collection();

// Load command files from commands/
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
    }
  }
}

// Register commands to guild
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const commandData = [];
  for (const cmd of client.commands.values()) commandData.push(cmd.data.toJSON());
  try {
    console.log('Registering guild commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commandData });
    console.log('Commands registered.');
  } catch (err) { console.error('Error registering commands', err); }
}

function isAllowedGuild(guildId) { return String(guildId) === String(GUILD_ID); }

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
});

// Welcome & auto-role
client.on('guildMemberAdd', async (member) => {
  if (!isAllowedGuild(member.guild.id)) return;
  try {
    cfg = readConfig();
    if (cfg.usersRoleId) {
      const r = member.guild.roles.cache.get(cfg.usersRoleId) || await member.guild.roles.fetch(cfg.usersRoleId).catch(()=>null);
      if (r) await member.roles.add(r).catch(()=>{});
    }
    const channel = member.guild.channels.cache.get(cfg.welcomeChannel) || await member.guild.channels.fetch(cfg.welcomeChannel).catch(()=>null);
    if (channel && fs.existsSync(path.join(__dirname, cfg.welcomeImage))) {
      const att = { files: [path.join(__dirname, cfg.welcomeImage)] };
      const embedMsg = { content: `<@${member.id}>`, files: [path.join(__dirname, cfg.welcomeImage)] };
      await channel.send({ content: `<@${member.id}> Welcome!`, files: [path.join(__dirname, cfg.welcomeImage)] }).catch(console.error);
    }
  } catch (e) { console.error(e); }
});

client.on('guildMemberRemove', async (member) => {
  if (!isAllowedGuild(member.guild.id)) return;
  try {
    cfg = readConfig();
    const channel = member.guild.channels.cache.get(cfg.leaveChannel) || await member.guild.channels.fetch(cfg.leaveChannel).catch(()=>null);
    if (channel && fs.existsSync(path.join(__dirname, cfg.leaveImage))) {
      await channel.send({ content: `${member.user.tag} has left.`, files: [path.join(__dirname, cfg.leaveImage)] }).catch(console.error);
    }
  } catch (e) { console.error(e); }
});

// Interaction handling: commands come from modular files
client.on('interactionCreate', async (interaction) => {
  if (!interaction.inGuild() || !isAllowedGuild(interaction.guildId)) return;
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: 'Command not found.', ephemeral: true });
    try { await command.execute(interaction, client, cfg, readConfig); } catch (err) { console.error(err); interaction.reply({ content: 'There was an error executing that command.', ephemeral: true }); }
  }

  // Buttons are handled inside command files by listening on client — we implement claim/close inside ticket command using interactionCreate as well,
  // but for simplicity we'll delegate to the ticket command's button handler if exported.
  if (interaction.isButton()) {
    // If ticket command exports handleButton, call it
    const ticketCmd = client.commands.get('ticket');
    if (ticketCmd && typeof ticketCmd.handleButton === 'function') {
      try { await ticketCmd.handleButton(interaction, client, cfg, readConfig); } catch (e) { console.error('button handler error', e); }
    }
  }
});

// Express dashboard and API
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function checkAuth(req, res, next) {
  const pw = req.headers['x-dashboard-password'] || req.body.password || req.query.password;
  if (pw === DASHBOARD_PASSWORD) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

app.get('/api/config', checkAuth, (req, res) => { try { cfg = readConfig(); res.json(cfg); } catch(e) { res.status(500).json({ error: 'read failed' }); } });

app.post('/api/config', checkAuth, async (req, res) => {
  try { const newCfg = Object.assign(cfg, req.body); writeConfig(newCfg); cfg = readConfig(); return res.json({ ok: true, cfg }); } catch (e) { console.error(e); res.status(500).json({ error: 'save failed' }); } });

app.get('/api/roles', checkAuth, async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const roles = await guild.roles.fetch();
    const arr = roles.map(r => ({ id: r.id, name: r.name, hoist: r.hoist }));
    res.json(arr);
  } catch (e) { console.error(e); res.status(500).json({ error: 'failed to fetch roles' }); }
});

app.listen(PORT, () => { console.log(`Express dashboard listening on port ${PORT}`); });

client.login(TOKEN);