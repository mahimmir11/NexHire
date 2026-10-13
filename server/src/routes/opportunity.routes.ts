import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import {
  getMyCompanyJobs,
  createJob,
  updateJob,
  submitJobForApproval,
  closeJob,
  getMyCompanyInternships,
  createInternship,
  updateInternship,
  submitInternshipForApproval,
  closeInternship,
  discoverOpportunities,
  getJobDetails,
  getInternshipDetails,
  checkStudentEligibilityForOpportunity,
  getAdminOpportunities,
  reviewOpportunity,
} from '../controllers/opportunity.controller.js';

export const opportunityRouter = Router();

// All opportunity routes require authentication
opportunityRouter.use(authenticateUser);

// ==========================================
// 1. DISCOVERY & OPPORTUNITY DETAILS (Students, Recruiters, Admins)
// ==========================================
opportunityRouter.get('/discover', discoverOpportunities);
opportunityRouter.get('/jobs/:id', getJobDetails);
opportunityRouter.get('/internships/:id', getInternshipDetails);
opportunityRouter.get(
  '/check-eligibility/:type/:id',
  requireRole(UserRole.STUDENT),
  checkStudentEligibilityForOpportunity
);

// ==========================================
// 2. RECRUITER OPPORTUNITY MANAGEMENT
// ==========================================
opportunityRouter.get('/recruiter/jobs', requireRole(UserRole.RECRUITER), getMyCompanyJobs);
opportunityRouter.post('/recruiter/jobs', requireRole(UserRole.RECRUITER), createJob);
opportunityRouter.put('/recruiter/jobs/:id', requireRole(UserRole.RECRUITER), updateJob);
opportunityRouter.put('/recruiter/jobs/:id/submit', requireRole(UserRole.RECRUITER), submitJobForApproval);
opportunityRouter.put('/recruiter/jobs/:id/close', requireRole(UserRole.RECRUITER), closeJob);

opportunityRouter.get('/recruiter/internships', requireRole(UserRole.RECRUITER), getMyCompanyInternships);
opportunityRouter.post('/recruiter/internships', requireRole(UserRole.RECRUITER), createInternship);
opportunityRouter.put('/recruiter/internships/:id', requireRole(UserRole.RECRUITER), updateInternship);
opportunityRouter.put('/recruiter/internships/:id/submit', requireRole(UserRole.RECRUITER), submitInternshipForApproval);
opportunityRouter.put('/recruiter/internships/:id/close', requireRole(UserRole.RECRUITER), closeInternship);

// ==========================================
// 3. PLACEMENT ADMIN & SUPER ADMIN OVERSIGHT
// ==========================================
opportunityRouter.get(
  '/admin/all',
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAdminOpportunities
);

opportunityRouter.put(
  '/admin/:type/:id/review',
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  reviewOpportunity
);
