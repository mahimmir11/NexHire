import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import {
  getAdminOverviewStats,
  getUsersList,
  updateUserStatus,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAuditLogs,
  getSystemSettings,
  updateSystemSettings,
} from '../controllers/admin.controller.js';

export const adminRouter = Router();

// ==========================================
// 1. ADMIN OVERVIEW & DASHBOARD
// ==========================================
adminRouter.get(
  '/overview',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAdminOverviewStats
);

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
adminRouter.get(
  '/users',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getUsersList
);

adminRouter.put(
  '/users/:id/status',
  authenticateUser,
  requireRole(UserRole.SUPER_ADMIN),
  updateUserStatus
);

// ==========================================
// 3. DEPARTMENT MANAGEMENT
// ==========================================
adminRouter.get(
  '/departments',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getDepartments
);

adminRouter.post(
  '/departments',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  createDepartment
);

adminRouter.put(
  '/departments/:id',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  updateDepartment
);

adminRouter.delete(
  '/departments/:id',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  deleteDepartment
);

// ==========================================
// 4. AUDIT LOGS
// ==========================================
adminRouter.get(
  '/audit-logs',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAuditLogs
);

// ==========================================
// 5. SYSTEM SETTINGS
// ==========================================
adminRouter.get(
  '/settings',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getSystemSettings
);

adminRouter.put(
  '/settings',
  authenticateUser,
  requireRole(UserRole.SUPER_ADMIN),
  updateSystemSettings
);
