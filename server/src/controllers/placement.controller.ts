import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ApplicationStatus, PlacementStatus, PlacementType, Prisma, UserRole } from '@prisma/client';
import {
  validateCreatePlacementInput,
  validateUpdatePlacementInput,
  validateUpdatePlacementStatusInput,
} from '../validations/placement.validation.js';

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
// 1. PLACEMENT CREATION & WORKFLOW
// ==========================================

/**
 * Create a placement outcome for an eligible candidate.
 * Business Rules:
 * - Application MUST exist and be in 'SELECTED', 'OFFER_RECEIVED', or 'OFFER_ACCEPTED' state.
 * - If offer is associated, offer must belong to candidate and application.
 * - Recruiter can only create placements for their company's opportunities.
 * - Placement Admin has institutional authority.
 * - Candidate cannot have duplicate placement for same application/offer.
 * - Transition Application status to 'HIRED_PLACED' and create status history.
 * - Log to audit trail.
 */
export async function createPlacement(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreatePlacementInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid placement parameters.',
        errors: validation.errors,
      });
      return;
    }

    const {
      applicationId,
      offerId,
      packageAmount,
      currency = 'INR',
      designation,
      location,
      placementDate,
      joiningDate,
      placementType = PlacementType.ON_CAMPUS,
      status = PlacementStatus.CONFIRMED,
      notes,
    } = validation.value;

    // 1. Fetch application with student, job, internship, offers, and existing placements
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          include: {
            user: { select: { id: true, email: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
        job: { select: { id: true, title: true, companyId: true } },
        internship: { select: { id: true, title: true, companyId: true } },
        offers: true,
        placements: true,
      },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        message: `Application #${applicationId} not found.`,
      });
      return;
    }

    const companyId = application.job?.companyId || application.internship?.companyId;
    if (!companyId) {
      res.status(400).json({
        success: false,
        message: 'Application is not associated with a valid company opportunity.',
      });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, logoUrl: true, industry: true },
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: `Associated company #${companyId} not found.`,
      });
      return;
    }

    // 2. Authorization check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== companyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only record placements for your own company.',
        });
        return;
      }
    } else if (
      req.user!.role !== UserRole.PLACEMENT_ADMIN &&
      req.user!.role !== UserRole.SUPER_ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions to create placement records.',
      });
      return;
    }

    // 3. Selection / Eligibility check
    const eligibleStatuses: ApplicationStatus[] = [
      ApplicationStatus.SELECTED,
      ApplicationStatus.OFFER_RECEIVED,
      ApplicationStatus.OFFER_ACCEPTED,
    ];

    if (!eligibleStatuses.includes(application.status)) {
      res.status(400).json({
        success: false,
        message: `Candidate cannot be placed. Application status is '${application.status}', but must be 'SELECTED', 'OFFER_RECEIVED', or 'OFFER_ACCEPTED'.`,
      });
      return;
    }

    // 4. Duplicate prevention
    const existingPlacement = await prisma.placement.findFirst({
      where: {
        OR: [
          { applicationId: application.id },
          ...(offerId ? [{ offerId }] : []),
        ],
      },
    });

    if (existingPlacement) {
      res.status(400).json({
        success: false,
        message: `A placement record (ID #${existingPlacement.id}) already exists for this application/offer.`,
      });
      return;
    }

    // 5. Verify offer relationship if offerId provided
    let matchedOfferId: number | null = null;
    if (offerId) {
      const offer = await prisma.offer.findUnique({
        where: { id: offerId },
      });

      if (!offer || offer.applicationId !== application.id || offer.studentId !== application.studentId) {
        res.status(400).json({
          success: false,
          message: `Offer #${offerId} does not belong to Application #${application.id}.`,
        });
        return;
      }

      matchedOfferId = offer.id;
    } else if (application.offers.length > 0) {
      // Auto-associate accepted offer if available
      const acceptedOffer = application.offers.find((o) => o.status === 'ACCEPTED');
      if (acceptedOffer) {
        matchedOfferId = acceptedOffer.id;
      }
    }

    // 6. Execute atomic placement creation and application status progression
    const result = await prisma.$transaction(async (tx) => {
      // A. Create Placement
      const newPlacement = await tx.placement.create({
        data: {
          studentId: application.studentId,
          companyId,
          applicationId: application.id,
          jobId: application.jobId || null,
          offerId: matchedOfferId,
          placementDate: placementDate ? new Date(placementDate) : new Date(),
          packageAmount: new Prisma.Decimal(packageAmount),
          currency,
          joiningDate: joiningDate ? new Date(joiningDate) : null,
          placementType,
          designation,
          location,
          status,
          notes,
        },
        include: {
          student: {
            include: {
              user: { select: { id: true, email: true } },
              department: { select: { id: true, name: true, code: true } },
            },
          },
          company: { select: { id: true, name: true, logoUrl: true, industry: true } },
          job: { select: { id: true, title: true, employmentType: true } },
          offer: {
            select: {
              id: true,
              offerDate: true,
              joiningDate: true,
              salary: true,
              stipend: true,
              status: true,
              offerDocument: true,
            },
          },
          application: {
            select: {
              id: true,
              opportunityType: true,
              status: true,
              appliedAt: true,
              internship: { select: { id: true, title: true } },
              job: { select: { id: true, title: true } },
            },
          },
        },
      });

      // B. Update Application status to HIRED_PLACED if not already
      if (application.status !== ApplicationStatus.HIRED_PLACED) {
        await tx.application.update({
          where: { id: application.id },
          data: {
            status: ApplicationStatus.HIRED_PLACED,
            statusRemarks: `Placement recorded: ${designation} at ${company.name} with package ${packageAmount} ${currency}.`,
          },
        });

        // C. Record Application Status History
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: application.id,
            previousStatus: application.status,
            newStatus: ApplicationStatus.HIRED_PLACED,
            changedById: req.user!.id,
            note: `Placement confirmed: ${designation} at ${company.name} (${packageAmount} ${currency}).`,
          },
        });
      }

      // D. Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE_PLACEMENT',
          entity: 'Placement',
          entityId: String(newPlacement.id),
          newValues: JSON.stringify({
            id: newPlacement.id,
            studentId: newPlacement.studentId,
            companyId: newPlacement.companyId,
            applicationId: newPlacement.applicationId,
            packageAmount,
            designation,
            status,
          }),
        },
      });

      return newPlacement;
    });

    res.status(201).json({
      success: true,
      message: 'Placement outcome recorded successfully.',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating placement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record placement.',
      error: error.message,
    });
  }
}

