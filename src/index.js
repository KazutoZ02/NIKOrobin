// src/index.js
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const {
    DISCORD_BOT_TOKEN,
    GUILD_ID,
    BOT_STATUS,
    initTicketData
} = require('./config');

// Create client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['CHANNEL', 'MESSAGE']
});

// Command collection
client.commands = new Collection();

// Load all commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

async function loadCommands() {
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`⚠️ Command at ${filePath} is missing "data" or "execute" property`);
        }
    }
}

// Load all events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

async function loadEvents() {
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`✅ Loaded event: ${event.name}`);
    }
}

// Global error handler
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Main startup
async function main() {
    console.log('🤖 Starting Niko Robin Bot...\n');
    
    await initTicketData();
    await loadEvents();
    await loadCommands();
    
    // Login to Discord
    await client.login(DISCORD_BOT_TOKEN);
}

main();
