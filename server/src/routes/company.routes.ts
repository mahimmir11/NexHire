import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { documentUpload } from '../middlewares/upload.middleware.js';
import {
  getCurrentCompanyProfile,
  updateCurrentCompanyProfile,
  uploadCompanyLogo,
  getCompanyRecruiters,
  addCompanyRecruiter,
  updateCompanyRecruiter,
  getCompanyDashboardSummary,
  getAllCompanies,
  getPendingCompanies,
  getCompanyDetailsAdmin,
  verifyCompany,
} from '../controllers/company.controller.js';

export const companyRouter = Router();

// All company routes require authentication
companyRouter.use(authenticateUser);

// ==========================================
// 1. RECRUITER ROUTES (Scoped to authenticated recruiter's company)
// ==========================================
companyRouter.get(
  '/my-company',
  requireRole(UserRole.RECRUITER),
  getCurrentCompanyProfile
);

companyRouter.put(
  '/my-company',
  requireRole(UserRole.RECRUITER),
  updateCurrentCompanyProfile
);

companyRouter.post(
  '/my-company/logo',
  requireRole(UserRole.RECRUITER),
  documentUpload.single('logo'),
  uploadCompanyLogo
);

companyRouter.get(
  '/my-company/recruiters',
  requireRole(UserRole.RECRUITER),
  getCompanyRecruiters
);

companyRouter.post(
  '/my-company/recruiters',
  requireRole(UserRole.RECRUITER),
  addCompanyRecruiter
);

companyRouter.put(
  '/my-company/recruiters/:id',
  requireRole(UserRole.RECRUITER),
  updateCompanyRecruiter
);

companyRouter.get(
  '/my-company/dashboard',
  requireRole(UserRole.RECRUITER),
  getCompanyDashboardSummary
);

// ==========================================
// 2. PLACEMENT ADMIN & SUPER ADMIN ROUTES
// ==========================================
companyRouter.get(
  '/admin/all',
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAllCompanies
);

companyRouter.get(
  '/admin/pending',
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getPendingCompanies
);

companyRouter.get(
  '/admin/:id',
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getCompanyDetailsAdmin
);

companyRouter.put(
  '/admin/:id/verify',
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  verifyCompany
);
