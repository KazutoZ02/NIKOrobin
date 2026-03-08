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
} = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// ─── Client Setup ────────────────────────────────────────────────────────────
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
const commandFiles = fs
  .readdirSync(path.join(__dirname, 'commands'))
  .filter((f) => f.endsWith('.js'));

const commandsData = [];
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commandsData.push(command.data.toJSON());
}

// ─── Register Slash Commands ──────────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('Registering slash commands for guild…');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commandsData }
    );
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error('Command registration error:', err);
  }
}

// ─── Ticket Storage (in-memory + JSON persistence) ───────────────────────────
const ticketDataPath = path.join(__dirname, 'tickets.json');

function loadTickets() {
  if (!fs.existsSync(ticketDataPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(ticketDataPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveTickets(data) {
  fs.writeFileSync(ticketDataPath, JSON.stringify(data, null, 2));
}

let ticketStore = loadTickets(); // { channelId: { userId, claimedBy, number } }
let ticketCounter = Object.keys(ticketStore).length;

// ─── Dashboard Config Storage ─────────────────────────────────────────────────
const dashConfigPath = path.join(__dirname, 'dashConfig.json');

function loadDashConfig() {
  if (!fs.existsSync(dashConfigPath))
    return {
      ticketCreateRoles: [config.roles.users],
      ticketClaimRoles: [config.roles.bot],
    };
  try {
    return JSON.parse(fs.readFileSync(dashConfigPath, 'utf8'));
  } catch {
    return {
      ticketCreateRoles: [config.roles.users],
      ticketClaimRoles: [config.roles.bot],
    };
  }
}

function saveDashConfig(data) {
  fs.writeFileSync(dashConfigPath, JSON.stringify(data, null, 2));
}

let dashConfig = loadDashConfig();

// ─── Ready ─────────────────────────────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setActivity('Niko Robin | /ticket', { type: 0 });
  await registerCommands();
});

// ─── Guild Member Add (Welcome + Auto-Role) ───────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== process.env.GUILD_ID) return;

  // Auto-role
  try {
    const role = member.guild.roles.cache.get(config.roles.users);
    if (role) await member.roles.add(role);
  } catch (err) {
    console.error('Auto-role error:', err);
  }

  // Welcome embed
  try {
    const channel = member.guild.channels.cache.get(config.channels.welcome);
    if (!channel) return;

    const attachment = new AttachmentBuilder(
      path.join(__dirname, 'assets', 'welcome.jpg'),
      { name: 'welcome.jpg' }
    );

    const embed = new EmbedBuilder()
      .setColor(0xe91e63)
      .setTitle('✨ Welcome to the Server!')
      .setDescription(
        `Hey ${member}, welcome to **${member.guild.name}**! 🌸\nWe're glad you're here. Enjoy your stay!`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage('attachment://welcome.jpg')
      .setFooter({
        text: `Member #${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    await channel.send({ embeds: [embed], files: [attachment] });
  } catch (err) {
    console.error('Welcome error:', err);
  }
});

// ─── Guild Member Remove (Leave) ──────────────────────────────────────────────
client.on('guildMemberRemove', async (member) => {
  if (member.guild.id !== process.env.GUILD_ID) return;

  try {
    const channel = member.guild.channels.cache.get(config.channels.leave);
    if (!channel) return;

    const attachment = new AttachmentBuilder(
      path.join(__dirname, 'assets', 'leave.jpg'),
      { name: 'leave.jpg' }
    );

    const embed = new EmbedBuilder()
      .setColor(0x607d8b)
      .setTitle('👋 A Member Has Left')
      .setDescription(
        `**${member.user.tag}** has left the server.\nWe'll miss you! 💔`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage('attachment://leave.jpg')
      .setFooter({
        text: `Members: ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    await channel.send({ embeds: [embed], files: [attachment] });
  } catch (err) {
    console.error('Leave error:', err);
  }
});

// ─── Interaction Handler ──────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    if (interaction.guildId !== process.env.GUILD_ID) {
      return interaction.reply({
        content: '⛔ This bot only works in its designated server.',
        ephemeral: true,
      });
    }
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client, dashConfig);
    } catch (err) {
      console.error(err);
      const msg = { content: '❌ An error occurred.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
    return;
  }

  // Button interactions
  if (interaction.isButton()) {
    const { customId, guild, channel, member } = interaction;

    // ── Open Ticket ──────────────────────────────────────────────────────────
    if (customId === 'open_ticket') {
      await interaction.deferReply({ ephemeral: true });

      // Check if user has permission to create tickets
      const memberRoles = member.roles.cache.map((r) => r.id);
      const canCreate =
        dashConfig.ticketCreateRoles.some((rid) => memberRoles.includes(rid)) ||
        member.permissions.has(PermissionFlagsBits.Administrator);

      if (!canCreate) {
        return interaction.editReply({
          content: '⛔ You do not have permission to open a ticket.',
        });
      }

      // Check for existing open ticket
      const existingTicket = Object.entries(ticketStore).find(
        ([, data]) => data.userId === member.id && !data.closed
      );
      if (existingTicket) {
        return interaction.editReply({
          content: `⚠️ You already have an open ticket: <#${existingTicket[0]}>`,
        });
      }

      ticketCounter++;
      const ticketNum = String(ticketCounter).padStart(4, '0');

      // Find or create Tickets category
      let category = guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          c.name.toLowerCase() === 'tickets'
      );
      if (!category) {
        category = await guild.channels.create({
          name: 'Tickets',
          type: ChannelType.GuildCategory,
        });
      }

      // Build permission overwrites
      const overwrites = [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ];

      // Staff roles can also view
      for (const roleId of dashConfig.ticketClaimRoles) {
        overwrites.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }

      const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketNum}`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: overwrites,
      });

      // Store
      ticketStore[ticketChannel.id] = {
        userId: member.id,
        number: ticketNum,
        claimedBy: null,
        closed: false,
        createdAt: Date.now(),
      };
      saveTickets(ticketStore);

      // Send ticket embed with banner
      const bannerAttachment = new AttachmentBuilder(
        path.join(__dirname, 'assets', 'banner.jpg'),
        { name: 'banner.jpg' }
      );

      const ticketEmbed = new EmbedBuilder()
        .setColor(0xe91e63)
        .setTitle(`🎟️ Ticket #${ticketNum}`)
        .setDescription(
          `Hello ${member}, support is on the way!\n\nDescribe your issue and a staff member will assist you shortly.`
        )
        .setImage('attachment://banner.jpg')
        .setFooter({ text: 'Niko Robin • Ticket System' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('claim_ticket')
          .setLabel('✋ Claim')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 Close')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `${member} — Welcome to your ticket!`,
        embeds: [ticketEmbed],
        files: [bannerAttachment],
        components: [row],
      });

      return interaction.editReply({
        content: `✅ Your ticket has been created: ${ticketChannel}`,
      });
    }

    // ── Claim Ticket ─────────────────────────────────────────────────────────
    if (customId === 'claim_ticket') {
      await interaction.deferReply({ ephemeral: true });

      const memberRoles = member.roles.cache.map((r) => r.id);
      const canClaim =
        dashConfig.ticketClaimRoles.some((rid) => memberRoles.includes(rid)) ||
        member.permissions.has(PermissionFlagsBits.Administrator);

      if (!canClaim) {
        return interaction.editReply({
          content: '⛔ You do not have permission to claim tickets.',
        });
      }

      const tData = ticketStore[channel.id];
      if (!tData) {
        return interaction.editReply({ content: '❌ Ticket data not found.' });
      }
      if (tData.claimedBy) {
        return interaction.editReply({
          content: `⚠️ This ticket is already claimed by <@${tData.claimedBy}>.`,
        });
      }

      tData.claimedBy = member.id;
      saveTickets(ticketStore);

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x4caf50)
            .setDescription(
              `✋ **${member.displayName}** has claimed this ticket and will assist you shortly.`
            )
            .setTimestamp(),
        ],
      });

      return interaction.editReply({ content: '✅ You have claimed this ticket.' });
    }

    // ── Close Ticket ──────────────────────────────────────────────────────────
    if (customId === 'close_ticket') {
      await interaction.deferReply({ ephemeral: true });

      const tData = ticketStore[channel.id];
      if (!tData) {
        return interaction.editReply({ content: '❌ Ticket data not found.' });
      }

      const memberRoles = member.roles.cache.map((r) => r.id);
      const canClose =
        dashConfig.ticketClaimRoles.some((rid) => memberRoles.includes(rid)) ||
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        tData.userId === member.id;

      if (!canClose) {
        return interaction.editReply({
          content: '⛔ You cannot close this ticket.',
        });
      }

      tData.closed = true;
      saveTickets(ticketStore);

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xf44336)
            .setDescription(
              `🔒 Ticket closed by **${member.displayName}**.\nThis channel will be deleted in 5 seconds.`
            )
            .setTimestamp(),
        ],
      });

      await interaction.editReply({ content: '✅ Ticket is being closed…' });

      setTimeout(async () => {
        try {
          delete ticketStore[channel.id];
          saveTickets(ticketStore);
          await channel.delete('Ticket closed');
        } catch (e) {
          console.error('Channel delete error:', e);
        }
      }, 5000);
    }
  }
});

// ─── Express Web Dashboard ─────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// API: get guild roles
app.get('/api/roles', async (req, res) => {
  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
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

// API: get current dash config
app.get('/api/config', (req, res) => {
  res.json(dashConfig);
});

// API: update dash config
app.post('/api/config', (req, res) => {
  const { ticketCreateRoles, ticketClaimRoles } = req.body;
  if (!Array.isArray(ticketCreateRoles) || !Array.isArray(ticketClaimRoles)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  dashConfig.ticketCreateRoles = ticketCreateRoles;
  dashConfig.ticketClaimRoles = ticketClaimRoles;
  saveDashConfig(dashConfig);
  res.json({ success: true, dashConfig });
});

// API: ticket stats
app.get('/api/stats', (req, res) => {
  const all = Object.values(ticketStore);
  res.json({
    total: all.length,
    open: all.filter((t) => !t.closed).length,
    closed: all.filter((t) => t.closed).length,
  });
});

// Health-check for Render keep-alive
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Dashboard running on port ${PORT}`));

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
