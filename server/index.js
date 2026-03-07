const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const keepAlive = require('./keep_alive');

// 1. Initialize Express and Keep-Alive for Render
keepAlive();

// 2. Initialize Discord Client
// We need intents to read messages, manage channels, and listen to member joins
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// Global Error Handlers to catch silent crashes
process.on('unhandledRejection', error => {
    console.error('[Unhandled Rejection]', error);
});

process.on('uncaughtException', error => {
    console.error('[Uncaught Exception]', error);
});

// Check configuration before logging in
console.log(`[Startup] Discord Token present: ${!!config.discordToken}`);
console.log(`[Startup] Client ID: ${config.clientId || 'Not Set'}`);
console.log(`[Startup] Guild ID: ${config.guildId || 'Not Set'}`);

if (!config.discordToken) {
    console.error("CRITICAL ERROR: No Discord token found in configuration. Bot cannot start.");
    process.exit(1);
}

// Login
console.log("[Startup] Attempting to log in to Discord...");

// Timeout to detect a hung login
const loginTimeout = setTimeout(() => {
    console.error("[Startup] LOGIN TIMED OUT after 30 seconds. Possible causes:");
    console.error("  1. Invalid DISCORD_TOKEN");
    console.error("  2. Privileged Gateway Intents (Server Members) not enabled in Discord Developer Portal");
    console.error("  3. Network issue on the hosting platform");
}, 30000);

client.login(config.discordToken)
    .then(() => {
        clearTimeout(loginTimeout);
        console.log("[Startup] Login call successful (Promise resolved)");
    })
    .catch(err => {
        clearTimeout(loginTimeout);
        console.error("[Startup Login Error]", err);
    });

// Monitor client errors
client.on('error', error => {
    console.error('[Discord Client Error]', error);
});

client.on('warn', warning => {
    console.warn('[Discord Client Warning]', warning);
});

client.on('debug', info => {
    console.log('[Discord Debug]', info);
});
