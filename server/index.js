const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const keepAlive = require('./keep_alive');

// Global Error Handlers
process.on('unhandledRejection', error => {
    console.error('[Unhandled Rejection]', error);
});
process.on('uncaughtException', error => {
    console.error('[Uncaught Exception]', error);
});

// 1. Start Express keep-alive web server for Render
keepAlive();

// 2. Print diagnostic info
console.log(`[Startup] discord.js version: ${require('discord.js').version}`);
console.log(`[Startup] Node.js version: ${process.version}`);
console.log(`[Startup] Discord Token present: ${!!config.discordToken}`);
console.log(`[Startup] Client ID: ${config.clientId || 'NOT SET'}`);
console.log(`[Startup] Guild ID: ${config.guildId || 'NOT SET'}`);

if (!config.discordToken) {
    console.error("FATAL: DISCORD_TOKEN is not set. Exiting.");
    process.exit(1);
}

// 3. Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// 4. Load Commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[Commands] Loaded: ${command.data.name}`);
        } else {
            console.warn(`[Commands] SKIPPED ${file}: missing "data" or "execute".`);
        }
    }
}

// 5. Load Events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`[Events] Loaded: ${event.name} (once: ${!!event.once})`);
    }
}

// 6. Client event listeners for errors/debug
client.on('error', error => console.error('[Client Error]', error));
client.on('warn', warning => console.warn('[Client Warn]', warning));
client.on('debug', info => console.log('[Debug]', info));

// 7. Login with timeout detection
console.log("[Startup] Calling client.login()...");

const loginTimeout = setTimeout(() => {
    console.error("=== LOGIN TIMEOUT (30s) ===");
    console.error("The bot could not connect to Discord within 30 seconds.");
    console.error("MOST LIKELY CAUSE: Privileged Gateway Intents are NOT enabled.");
    console.error("Go to https://discord.com/developers/applications -> Bot -> Enable SERVER MEMBERS INTENT and MESSAGE CONTENT INTENT");
}, 30000);

client.login(config.discordToken)
    .then(() => {
        clearTimeout(loginTimeout);
        console.log(`[Startup] ✓ Logged in successfully as ${client.user.tag}`);
    })
    .catch(err => {
        clearTimeout(loginTimeout);
        console.error("[Startup] ✗ Login FAILED:", err.message);
        console.error("[Startup] Full error:", err);
    });
