require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const initializeBot = require('./config/bot');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Initialize Discord Bot
initializeBot();

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});