// ==========================================
// 2. PLACEMENT DETAILS & RETRIEVAL
// ==========================================

/**
 * Get placement by ID with strict IDOR multi-tenant security
 */
export async function getPlacementById(req: Request, res: Response): Promise<void> {
  try {
    const placementId = parseInt(req.params.id as string, 10);
    if (isNaN(placementId)) {
      res.status(400).json({ success: false, message: 'Invalid placement ID format.' });
      return;
    }

    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        student: {
          include: {
            user: { select: { id: true, email: true } },
            department: { select: { id: true, name: true, code: true } },
            skills: { include: { skill: true } },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            website: true,
            headquarters: true,
            contactEmail: true,
          },
        },
        job: true,
        offer: {
          include: {
            offerDocument: true,
          },
        },
        application: {
          include: {
            internship: true,
            job: true,
            resumeDocument: true,
            statusHistory: {
              orderBy: { createdAt: 'asc' },
              include: {
                changedBy: { select: { id: true, email: true, role: true } },
              },
            },
            interviews: {
              orderBy: { roundNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!placement) {
      res.status(404).json({ success: false, message: 'Placement record not found.' });
      return;
    }

    // Role-based IDOR validation
    if (req.user!.role === UserRole.STUDENT) {
      const student = await getAuthenticatedStudent(req.user!.id);
      if (!student || student.id !== placement.studentId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own placement record.',
        });
        return;
      }
    } else if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== placement.companyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only access placements belonging to your company.',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: placement,
    });
  } catch (error: any) {
    console.error('Error fetching placement by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve placement details.',
      error: error.message,
    });
  }
}

// ==========================================
// 3. PLACEMENT UPDATES & STATUS CHANGES
// ==========================================

/**
 * Update placement terms (e.g. package, joining date, designation, location, notes)
 */
