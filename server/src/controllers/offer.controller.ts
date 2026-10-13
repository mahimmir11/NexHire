import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ApplicationStatus, DocumentType, OfferStatus, Prisma, UserRole } from '@prisma/client';
import {
  validateCreateOfferInput,
  validateStudentOfferResponseInput,
  validateUpdateOfferInput,
} from '../validations/offer.validation.js';
import { storageService } from '../services/storage.service.js';

/**
 * Helper: Retrieve authenticated student record
 */
async function getAuthenticatedStudent(userId: number) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, email: true, role: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  });
}

/**
 * Helper: Retrieve authenticated recruiter record with company
 */
async function getAuthenticatedRecruiter(userId: number) {
  return prisma.recruiter.findUnique({
    where: { userId },
    include: {
      company: { select: { id: true, name: true, verificationStatus: true } },
    },
  });
}

// ==========================================
// 1. OFFER CREATION & MANAGEMENT
// ==========================================

/**
 * Recruiter or Placement Admin creates an official employment / internship offer.
 * Business Rules:
 * - Application MUST exist and be in 'SELECTED' state.
 * - Recruiter can only create offers for candidates selected in their company's opportunities.
 * - Placement Admin has institutional authority.
 * - Students CANNOT create offers.
 * - Transition Application status to 'OFFER_RECEIVED' with full status history.
 */
export async function createOffer(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreateOfferInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid offer parameters.',
        errors: validation.errors,
      });
      return;
    }

    const {
      applicationId,
      designation,
      salary,
      stipend,
      currency,
      location,
      offerDate,
      joiningDate,
      acceptanceDeadline,
      offerLetterDocumentId,
    } = validation.value;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        internship: true,
        student: { select: { id: true, fullName: true, studentId: true } },
        offers: { where: { status: { in: [OfferStatus.OFFERED, OfferStatus.ACCEPTED] } } },
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const oppCompanyId = application.job?.companyId || application.internship?.companyId;
    if (!oppCompanyId) {
      res.status(400).json({ success: false, message: 'Application is not linked to a company opportunity.' });
      return;
    }

    // Role check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== oppCompanyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only create offers for your company’s selected candidates.',
        });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students cannot create offers.' });
      return;
    }

    // Candidate Eligibility check: MUST BE IN SELECTED STATE
    if (application.status !== ApplicationStatus.SELECTED && application.status !== ApplicationStatus.OFFER_RECEIVED) {
      res.status(400).json({
        success: false,
        message: `Cannot create an offer for an application in '${application.status}' state. Candidate must be marked SELECTED first.`,
      });
      return;
    }

    // Check if an active offer already exists
    if (application.offers.length > 0) {
      res.status(400).json({
        success: false,
        message: 'An active offer already exists for this application. Please update the existing offer if terms have changed.',
      });
      return;
    }

    // Verify document if provided
    if (offerLetterDocumentId) {
      const doc = await prisma.document.findUnique({ where: { id: offerLetterDocumentId } });
      if (!doc) {
        res.status(400).json({ success: false, message: 'Specified offer letter document not found.' });
        return;
      }
    }

    const offer = await prisma.$transaction(async (tx) => {
      // 1. Create Offer
      const createdOffer = await tx.offer.create({
        data: {
          applicationId,
          studentId: application.studentId,
          companyId: oppCompanyId,
          jobId: application.jobId,
          internshipId: application.internshipId,
          designation,
          salary: salary !== null && salary !== undefined ? new Prisma.Decimal(salary) : null,
          stipend: stipend !== null && stipend !== undefined ? new Prisma.Decimal(stipend) : null,
          currency: currency || 'INR',
          location,
          offerDate: new Date(offerDate || Date.now()),
          joiningDate: joiningDate ? new Date(joiningDate) : null,
          acceptanceDeadline: acceptanceDeadline ? new Date(acceptanceDeadline) : null,
          offerLetterDocumentId: offerLetterDocumentId || null,
          status: OfferStatus.OFFERED,
        },
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              department: { select: { code: true, name: true } },
              user: { select: { email: true } },
            },
          },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
          offerDocument: true,
        },
      });

      // 2. Update Application Status to OFFER_RECEIVED
      await tx.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.OFFER_RECEIVED,
          statusRemarks: `Official offer extended for position: ${designation}. Compensation: ${
            salary ? `${salary} ${currency}/yr` : `${stipend} ${currency}/mo`
          }`,
        },
      });

      // 3. Create Application Status History
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          previousStatus: application.status,
          newStatus: ApplicationStatus.OFFER_RECEIVED,
          changedById: req.user!.id,
          note: `Formal offer issued for ${designation} (${location}) with joining target ${
            joiningDate ? new Date(joiningDate).toLocaleDateString() : 'TBD'
          }.`,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE_OFFER',
          entity: 'Offer',
          entityId: String(createdOffer.id),
          newValues: JSON.stringify({
            applicationId,
            designation,
            salary,
            stipend,
            location,
          }),
        },
      });

      return createdOffer;
    });

    res.status(201).json({
      success: true,
      message: `Offer successfully extended to candidate for position: ${offer.designation}.`,
      data: {
        ...offer,
        salaryCtc: offer.salary,
      },
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ success: false, message: 'Failed to create offer.' });
  }
}

