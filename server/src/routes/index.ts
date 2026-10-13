import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { studentRouter } from './student.routes.js';
import { companyRouter } from './company.routes.js';
import { opportunityRouter } from './opportunity.routes.js';
import { applicationRouter } from './application.routes.js';
import { interviewRouter } from './interview.routes.js';
import { offerRouter } from './offer.routes.js';
import { placementRouter } from './placement.routes.js';
import { notificationRouter } from './notification.routes.js';
import { adminRouter } from './admin.routes.js';
import { reportRouter } from './report.routes.js';

export const apiRouter = Router();

// Mount health routes under /api/health
apiRouter.use('/health', healthRouter);

// Mount authentication and authorization routes under /api/auth
apiRouter.use('/auth', authRouter);

// Mount student module routes under /api/student
apiRouter.use('/student', studentRouter);

// Mount company & recruiter module routes under /api/company
apiRouter.use('/company', companyRouter);

// Mount jobs, internships & eligibility routes under /api/opportunities
apiRouter.use('/opportunities', opportunityRouter);

// Mount applications module routes under /api/applications
apiRouter.use('/applications', applicationRouter);

// Mount interview management routes under /api/interviews
apiRouter.use('/interviews', interviewRouter);

// Mount offer management routes under /api/offers
apiRouter.use('/offers', offerRouter);

// Mount placement management routes under /api/placements
apiRouter.use('/placements', placementRouter);

// Mount notification routes under /api/notifications
apiRouter.use('/notifications', notificationRouter);

// Mount administration routes under /api/admin
apiRouter.use('/admin', adminRouter);

// Mount reports & analytics routes under /api/reports
apiRouter.use('/reports', reportRouter);

