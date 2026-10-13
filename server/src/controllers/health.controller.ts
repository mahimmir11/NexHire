import { Request, Response } from 'express';
import { checkDatabaseConnection, prisma } from '../config/database.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const dbStatus = await checkDatabaseConnection();

  let databaseSummary = null;

  if (dbStatus.connected) {
    try {
      const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`
        SELECT table_name as tableName 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        ORDER BY table_name ASC
      `;

      const counts = {
        users: await prisma.user.count(),
        departments: await prisma.department.count(),
        students: await prisma.student.count(),
        companies: await prisma.company.count(),
        recruiters: await prisma.recruiter.count(),
        jobs: await prisma.job.count(),
        internships: await prisma.internship.count(),
        applications: await prisma.application.count(),
        interviews: await prisma.interview.count(),
        documents: await prisma.document.count(),
        notifications: await prisma.notification.count(),
      };

      databaseSummary = {
        totalTables: tables.length,
        migrationVersion: '20260924155752_init_database_architecture',
        tables: tables.map((t) => t.tableName),
        entityCounts: counts,
      };
    } catch {
      // If table query fails, fallback gracefully
      databaseSummary = null;
    }
  }

  const isHealthy = dbStatus.connected;

  res.status(200).json({
    status: isHealthy ? 'healthy' : 'degraded',
    message: 'NexHire backend API is running successfully with Step 2 Database Architecture',
    step: 'Step 2: Database Architecture & Setup',
    completed: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    service: 'NexHire API',
    database: {
      ...dbStatus,
      summary: databaseSummary,
    },
  });
}
