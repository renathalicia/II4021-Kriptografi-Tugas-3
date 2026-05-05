require('dotenv').config();
const app = require('./app');

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🔐 Kriptografi Server — Encrypted Messaging System         ║
║                                                               ║
║   ✓ Server berhasil dijalankan                               ║
║   ├─ Environment: ${NODE_ENV.padEnd(39)} ║
║   ├─ Port: ${String(PORT).padEnd(47)} ║
║   ├─ URL: http://localhost:${String(PORT).padEnd(40)} ║
║   └─ Health Check: http://localhost:${String(PORT)}/health${' '.repeat(24)} ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', {
    reason,
    promise
  });
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});
