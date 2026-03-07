const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const axios = require('axios');
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
console.log('========== STARTUP DIAGNOSTICS ==========');
console.log(`discord.js version: ${require('discord.js').version}`);
console.log(`Node.js version: ${process.version}`);
console.log(`Token present: ${!!config.discordToken}`);
console.log(`Token length: ${config.discordToken ? config.discordToken.length : 0}`);
console.log(`Token starts with: ${config.discordToken ? config.discordToken.substring(0, 10) + '...' : 'N/A'}`);
console.log(`Client ID: ${config.clientId || 'NOT SET'}`);
console.log(`Guild ID: ${config.guildId || 'NOT SET'}`);
console.log('==========================================');

if (!config.discordToken) {
    console.error("FATAL: DISCORD_TOKEN is not set. Exiting.");
    process.exit(1);
}

// 3. Test token with a simple HTTP request to Discord API BEFORE WebSocket login
async function testTokenAndLogin() {
    console.log('[Pre-Check] Testing token with Discord REST API...');
    try {
        const response = await axios.get('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bot ${config.discordToken}` }
        });
        console.log(`[Pre-Check] ✓ Token is VALID! Bot username: ${response.data.username}#${response.data.discriminator} (ID: ${response.data.id})`);
    } catch (err) {
        console.error(`[Pre-Check] ✗ Token is INVALID! Discord API returned: ${err.response ? err.response.status + ' ' + JSON.stringify(err.response.data) : err.message}`);
        console.error('[Pre-Check] Please reset your bot token in the Discord Developer Portal and update DISCORD_TOKEN in Render.');
        return; // Don't try to login with a bad token
    }

    // 4. Initialize Discord Client
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

    // 5. Load Commands
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

    // 6. Load Events
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

    // 7. Client event listeners
    client.on('error', error => console.error('[Client Error]', error));
    client.on('warn', warning => console.warn('[Client Warn]', warning));

    // 8. Login with timeout
    console.log('[Login] Connecting to Discord Gateway...');

    const loginTimeout = setTimeout(() => {
        console.error('=== LOGIN TIMEOUT (30s) ===');
        console.error('Bot could not connect. Token validated OK, so this might be a network/firewall issue on the hosting platform.');
    }, 30000);

    try {
        await client.login(config.discordToken);
        clearTimeout(loginTimeout);
        console.log(`[Login] ✓ SUCCESS! Bot is online as ${client.user.tag}`);
    } catch (err) {
        clearTimeout(loginTimeout);
        console.error(`[Login] ✗ FAILED: ${err.message}`);
        if (err.code === 'DisallowedIntents' || err.code === 4014) {
            console.error('[Login] CAUSE: Privileged Gateway Intents are not enabled in Discord Developer Portal.');
        } else if (err.code === 'TokenInvalid') {
            console.error('[Login] CAUSE: The bot token is invalid. Reset it in the Developer Portal.');
        }
    }
}

testTokenAndLogin();
