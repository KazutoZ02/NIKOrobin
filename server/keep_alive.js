const express = require('express');
const axios = require('axios');
const config = require('./config');

const app = express();

app.get('/', (req, res) => {
    res.send('Bot is running! Discord Ticket and Auto-Role system active.');
});

function keepAlive() {
    app.listen(config.port, () => {
        console.log(`[Keep-Alive] Web server listening on port ${config.port}`);
    });

    // Self-ping to keep Render free tier alive
    // Render spins down free tier instances after 15 minutes of inactivity
    if (config.renderExternalUrl) {
        const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

        setInterval(async () => {
            try {
                await axios.get(config.renderExternalUrl);
                console.log(`[Keep-Alive] Pinged self at ${config.renderExternalUrl}`);
            } catch (error) {
                console.error(`[Keep-Alive] Error pinging self: ${error.message}`);
            }
        }, PING_INTERVAL_MS);
    } else {
        console.log('[Keep-Alive] RENDER_EXTERNAL_URL is not set. Self-pinging is disabled.');
    }
}

module.exports = keepAlive;
