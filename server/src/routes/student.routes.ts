import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '../middlewares/auth.middleware.js';
import { documentUpload } from '../middlewares/upload.middleware.js';
import {
  getStudentProfile,
  updateStudentProfile,
  getAcademicInfo,
  updateAcademicInfo,
  createAcademicRecord,
  deleteAcademicRecord,
  getStudentSkills,
  addStudentSkill,
  removeStudentSkill,
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  getCareerInfo,
  updateCareerInfo,
  getStudentDocuments,
  uploadStudentDocument,
  downloadStudentDocument,
  deleteStudentDocument,
  getStudentDashboardSummary,
} from '../controllers/student.controller.js';

export const studentRouter = Router();

// Enforce authentication & STUDENT role across all routes in this router
studentRouter.use(authenticateUser);
studentRouter.use(requireRole(UserRole.STUDENT));

// ==========================================
// DASHBOARD
// ==========================================
studentRouter.get('/dashboard', getStudentDashboardSummary);

// ==========================================
// PROFILE (PERSONAL INFORMATION)
// ==========================================
studentRouter.get('/profile', getStudentProfile);
studentRouter.put('/profile', updateStudentProfile);

// ==========================================
// ACADEMIC INFORMATION
// ==========================================
studentRouter.get('/academic', getAcademicInfo);
studentRouter.put('/academic', updateAcademicInfo);
studentRouter.post('/academic/records', createAcademicRecord);
studentRouter.delete('/academic/records/:id', deleteAcademicRecord);

// ==========================================
// SKILLS
// ==========================================
studentRouter.get('/skills', getStudentSkills);
studentRouter.post('/skills', addStudentSkill);
studentRouter.delete('/skills/:skillId', removeStudentSkill);

// ==========================================
// CERTIFICATIONS
// ==========================================
studentRouter.get('/certifications', getCertifications);
studentRouter.post('/certifications', createCertification);
studentRouter.put('/certifications/:id', updateCertification);
studentRouter.delete('/certifications/:id', deleteCertification);

// ==========================================
// CAREER INFORMATION
// ==========================================
studentRouter.get('/career', getCareerInfo);
studentRouter.put('/career', updateCareerInfo);

// ==========================================
// DOCUMENTS & RESUME
// ==========================================
studentRouter.get('/documents', getStudentDocuments);
studentRouter.post('/documents', documentUpload.single('file'), uploadStudentDocument);
studentRouter.get('/documents/:id/download', downloadStudentDocument);
studentRouter.delete('/documents/:id', deleteStudentDocument);
