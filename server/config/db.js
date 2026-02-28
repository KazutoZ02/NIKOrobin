const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('[Database] MONGODB_URI not set, running without database');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error('[Database] Error:', error.message);
    // Don't exit in production - allow app to run
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
