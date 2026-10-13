import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  login,
  logout,
  getCurrentUser,
  testProtected,
  testSuperAdminOnly,
  testPlacementAdminAccess,
  testStudentAccess,
  testRecruiterAccess,
} from '../controllers/auth.controller.js';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

// ==========================================
// PUBLIC AUTHENTICATION ROUTES
// ==========================================
authRouter.post('/login', login);
authRouter.post('/logout', logout);

// ==========================================
// AUTHENTICATED USER SESSIONS
// ==========================================
authRouter.get('/me', authenticateUser, getCurrentUser);

// ==========================================
// RBAC VERIFICATION / TEST ROUTES
// ==========================================
authRouter.get('/test/protected', authenticateUser, testProtected);
authRouter.get('/test/super-admin', authenticateUser, requireRole(UserRole.SUPER_ADMIN), testSuperAdminOnly);
authRouter.get(
  '/test/placement-admin',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  testPlacementAdminAccess
);
authRouter.get('/test/student', authenticateUser, requireRole(UserRole.STUDENT), testStudentAccess);
authRouter.get('/test/recruiter', authenticateUser, requireRole(UserRole.RECRUITER), testRecruiterAccess);
