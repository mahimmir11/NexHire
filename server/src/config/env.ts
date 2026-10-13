import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Check for .env in current directory or root directory
const rootEnvPath = path.resolve(process.cwd(), '../.env');
const currentEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(currentEnvPath)) {
  dotenv.config({ path: currentEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  clientOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtCookieExpiresIn: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'nexhire_development_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtCookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7', 10),
};

export function validateConfig(): void {
  if (!config.databaseUrl) {
    console.warn(
      '⚠️  [CONFIG WARNING] DATABASE_URL is not set in environment variables. Database features will fail until DATABASE_URL is configured.'
    );
  }
  if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
    throw new Error('❌ [CONFIG ERROR] JWT_SECRET must be set in production environment.');
  }
}
