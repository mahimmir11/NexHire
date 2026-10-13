import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import {
  scheduleInterview,
  rescheduleInterview,
  cancelInterview,
  completeInterview,
  recordInterviewResult,
  selectCandidateForApplication,
  getStudentInterviews,
  getRecruiterInterviews,
  getAdminInterviews,
  getInterviewById,
  createInterviewRound,
  getOpportunityInterviewRounds,
  updateInterviewRound,
  deleteInterviewRound,
} from '../controllers/interview.controller.js';

export const interviewRouter = Router();

// ==========================================
// 1. INTERVIEW ROUNDS CONFIGURATION
// ==========================================

// Create interview round for opportunity
interviewRouter.post(
  '/rounds',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  createInterviewRound
);

// Get rounds configured for an opportunity (Job or Internship)
interviewRouter.get(
  '/rounds/opportunity/:type/:id',
  authenticateUser,
  getOpportunityInterviewRounds
);

// Update round
interviewRouter.put(
  '/rounds/:id',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  updateInterviewRound
);

// Delete round
interviewRouter.delete(
  '/rounds/:id',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  deleteInterviewRound
);

// ==========================================
// 2. INTERVIEW SCHEDULING & CANDIDATE LIFECYCLE
// ==========================================

// Schedule new interview
interviewRouter.post(
  '/',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  scheduleInterview
);

// Select candidate for an application after interview rounds
interviewRouter.post(
  '/application/:id/select',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  selectCandidateForApplication
);

// ==========================================
// 3. STUDENT INTERVIEWS
// ==========================================

// View student's own interviews
interviewRouter.get(
  '/student/my-interviews',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  getStudentInterviews
);

// ==========================================
// 4. RECRUITER INTERVIEWS
// ==========================================

// View company's scheduled interviews
interviewRouter.get(
  '/recruiter/all',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.SUPER_ADMIN),
  getRecruiterInterviews
);

// ==========================================
// 5. PLACEMENT ADMIN INTERVIEWS
// ==========================================

// View all institutional interviews
interviewRouter.get(
  '/admin/all',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAdminInterviews
);

// ==========================================
// 6. SPECIFIC INTERVIEW OPERATIONS
// ==========================================

// Get interview details by ID (IDOR protected)
interviewRouter.get(
  '/:id',
  authenticateUser,
  getInterviewById
);

// Reschedule interview
interviewRouter.put(
  '/:id/reschedule',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  rescheduleInterview
);

// Cancel interview
interviewRouter.put(
  '/:id/cancel',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  cancelInterview
);

// Mark interview complete
interviewRouter.put(
  '/:id/complete',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  completeInterview
);

// Record interview result (Qualified, Not Qualified, On Hold, Absent)
interviewRouter.put(
  '/:id/result',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  recordInterviewResult
);
