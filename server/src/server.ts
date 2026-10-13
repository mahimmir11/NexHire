import { createApp } from './app.js';
import { config, validateConfig } from './config/env.js';
import { checkDatabaseConnection } from './config/database.js';

async function bootstrap() {
  validateConfig();

  const app = createApp();

  const server = app.listen(config.port, async () => {
    console.log(`===============================================`);
    console.log(`🚀 NexHire Backend Server Started`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`===============================================`);

    // Test database connection on startup
    console.log('⏳ Checking MySQL database connectivity...');
    const dbStatus = await checkDatabaseConnection();
    if (dbStatus.connected) {
      console.log(`✅ Connected to MySQL database "${dbStatus.databaseName}" successfully via Prisma.`);
    } else {
      console.warn(`⚠️  Database connection issue: ${dbStatus.error}`);
      console.warn(`ℹ️  Ensure local MySQL is running and DATABASE_URL in .env has the correct credentials.`);
    }
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n🛑 Shutting down NexHire server gracefully...');
    server.close(() => {
      console.log('👋 Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
