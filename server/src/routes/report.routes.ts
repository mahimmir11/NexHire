import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import {
  getAnalyticsSummary,
  getReportData,
  exportReportCsv,
} from '../controllers/report.controller.js';

export const reportRouter = Router();

// Analytics summary route
reportRouter.get(
  '/analytics',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAnalyticsSummary
);

// Tabular report data route with pagination & filters
reportRouter.get(
  '/data',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getReportData
);

// CSV export route
reportRouter.get(
  '/export',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  exportReportCsv
);
