import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global prisma in development to prevent multiple instances during hot-reloads
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export interface DatabaseStatus {
  connected: boolean;
  provider: string;
  databaseName: string;
  error?: string;
}

export async function checkDatabaseConnection(): Promise<DatabaseStatus> {
  try {
    // Perform simple ping query to verify database engine connectivity
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      provider: 'mysql',
      databaseName: 'nexhire',
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error';
    return {
      connected: false,
      provider: 'mysql',
      databaseName: 'nexhire',
      error: errorMessage,
    };
  }
}