export async function updatePlacement(req: Request, res: Response): Promise<void> {
  try {
    const placementId = parseInt(req.params.id as string, 10);
    if (isNaN(placementId)) {
      res.status(400).json({ success: false, message: 'Invalid placement ID format.' });
      return;
    }

    const validation = validateUpdatePlacementInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid placement update values.',
        errors: validation.errors,
      });
      return;
    }

    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
    });

    if (!placement) {
      res.status(404).json({ success: false, message: 'Placement record not found.' });
      return;
    }

    // Recruiter authorization
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== placement.companyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You cannot modify placements for another company.',
        });
        return;
      }
    } else if (
      req.user!.role !== UserRole.PLACEMENT_ADMIN &&
      req.user!.role !== UserRole.SUPER_ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions to modify placement record.',
      });
      return;
    }

    const updateData: Prisma.PlacementUpdateInput = {};
    if (validation.value.packageAmount !== undefined) {
      updateData.packageAmount = new Prisma.Decimal(validation.value.packageAmount);
    }
    if (validation.value.currency !== undefined) {
      updateData.currency = validation.value.currency;
    }
    if (validation.value.designation !== undefined) {
      updateData.designation = validation.value.designation;
    }
    if (validation.value.location !== undefined) {
      updateData.location = validation.value.location;
    }
    if (validation.value.joiningDate !== undefined) {
      updateData.joiningDate = validation.value.joiningDate ? new Date(validation.value.joiningDate) : null;
    }
    if (validation.value.placementType !== undefined) {
      updateData.placementType = validation.value.placementType;
    }
    if (validation.value.notes !== undefined) {
      updateData.notes = validation.value.notes;
    }

    const updatedPlacement = await prisma.placement.update({
      where: { id: placementId },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
        company: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_PLACEMENT',
        entity: 'Placement',
        entityId: String(placementId),
        oldValues: JSON.stringify({
          packageAmount: placement.packageAmount,
          designation: placement.designation,
          joiningDate: placement.joiningDate,
          placementType: placement.placementType,
        }),
        newValues: JSON.stringify(validation.value),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Placement details updated successfully.',
      data: updatedPlacement,
    });
  } catch (error: any) {
    console.error('Error updating placement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update placement details.',
      error: error.message,
    });
  }
}

/**
 * Update placement status (CONFIRMED, JOINED, DEFERRED, RESCINDED, DECLINED)
 */
