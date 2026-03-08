// src/config.js
const path = require('path');
const fs = require('fs');

// Base directory
const BASE_DIR = path.join(__dirname, '..');

// Discord Configuration
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "YOUR_BOT_TOKEN_HERE";

// Guild ID (Server ID) - Only works in this guild
const GUILD_ID = "1472931536461365289"; // Replace with your actual guild ID

// Channel IDs
const WELCOME_CHANNEL_ID = "1472931536461365289";
const LEAVE_CHANNEL_ID = "1472933955652030642";

// Role IDs
const BOT_ROLE_ID = "1472935152421306603";
const USER_ROLE_ID = "1472934932966932490";

// Image paths
const WELCOME_IMAGE = path.join(BASE_DIR, 'images', 'welcome.png');
const LEAVE_IMAGE = path.join(BASE_DIR, 'images', 'leave.png');
const BANNER_IMAGE = path.join(BASE_DIR, 'images', 'banner.jpg');

// Bot settings
const BOT_STATUS = "Watching over the crew";

// JSON file for persistent ticket data
const TICKET_DATA_FILE = path.join(BASE_DIR, 'ticket_data.json');

// Initialize ticket data file if not exists
function initTicketData() {
    if (!fs.existsSync(TICKET_DATA_FILE)) {
        const initialData = {
            tickets: {},
            settings: {
                createRoles: [],
                claimRoles: []
            }
        };
        fs.writeFileSync(TICKET_DATA_FILE, JSON.stringify(initialData, null, 4));
    }
}

// Load ticket data
function loadTicketData() {
    initTicketData();
    const data = fs.readFileSync(TICKET_DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Save ticket data
function saveTicketData(data) {
    fs.writeFileSync(TICKET_DATA_FILE, JSON.stringify(data, null, 4));
}

// Check if image exists
function imageExists(imagePath) {
    return fs.existsSync(imagePath);
}

module.exports = {
    DISCORD_BOT_TOKEN,
    GUILD_ID,
    WELCOME_CHANNEL_ID,
    LEAVE_CHANNEL_ID,
    BOT_ROLE_ID,
    USER_ROLE_ID,
    WELCOME_IMAGE,
    LEAVE_IMAGE,
    BANNER_IMAGE,
    BOT_STATUS,
    TICKET_DATA_FILE,
    imageExists,
    loadTicketData,
    saveTicketData,
    initTicketData
};
