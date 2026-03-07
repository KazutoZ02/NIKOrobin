require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, PermissionsBitField, ChannelType, Events } = require('discord.js');

// ==================== CONFIG ====================
const TOKEN = (process.env.DISCORD_TOKEN || '').trim();
const CLIENT_ID = (process.env.CLIENT_ID || '').trim();
const GUILD_ID = (process.env.GUILD_ID || '').trim();
const TICKET_CATEGORY_ID = (process.env.TICKET_CATEGORY_ID || '').trim();
const SUPPORT_ROLE_ID = (process.env.SUPPORT_ROLE_ID || '').trim();
const USER_ROLE_ID = (process.env.USER_ROLE_ID || '').trim();
const BOT_ROLE_ID = (process.env.BOT_ROLE_ID || '').trim();
const RENDER_URL = (process.env.RENDER_EXTERNAL_URL || '').trim();
const PORT = process.env.PORT || 3000;

// ==================== EXPRESS KEEP-ALIVE ====================
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Web server on port ${PORT}`));

// Self-ping every 14 minutes
if (RENDER_URL) {
    setInterval(() => {
        axios.get(RENDER_URL).catch(() => { });
    }, 14 * 60 * 1000);
}

// ==================== DISCORD CLIENT ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ==================== READY EVENT ====================
client.once(Events.ClientReady, async (c) => {
    console.log(`✓ Logged in as ${c.user.tag}`);

    // Register slash commands
    if (CLIENT_ID && GUILD_ID) {
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        const commands = [
            new SlashCommandBuilder()
                .setName('setup-ticket')
                .setDescription('Creates the ticket panel in this channel.')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .toJSON()
        ];

        try {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
            console.log('✓ Slash commands registered');
        } catch (err) {
            console.error('✗ Failed to register commands:', err.message);
        }
    }
});

// ==================== AUTO ROLES ====================
client.on(Events.GuildMemberAdd, async (member) => {
    const roleId = member.user.bot ? BOT_ROLE_ID : USER_ROLE_ID;
    if (!roleId) return;

    try {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
            await member.roles.add(role);
            console.log(`✓ Auto-role: ${role.name} → ${member.user.tag}`);
        }
    } catch (err) {
        console.error(`✗ Auto-role failed for ${member.user.tag}:`, err.message);
    }
});

// ==================== INTERACTIONS ====================
client.on(Events.InteractionCreate, async (interaction) => {
    // Slash Command: /setup-ticket
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-ticket') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎫 Support Tickets')
            .setDescription('Need help? Click the button below to open a private ticket with our support team.')
            .setFooter({ text: 'Support System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Create Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫')
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✓ Ticket panel created!', ephemeral: true });
        return;
    }

    // Button: Create Ticket
    if (interaction.isButton() && interaction.customId === 'create_ticket') {
        await interaction.deferReply({ ephemeral: true });

        try {
            const { guild, user } = interaction;

            const perms = [
                { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            ];
            if (SUPPORT_ROLE_ID) {
                perms.push({ id: SUPPORT_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            }

            const channel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID || undefined,
                permissionOverwrites: perms,
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle('Support Ticket')
                .setDescription(`Hello ${user}, welcome to your ticket!\nA support member will assist you shortly.\n\nClick the button below to close this ticket.`)
                .setColor('#00ff00')
                .setTimestamp();

            const closeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );

            const ping = SUPPORT_ROLE_ID ? `<@&${SUPPORT_ROLE_ID}> ${user}` : `${user}`;
            await channel.send({ content: ping, embeds: [ticketEmbed], components: [closeRow] });
            await interaction.editReply({ content: `Your ticket has been created: ${channel}` });
        } catch (err) {
            console.error('✗ Ticket creation failed:', err.message);
            await interaction.editReply({ content: 'Failed to create ticket. Please try again.' });
        }
        return;
    }

    // Button: Close Ticket
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (err) {
                console.error('✗ Ticket close failed:', err.message);
            }
        }, 5000);
        return;
    }
});

// ==================== ERROR HANDLING ====================
client.on('error', (err) => console.error('Client error:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

// ==================== LOGIN ====================
console.log('Connecting to Discord...');
client.login(TOKEN);
