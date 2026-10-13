import { checkDatabaseConnection, prisma } from '../config/database.js';
import { config } from '../config/env.js';

async function testConnection() {
  console.log('🔍 Testing MySQL Database connection via Prisma...');
  console.log(`📡 URL Configured: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

  const status = await checkDatabaseConnection();

  if (status.connected) {
    console.log('✅ Connection successful!');
    console.log(`📦 Database: "${status.databaseName}" is reachable and responding.`);
  } else {
    console.error('❌ Connection failed!');
    console.error(`🚨 Error Details: ${status.error}`);
    console.info('\n💡 To resolve this:');
    console.info('1. Open .env file in the project root or server folder.');
    console.info('2. Update DATABASE_URL with your actual MySQL password:');
    console.info('   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/nexhire"');
    console.info('3. Ensure MySQL service (MySQL80) is running.');
  }

  await prisma.$disconnect();
  process.exit(status.connected ? 0 : 1);
}

testConnection();