/**
 * Update an existing offer terms (only permitted while offer is in OFFERED status).
 */
export async function updateOffer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid offer ID.' });
      return;
    }

    const validation = validateUpdateOfferInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid offer update parameters.',
        errors: validation.errors,
      });
      return;
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer not found.' });
      return;
    }

    // Role check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== offer.companyId) {
        res.status(403).json({ success: false, message: 'Access denied: You can only update your company’s offers.' });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students cannot modify offer terms.' });
      return;
    }

    if (offer.status !== OfferStatus.OFFERED) {
      res.status(400).json({
        success: false,
        message: `Cannot update offer terms because the offer is already ${offer.status}.`,
      });
      return;
    }

    const { designation, salary, stipend, currency, location, joiningDate, acceptanceDeadline, offerLetterDocumentId } =
      validation.value;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.offer.update({
        where: { id },
        data: {
          ...(designation && { designation }),
          ...(salary !== undefined && { salary: salary !== null ? new Prisma.Decimal(salary) : null }),
          ...(stipend !== undefined && { stipend: stipend !== null ? new Prisma.Decimal(stipend) : null }),
          ...(currency && { currency }),
          ...(location && { location }),
          ...(joiningDate !== undefined && { joiningDate: joiningDate ? new Date(joiningDate) : null }),
          ...(acceptanceDeadline !== undefined && {
            acceptanceDeadline: acceptanceDeadline ? new Date(acceptanceDeadline) : null,
          }),
          ...(offerLetterDocumentId !== undefined && { offerLetterDocumentId }),
        },
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          student: { select: { id: true, fullName: true, studentId: true } },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
          offerDocument: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE_OFFER',
          entity: 'Offer',
          entityId: String(id),
          newValues: JSON.stringify(validation.value),
        },
      });

      return updatedOffer;
    });

    res.json({
      success: true,
      message: 'Offer details successfully updated.',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ success: false, message: 'Failed to update offer.' });
  }
}

// ==========================================
// 2. STUDENT OFFER ACCEPTANCE & REJECTION
// ==========================================

/**
 * Student accepts a formal offer.
 * Business Rules:
 * - Student must be the owner of the offer.
 * - Offer status must currently be OFFERED.
 * - Offer status -> ACCEPTED.
 * - Application status -> OFFER_ACCEPTED.
 * - Application status history recorded.
 * - (Placement record creation will happen in Step 9).
 */
