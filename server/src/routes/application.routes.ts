import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import {
  applyToOpportunity,
  checkStudentApplicationStatus,
  getStudentApplications,
  getStudentApplicationById,
  withdrawStudentApplication,
  getRecruiterApplications,
  getAdminApplications,
  getApplicationDetailsById,
  updateApplicationStatus,
  addApplicationNote,
} from '../controllers/application.controller.js';

export const applicationRouter = Router();

// ==========================================
// 1. STUDENT APPLICATION WORKFLOW
// ==========================================

// Apply to opportunity (Job or Internship)
applicationRouter.post(
  '/apply',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  applyToOpportunity
);

// Check if student has applied to a specific opportunity
applicationRouter.get(
  '/check-status/:type/:id',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  checkStudentApplicationStatus
);

// Get student's submitted applications
applicationRouter.get(
  '/student/my-applications',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  getStudentApplications
);

// Get specific student application details
applicationRouter.get(
  '/student/:id',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  getStudentApplicationById
);

// Withdraw student application (if APPLIED or UNDER_REVIEW)
applicationRouter.put(
  '/student/:id/withdraw',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  withdrawStudentApplication
);

// ==========================================
// 2. RECRUITER APPLICATION ACCESS
// ==========================================

// Get applications submitted to company opportunities
applicationRouter.get(
  '/company/all',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.SUPER_ADMIN),
  getRecruiterApplications
);

// ==========================================
// 3. PLACEMENT ADMIN APPLICATION OVERSIGHT
// ==========================================

// Get institutional applications
applicationRouter.get(
  '/admin/all',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAdminApplications
);

// ==========================================
// 4. SHARED APPLICATION DETAILS & REVIEW
// ==========================================

// Get comprehensive application details (accessible by owner student or authorized reviewer)
applicationRouter.get(
  '/:id',
  authenticateUser,
  getApplicationDetailsById
);

// Update application review status (Under Review, Shortlisted, Rejected, etc.)
applicationRouter.put(
  '/:id/status',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  updateApplicationStatus
);

// Add review note to application history
applicationRouter.post(
  '/:id/notes',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  addApplicationNote
);
