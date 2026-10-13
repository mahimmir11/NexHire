import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { documentUpload } from '../middlewares/upload.middleware.js';
import {
  createOffer,
  updateOffer,
  acceptOffer,
  rejectOffer,
  getStudentOffers,
  getRecruiterOffers,
  getAdminOffers,
  getOfferById,
  uploadOfferDocument,
} from '../controllers/offer.controller.js';

export const offerRouter = Router();

// ==========================================
// 1. OFFER CREATION & MANAGEMENT
// ==========================================

// Create offer for selected candidate
offerRouter.post(
  '/',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  createOffer
);

// Update offer terms (if still OFFERED)
offerRouter.put(
  '/:id',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  updateOffer
);

// Upload & attach offer letter document
offerRouter.post(
  '/:id/document',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  documentUpload.single('file'),
  uploadOfferDocument
);

// ==========================================
// 2. STUDENT OFFERS & ACTIONS
// ==========================================

// View student's offers
offerRouter.get(
  '/student/my-offers',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  getStudentOffers
);

// Student accepts offer
offerRouter.put(
  '/:id/accept',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  acceptOffer
);

// Student rejects offer
offerRouter.put(
  '/:id/reject',
  authenticateUser,
  requireRole(UserRole.STUDENT),
  rejectOffer
);

// ==========================================
// 3. RECRUITER OFFERS
// ==========================================

// View company's extended offers
offerRouter.get(
  '/recruiter/all',
  authenticateUser,
  requireRole(UserRole.RECRUITER, UserRole.SUPER_ADMIN),
  getRecruiterOffers
);

// ==========================================
// 4. PLACEMENT ADMIN OFFERS
// ==========================================

// View institutional offers
offerRouter.get(
  '/admin/all',
  authenticateUser,
  requireRole(UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN),
  getAdminOffers
);

// ==========================================
// 5. INDIVIDUAL OFFER DETAILS
// ==========================================

// Get offer by ID
offerRouter.get(
  '/:id',
  authenticateUser,
  getOfferById
);
