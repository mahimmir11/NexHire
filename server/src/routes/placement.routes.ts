import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import {
  createPlacement,
  getPlacementById,
  updatePlacement,
  updatePlacementStatus,
  getStudentPlacement,
  getRecruiterPlacements,
  getAdminPlacements,
  getPlacementStats,
} from '../controllers/placement.controller.js';

export const placementRouter = Router();

// ==========================================
// 1. PLACEMENT DASHBOARD & STATISTICS
// ==========================================

// Get placement overview stats (Institutional or Recruiter company-scoped)
placementRouter.get(
  '/stats',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN, UserRole.RECRUITER),
  getPlacementStats
);

// ==========================================
// 2. STUDENT PLACEMENT RECORD
// ==========================================

// Get current student's placement record
placementRouter.get(
  '/student/my-placement',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  getStudentPlacement
);

// ==========================================
// 3. RECRUITER PLACEMENTS
// ==========================================

// Get placements belonging to recruiter's company
placementRouter.get(
  '/recruiter/all',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.SUPER_ADMIN),
  getRecruiterPlacements
);

// ==========================================
// 4. PLACEMENT ADMIN PLACEMENTS
// ==========================================

// Get all institutional placements with filters, search, and pagination
placementRouter.get(
  '/admin/all',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAdminPlacements
);

// ==========================================
// 5. PLACEMENT CREATION & WORKFLOW
// ==========================================

// Create a placement record from an eligible candidate / accepted offer
placementRouter.post(
  '/',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  createPlacement
);

// ==========================================
// 6. SPECIFIC PLACEMENT BY ID (IDOR PROTECTED)
// ==========================================

// Get detailed placement profile by ID
placementRouter.get(
  '/:id',
  authenticateUser,
  getPlacementById
);

// Update placement details
placementRouter.put(
  '/:id',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  updatePlacement
);

// Update placement status (CONFIRMED, JOINED, DEFERRED, RESCINDED, DECLINED)
placementRouter.put(
  '/:id/status',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  updatePlacementStatus
);
