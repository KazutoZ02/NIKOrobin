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

// 7. Login with timeout and retry
async function loginWithRetry(maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[Login] Attempt ${attempt}/${maxRetries}...`);

        try {
            // Race between login and a 30-second timeout
            await Promise.race([
                client.login(config.discordToken),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), 30000)
                )
            ]);

            console.log(`[Login] ✓ SUCCESS! Bot is online as ${client.user.tag}`);
            return; // Done
        } catch (err) {
            console.error(`[Login] ✗ Attempt ${attempt} failed: ${err.message}`);

            // Destroy the client's WebSocket connection before retrying
            try { client.destroy(); } catch (_) { }

            if (err.message === 'LOGIN_TIMEOUT') {
                console.error('[Login] Connection timed out. Retrying...');
            } else if (err.code === 'DisallowedIntents' || err.code === 4014) {
                console.error('[Login] CAUSE: Enable SERVER MEMBERS INTENT in Discord Developer Portal.');
                return;
            } else if (err.code === 'TokenInvalid') {
                console.error('[Login] CAUSE: Token is invalid. Reset it in Developer Portal.');
                return;
            }

            if (attempt < maxRetries) {
                const waitTime = attempt * 10000; // 10s, 20s, 30s, 40s
                console.log(`[Login] Waiting ${waitTime / 1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));

                // Re-login requires a fresh client token setup
                // client.destroy() was already called above
            }
        }
    }
    console.error(`[Login] Failed after ${maxRetries} attempts. The bot will NOT be online.`);
    console.error('[Login] Check: 1) Token is correct 2) Intents are enabled 3) Node.js version is 18-22');
}

// Start login after a brief delay
console.log('[Login] Starting login in 3 seconds...');
setTimeout(() => {
    loginWithRetry(5);
}, 3000);
