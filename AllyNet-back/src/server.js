const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { initializeSocketIO } = require('./sockets');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5000;

/**
 * Server Bootstrap
 * Initializes database connection, Socket.IO, and starts HTTP server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocketIO(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`
🚀 AllyNet Backend Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 API: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/api/health
🔌 Socket.IO: ws://localhost:${PORT}/emergencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