export async function acceptOffer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid offer ID.' });
      return;
    }

    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(403).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { application: true, company: true },
    });

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer not found.' });
      return;
    }

    // IDOR verification
    if (offer.studentId !== student.id) {
      res.status(403).json({ success: false, message: 'Access denied: You can only respond to your own offers.' });
      return;
    }

    if (offer.status !== OfferStatus.OFFERED) {
      res.status(400).json({
        success: false,
        message: `This offer is no longer in an actionable state (Current status: ${offer.status}).`,
      });
      return;
    }

    const validation = validateStudentOfferResponseInput(req.body);
    const responseNotes = validation.value?.responseNotes || 'Offer officially accepted by candidate.';

    const acceptedOffer = await prisma.$transaction(async (tx) => {
      // 1. Update Offer
      const updated = await tx.offer.update({
        where: { id },
        data: {
          status: OfferStatus.ACCEPTED,
          respondedAt: new Date(),
          responseNotes,
        },
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
        },
      });

      // 2. Update Application Status to OFFER_ACCEPTED
      await tx.application.update({
        where: { id: offer.applicationId },
        data: {
          status: ApplicationStatus.OFFER_ACCEPTED,
          statusRemarks: `Offer accepted by candidate. Response: ${responseNotes}`,
        },
      });

      // 3. Create Status History
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: offer.applicationId,
          previousStatus: ApplicationStatus.OFFER_RECEIVED,
          newStatus: ApplicationStatus.OFFER_ACCEPTED,
          changedById: req.user!.id,
          note: `Student accepted offer for ${offer.designation} at ${offer.company.name}. Note: ${responseNotes}`,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ACCEPT_OFFER',
          entity: 'Offer',
          entityId: String(id),
          newValues: JSON.stringify({ status: OfferStatus.ACCEPTED, responseNotes }),
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Congratulations! You have accepted the offer from ${acceptedOffer.company.name} for the position of ${acceptedOffer.designation}.`,
      data: acceptedOffer,
    });
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ success: false, message: 'Failed to accept offer.' });
  }
}

/**
 * Student rejects an offer.
 * Business Rules:
 * - Student must be the owner of the offer.
 * - Offer status must currently be OFFERED.
 * - Offer status -> REJECTED.
 * - Application status -> OFFER_REJECTED.
 * - Application status history recorded.
 * - Offer record is preserved for institutional audit.
 */
export async function rejectOffer(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid offer ID.' });
      return;
    }

    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(403).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { application: true, company: true },
    });

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer not found.' });
      return;
    }

    // IDOR verification
    if (offer.studentId !== student.id) {
      res.status(403).json({ success: false, message: 'Access denied: You can only respond to your own offers.' });
      return;
    }

    if (offer.status !== OfferStatus.OFFERED) {
      res.status(400).json({
        success: false,
        message: `This offer is no longer in an actionable state (Current status: ${offer.status}).`,
      });
      return;
    }

    const validation = validateStudentOfferResponseInput(req.body);
    const responseNotes = validation.value?.responseNotes || 'Offer declined by candidate.';

    const rejectedOffer = await prisma.$transaction(async (tx) => {
      // 1. Update Offer
      const updated = await tx.offer.update({
        where: { id },
        data: {
          status: OfferStatus.REJECTED,
          respondedAt: new Date(),
          responseNotes,
        },
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
        },
      });

      // 2. Update Application Status to OFFER_REJECTED
      await tx.application.update({
        where: { id: offer.applicationId },
        data: {
          status: ApplicationStatus.OFFER_REJECTED,
          statusRemarks: `Offer declined by candidate. Reason: ${responseNotes}`,
        },
      });

      // 3. Create Status History
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: offer.applicationId,
          previousStatus: ApplicationStatus.OFFER_RECEIVED,
          newStatus: ApplicationStatus.OFFER_REJECTED,
          changedById: req.user!.id,
          note: `Student declined offer for ${offer.designation} at ${offer.company.name}. Reason: ${responseNotes}`,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'REJECT_OFFER',
          entity: 'Offer',
          entityId: String(id),
          newValues: JSON.stringify({ status: OfferStatus.REJECTED, responseNotes }),
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: `You have declined the offer from ${rejectedOffer.company.name}.`,
      data: rejectedOffer,
    });
  } catch (error) {
    console.error('Error rejecting offer:', error);
    res.status(500).json({ success: false, message: 'Failed to reject offer.' });
  }
}

// ==========================================
// 3. QUERYING OFFERS
// ==========================================

/**
 * Student: View received offers.
 */
export async function getStudentOffers(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status as OfferStatus | undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const where: Prisma.OfferWhereInput = {
      studentId: student.id,
      ...(statusFilter && { status: statusFilter }),
      ...(search && {
        OR: [
          { designation: { contains: search } },
          { company: { name: { contains: search } } },
          { location: { contains: search } },
        ],
      }),
    };

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true, logoUrl: true, headquarters: true, website: true } },
          job: { select: { id: true, title: true, employmentType: true, workMode: true } },
          internship: { select: { id: true, title: true, duration: true, workMode: true } },
          offerDocument: true,
          application: { select: { id: true, status: true, appliedAt: true } },
        },
      }),
      prisma.offer.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching student offers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve offers.' });
  }
}

/**
 * Recruiter: View company offers extended to candidates.
 */
export async function getRecruiterOffers(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Recruiter profile not found.' });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status as OfferStatus | undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const where: Prisma.OfferWhereInput = {
      companyId: recruiter.companyId,
      ...(statusFilter && { status: statusFilter }),
      ...(search && {
        OR: [
          { designation: { contains: search } },
          { student: { fullName: { contains: search } } },
          { student: { studentId: { contains: search } } },
          { location: { contains: search } },
        ],
      }),
    };

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              course: true,
              program: true,
              semester: true,
              department: { select: { code: true, name: true } },
              user: { select: { email: true } },
            },
          },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
          offerDocument: true,
          application: { select: { id: true, status: true, appliedAt: true } },
        },
      }),
      prisma.offer.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching recruiter offers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve offers.' });
  }
}

/**
 * Placement Admin & Super Admin: View institutional offers across all companies.
 */
export async function getAdminOffers(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const companyId = req.query.companyId ? parseInt(String(req.query.companyId), 10) : undefined;
    const statusFilter = req.query.status as OfferStatus | undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const where: Prisma.OfferWhereInput = {
      ...(companyId && { companyId }),
      ...(statusFilter && { status: statusFilter }),
      ...(search && {
        OR: [
          { designation: { contains: search } },
          { company: { name: { contains: search } } },
          { student: { fullName: { contains: search } } },
          { student: { studentId: { contains: search } } },
          { location: { contains: search } },
        ],
      }),
    };

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              course: true,
              department: { select: { code: true, name: true } },
              user: { select: { email: true } },
            },
          },
          company: { select: { id: true, name: true, logoUrl: true } },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
          offerDocument: true,
          application: { select: { id: true, status: true } },
        },
      }),
      prisma.offer.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        offers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin offers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve institutional offers.' });
  }
}

/**
 * Get offer details by ID.
 */
export async function getOfferById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid offer ID.' });
      return;
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        company: true,
        student: {
          include: {
            department: true,
            user: { select: { email: true } },
            skills: { include: { skill: true } },
          },
        },
        job: true,
        internship: true,
        offerDocument: true,
        application: {
          include: {
            statusHistory: {
              orderBy: { createdAt: 'desc' },
              include: { changedBy: { select: { id: true, email: true, role: true } } },
            },
            interviews: { orderBy: { roundNumber: 'asc' } },
          },
        },
      },
    });

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer not found.' });
      return;
    }

    // Role-based authorization & IDOR protection
    if (req.user!.role === UserRole.STUDENT) {
      const student = await getAuthenticatedStudent(req.user!.id);
      if (!student || offer.studentId !== student.id) {
        res.status(404).json({ success: false, message: 'Offer not found.' });
        return;
      }
    } else if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== offer.companyId) {
        res.status(404).json({ success: false, message: 'Offer not found.' });
        return;
      }
    }

    res.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error('Error fetching offer by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve offer details.' });
  }
}

/**
 * Upload offer letter document and attach to offer.
 */
export async function uploadOfferDocument(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid offer ID.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No offer document file provided.' });
      return;
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!offer) {
      res.status(404).json({ success: false, message: 'Offer not found.' });
      return;
    }

    // Recruiter check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== offer.companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students cannot upload offer letters.' });
      return;
    }

    const saved = await storageService.saveFile(req.file, 'documents');

    const document = await prisma.document.create({
      data: {
        userId: offer.student.userId,
        studentId: offer.studentId,
        type: DocumentType.OFFER_LETTER,
        title: `Offer Letter - ${offer.designation}`,
        fileName: req.file.originalname,
        fileKey: saved.fileKey,
        fileUrl: saved.fileUrl,
        fileSize: saved.fileSize,
        mimeType: req.file.mimetype,
        isVerified: true,
        verifiedById: req.user!.id,
        verifiedAt: new Date(),
      },
    });

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: { offerLetterDocumentId: document.id },
      include: { offerDocument: true },
    });

    res.json({
      success: true,
      message: 'Offer letter attached successfully.',
      data: updatedOffer,
    });
  } catch (error) {
    console.error('Error attaching offer document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload offer document.' });
  }
}
