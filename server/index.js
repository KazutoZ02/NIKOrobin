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

// 2. Diagnostics
console.log('========== STARTUP DIAGNOSTICS ==========');
console.log(`discord.js: ${require('discord.js').version} | Node: ${process.version}`);
console.log(`Token: present=${!!config.discordToken} length=${config.discordToken ? config.discordToken.length : 0}`);
console.log(`Client ID: ${config.clientId || 'NOT SET'}`);
console.log(`Guild ID: ${config.guildId || 'NOT SET'}`);
console.log('==========================================');

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
        console.log(`[Events] Loaded: ${event.name}`);
    }
}

// 6. Client event listeners
client.on('error', error => console.error('[Client Error]', error));
client.on('warn', warning => console.warn('[Client Warn]', warning));

// 7. Login with retry logic for rate limits
async function loginWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[Login] Attempt ${attempt}/${maxRetries}...`);
        try {
            await client.login(config.discordToken);
            console.log(`[Login] ✓ SUCCESS! Bot is online as ${client.user.tag}`);
            return; // Success - exit the loop
        } catch (err) {
            console.error(`[Login] ✗ Attempt ${attempt} failed: ${err.message}`);

            if (err.code === 'DisallowedIntents' || err.code === 4014) {
                console.error('[Login] CAUSE: Enable SERVER MEMBERS INTENT in Discord Developer Portal.');
                return; // Don't retry for intent issues
            }
            if (err.code === 'TokenInvalid') {
                console.error('[Login] CAUSE: Token is invalid. Reset it in Developer Portal.');
                return; // Don't retry for bad tokens
            }

            // For rate limits or network issues, wait and retry
            if (attempt < maxRetries) {
                const waitTime = attempt * 15000; // 15s, 30s, 45s
                console.log(`[Login] Waiting ${waitTime / 1000}s before retry (rate limit cooldown)...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    console.error(`[Login] Failed after ${maxRetries} attempts.`);
}

// Wait 5 seconds before first login attempt to let rate limits cool down
console.log('[Login] Waiting 5 seconds before connecting (rate limit cooldown)...');
setTimeout(() => {
    loginWithRetry(3);
}, 5000);
