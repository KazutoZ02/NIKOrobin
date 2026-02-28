require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const startBot = require('./config/bot');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Start Discord Bot
startBot();

// Start Server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     🌟 ROYAL'S PARADISE SERVER RUNNING 🌟         ║
╠═══════════════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}
║  Port: ${PORT}
║  URL: http://localhost:${PORT}
╚═══════════════════════════════════════════════════╝
  `);
});