export async function updatePlacementStatus(req: Request, res: Response): Promise<void> {
  try {
    const placementId = parseInt(req.params.id as string, 10);
    if (isNaN(placementId)) {
      res.status(400).json({ success: false, message: 'Invalid placement ID format.' });
      return;
    }

    const validation = validateUpdatePlacementStatusInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid placement status data.',
        errors: validation.errors,
      });
      return;
    }

    const { status, notes } = validation.value;

    const placement = await prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        company: { select: { id: true, name: true } },
        application: true,
      },
    });

    if (!placement) {
      res.status(404).json({ success: false, message: 'Placement record not found.' });
      return;
    }

    // Recruiter authorization
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== placement.companyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You cannot change placement status for another company.',
        });
        return;
      }
    } else if (
      req.user!.role !== UserRole.PLACEMENT_ADMIN &&
      req.user!.role !== UserRole.SUPER_ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions to change placement status.',
      });
      return;
    }

    const oldStatus = placement.status;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPlacement = await tx.placement.update({
        where: { id: placementId },
        data: {
          status,
          notes: notes ? (placement.notes ? `${placement.notes}\n[${new Date().toISOString()}] Status changed to ${status}: ${notes}` : notes) : placement.notes,
        },
      });

      // If status changed to DECLINED or RESCINDED, record in application status history
      if (placement.applicationId && (status === PlacementStatus.DECLINED || status === PlacementStatus.RESCINDED)) {
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: placement.applicationId,
            previousStatus: ApplicationStatus.HIRED_PLACED,
            newStatus: status === PlacementStatus.DECLINED ? ApplicationStatus.OFFER_REJECTED : ApplicationStatus.REJECTED,
            changedById: req.user!.id,
            note: `Placement status changed to ${status}${notes ? `: ${notes}` : ''}`,
          },
        });
      } else if (placement.applicationId && status === PlacementStatus.JOINED) {
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: placement.applicationId,
            previousStatus: ApplicationStatus.HIRED_PLACED,
            newStatus: ApplicationStatus.HIRED_PLACED,
            changedById: req.user!.id,
            note: `Candidate officially JOINED at ${placement.company.name}${notes ? `: ${notes}` : ''}`,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE_PLACEMENT_STATUS',
          entity: 'Placement',
          entityId: String(placementId),
          oldValues: JSON.stringify({ status: oldStatus }),
          newValues: JSON.stringify({ status, notes }),
        },
      });

      return updatedPlacement;
    });

    res.status(200).json({
      success: true,
      message: `Placement status successfully updated to ${status}.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating placement status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update placement status.',
      error: error.message,
    });
  }
}

// ==========================================
// 4. STUDENT PLACEMENT VIEW
// ==========================================

/**
 * Get authenticated student's placement records
 */
export async function getStudentPlacement(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const placements = await prisma.placement.findMany({
      where: { studentId: student.id },
      orderBy: { placementDate: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
            website: true,
            headquarters: true,
          },
        },
        job: { select: { id: true, title: true, employmentType: true, workMode: true } },
        offer: {
          include: {
            offerDocument: true,
          },
        },
        application: {
          include: {
            internship: { select: { id: true, title: true } },
            job: { select: { id: true, title: true } },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        isPlaced: placements.length > 0,
        placements,
      },
    });
  } catch (error: any) {
    console.error('Error fetching student placement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve placement information.',
      error: error.message,
    });
  }
}

// ==========================================
// 5. RECRUITER PLACEMENTS
// ==========================================

/**
 * Get placements belonging to the authenticated recruiter's company
 */
export async function getRecruiterPlacements(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(404).json({ success: false, message: 'Recruiter profile not found.' });
      return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, placementType, search } = req.query;

    const where: Prisma.PlacementWhereInput = {
      companyId: recruiter.companyId,
    };

    if (status && Object.values(PlacementStatus).includes(status as PlacementStatus)) {
      where.status = status as PlacementStatus;
    }

    if (placementType && Object.values(PlacementType).includes(placementType as PlacementType)) {
      where.placementType = placementType as PlacementType;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { designation: { contains: q } },
        { location: { contains: q } },
        {
          student: {
            OR: [
              { fullName: { contains: q } },
              { studentId: { contains: q } },
              { course: { contains: q } },
            ],
          },
        },
      ];
    }

    const [total, placements] = await Promise.all([
      prisma.placement.count({ where }),
      prisma.placement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placementDate: 'desc' },
        include: {
          student: {
            include: {
              department: { select: { id: true, name: true, code: true } },
              user: { select: { id: true, email: true } },
            },
          },
          company: { select: { id: true, name: true, logoUrl: true } },
          job: { select: { id: true, title: true } },
          offer: {
            select: {
              id: true,
              offerDate: true,
              salary: true,
              stipend: true,
              status: true,
            },
          },
          application: {
            select: {
              id: true,
              opportunityType: true,
              status: true,
              internship: { select: { id: true, title: true } },
              job: { select: { id: true, title: true } },
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        placements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching recruiter placements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve company placements.',
      error: error.message,
    });
  }
}

// ==========================================
// 6. PLACEMENT ADMIN PLACEMENTS
// ==========================================

/**
 * Get all institutional placements with deep filtering, search, and pagination
 */
export async function getAdminPlacements(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      status,
      placementType,
      companyId,
      departmentId,
      search,
      startDate,
      endDate,
    } = req.query;

    const where: Prisma.PlacementWhereInput = {};

    if (status && Object.values(PlacementStatus).includes(status as PlacementStatus)) {
      where.status = status as PlacementStatus;
    }

    if (placementType && Object.values(PlacementType).includes(placementType as PlacementType)) {
      where.placementType = placementType as PlacementType;
    }

    if (companyId) {
      const cId = parseInt(companyId as string, 10);
      if (!isNaN(cId)) where.companyId = cId;
    }

    if (departmentId) {
      const dId = parseInt(departmentId as string, 10);
      if (!isNaN(dId)) {
        where.student = { departmentId: dId };
      }
    }

    if (startDate || endDate) {
      where.placementDate = {};
      if (startDate) where.placementDate.gte = new Date(startDate as string);
      if (endDate) where.placementDate.lte = new Date(endDate as string);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { designation: { contains: q } },
        { location: { contains: q } },
        { company: { name: { contains: q } } },
        {
          student: {
            OR: [
              { fullName: { contains: q } },
              { studentId: { contains: q } },
              { enrollmentNumber: { contains: q } },
              { course: { contains: q } },
            ],
          },
        },
      ];
    }

    const [total, placements] = await Promise.all([
      prisma.placement.count({ where }),
      prisma.placement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placementDate: 'desc' },
        include: {
          student: {
            include: {
              department: { select: { id: true, name: true, code: true } },
              user: { select: { id: true, email: true } },
            },
          },
          company: { select: { id: true, name: true, logoUrl: true, industry: true } },
          job: { select: { id: true, title: true } },
          offer: {
            select: {
              id: true,
              offerDate: true,
              salary: true,
              stipend: true,
              status: true,
              offerDocument: true,
            },
          },
          application: {
            select: {
              id: true,
              opportunityType: true,
              status: true,
              internship: { select: { id: true, title: true } },
              job: { select: { id: true, title: true } },
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        placements,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin placements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve institutional placements.',
      error: error.message,
    });
  }
}

// ==========================================
// 7. PLACEMENT DASHBOARD METRICS & STATS
// ==========================================

/**
 * Get placement statistical overview (Institutional or Recruiter scoped)
 */
export async function getPlacementStats(req: Request, res: Response): Promise<void> {
  try {
    const where: Prisma.PlacementWhereInput = {};

    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (recruiter) {
        where.companyId = recruiter.companyId;
      }
    }

    const [
      totalPlacements,
      confirmedCount,
      joinedCount,
      deferredCount,
      declinedCount,
      rescindedCount,
      onCampusCount,
      ppoCount,
      offCampusCount,
      packageStats,
      allPlacementsWithDept,
    ] = await Promise.all([
      prisma.placement.count({ where }),
      prisma.placement.count({ where: { ...where, status: PlacementStatus.CONFIRMED } }),
      prisma.placement.count({ where: { ...where, status: PlacementStatus.JOINED } }),
      prisma.placement.count({ where: { ...where, status: PlacementStatus.DEFERRED } }),
      prisma.placement.count({ where: { ...where, status: PlacementStatus.DECLINED } }),
      prisma.placement.count({ where: { ...where, status: PlacementStatus.RESCINDED } }),
      prisma.placement.count({ where: { ...where, placementType: PlacementType.ON_CAMPUS } }),
      prisma.placement.count({ where: { ...where, placementType: PlacementType.PPO } }),
      prisma.placement.count({ where: { ...where, placementType: PlacementType.OFF_CAMPUS } }),
      prisma.placement.aggregate({
        where,
        _avg: { packageAmount: true },
        _max: { packageAmount: true },
        _min: { packageAmount: true },
      }),
      prisma.placement.findMany({
        where,
        select: {
          student: {
            select: {
              department: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
    ]);

    // Group placements by department
    const deptMap = new Map<number, { id: number; name: string; code: string; count: number }>();
    for (const p of allPlacementsWithDept) {
      const dept = p.student.department;
      if (dept) {
        const existing = deptMap.get(dept.id) || { id: dept.id, name: dept.name, code: dept.code, count: 0 };
        existing.count += 1;
        deptMap.set(dept.id, existing);
      }
    }
    const placementsByDepartment = Array.from(deptMap.values()).sort((a, b) => b.count - a.count);

    // Recent 5 placements
    const recentPlacements = await prisma.placement.findMany({
      where,
      take: 5,
      orderBy: { placementDate: 'desc' },
      include: {
        student: { select: { id: true, fullName: true, course: true } },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalPlacements,
        statusBreakdown: {
          confirmed: confirmedCount,
          joined: joinedCount,
          deferred: deferredCount,
          declined: declinedCount,
          rescinded: rescindedCount,
        },
        typeBreakdown: {
          onCampus: onCampusCount,
          ppo: ppoCount,
          offCampus: offCampusCount,
        },
        salaryStats: {
          average: packageStats._avg.packageAmount ? Number(packageStats._avg.packageAmount) : 0,
          highest: packageStats._max.packageAmount ? Number(packageStats._max.packageAmount) : 0,
          lowest: packageStats._min.packageAmount ? Number(packageStats._min.packageAmount) : 0,
        },
        placementsByDepartment,
        recentPlacements,
      },
    });
  } catch (error: any) {
    console.error('Error fetching placement statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve placement statistics.',
      error: error.message,
    });
  }
}
