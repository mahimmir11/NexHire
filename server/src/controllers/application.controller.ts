import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { OpportunityType, ApplicationStatus } from '@prisma/client';
import {
  validateApplyInput,
  validateStatusUpdateInput,
  validateNoteInput,
  validateStatusTransition,
} from '../validations/application.validation.js';
import { evaluateStudentEligibility } from '../utils/eligibility.utils.js';

/**
 * Helper: Retrieve the authenticated student record based on req.user.id.
 */
async function getAuthenticatedStudent(userId: number) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
      department: {
        select: { id: true, name: true, code: true },
      },
      skills: {
        include: { skill: true },
      },
      academicRecords: true,
    },
  });
}

/**
 * Helper: Retrieve the authenticated recruiter record based on req.user.id.
 */
async function getAuthenticatedRecruiter(userId: number) {
  return prisma.recruiter.findUnique({
    where: { userId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          verificationStatus: true,
        },
      },
    },
  });
}

// ==========================================
// 1. STUDENT APPLICATION WORKFLOW
// ==========================================

/**
 * Student applies to a published opportunity (Job or Internship).
 * Enforces real database checks:
 * 1. Opportunity existence and status (must be PUBLISHED)
 * 2. Deadline has not expired
 * 3. Student meets all eligibility criteria using real DB data
 * 4. Duplicate prevention
 * 5. Resume validation
 */
export async function applyToOpportunity(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(403).json({ success: false, message: 'Only registered students can apply for opportunities.' });
      return;
    }

    const validation = validateApplyInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid application submission.',
        errors: validation.errors,
      });
      return;
    }

    const { opportunityType, opportunityId, coverLetter, resumeDocumentId } = validation.value;

    let opportunityTitle = '';
    let companyName = '';
    let eligibilityCriteria = null;
    let applicationDeadline: Date;
    let opportunityStatus: string;

    if (opportunityType === OpportunityType.JOB) {
      const job = await prisma.job.findUnique({
        where: { id: opportunityId },
        include: { eligibilityCriteria: true, company: true },
      });

      if (!job) {
        res.status(404).json({ success: false, message: 'The specified job opening does not exist.' });
        return;
      }

      opportunityTitle = job.title;
      companyName = job.company.name;
      eligibilityCriteria = job.eligibilityCriteria;
      applicationDeadline = new Date(job.applicationDeadline);
      opportunityStatus = job.status;
    } else {
      const internship = await prisma.internship.findUnique({
        where: { id: opportunityId },
        include: { eligibilityCriteria: true, company: true },
      });

      if (!internship) {
        res.status(404).json({ success: false, message: 'The specified internship drive does not exist.' });
        return;
      }

      opportunityTitle = internship.title;
      companyName = internship.company.name;
      eligibilityCriteria = internship.eligibilityCriteria;
      applicationDeadline = new Date(internship.applicationDeadline);
      opportunityStatus = internship.status;
    }

    // 1. Verify opportunity is PUBLISHED
    if (opportunityStatus !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        message: 'Cannot apply to an opportunity that is not currently published and open for campus recruitment.',
      });
      return;
    }

    // 2. Verify Deadline
    if (new Date() > applicationDeadline) {
      res.status(400).json({
        success: false,
        message: 'The application deadline for this opportunity has already passed.',
      });
      return;
    }

    // 3. Verify Eligibility using Real DB Engine
    if (eligibilityCriteria) {
      const eligibilityResult = evaluateStudentEligibility(student, eligibilityCriteria);
      if (!eligibilityResult.isEligible) {
        res.status(400).json({
          success: false,
          message: 'You do not meet the academic or skill eligibility criteria for this opportunity.',
          reasons: eligibilityResult.reasons,
        });
        return;
      }
    }

    // 4. Duplicate Check
    const existingApplication = await prisma.application.findFirst({
      where: {
        studentId: student.id,
        jobId: opportunityType === OpportunityType.JOB ? opportunityId : undefined,
        internshipId: opportunityType === OpportunityType.INTERNSHIP ? opportunityId : undefined,
      },
    });

    if (existingApplication) {
      res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this opportunity.',
        existingApplicationId: existingApplication.id,
      });
      return;
    }

    // 5. Verify Resume Document if provided
    let verifiedDocumentId: number | null = null;
    if (resumeDocumentId) {
      const doc = await prisma.document.findFirst({
        where: {
          id: resumeDocumentId,
          studentId: student.id,
          type: 'RESUME',
        },
      });
      if (!doc) {
        res.status(400).json({
          success: false,
          message: 'Selected resume document was not found or is invalid.',
        });
        return;
      }
      verifiedDocumentId = doc.id;
    } else {
      // Default to student's most recently uploaded resume if available
      const latestResume = await prisma.document.findFirst({
        where: {
          studentId: student.id,
          type: 'RESUME',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (latestResume) {
        verifiedDocumentId = latestResume.id;
      }
    }

    // 6. Create Application and initial Status History in Database Transaction
    const application = await prisma.$transaction(async (tx) => {
      const createdApp = await tx.application.create({
        data: {
          studentId: student.id,
          opportunityType,
          jobId: opportunityType === OpportunityType.JOB ? opportunityId : null,
          internshipId: opportunityType === OpportunityType.INTERNSHIP ? opportunityId : null,
          status: ApplicationStatus.APPLIED,
          coverLetter: coverLetter || null,
          resumeDocumentId: verifiedDocumentId,
          statusRemarks: 'Application submitted by candidate.',
        },
        include: {
          job: {
            include: {
              company: {
                select: { id: true, name: true, logoUrl: true, headquarters: true },
              },
            },
          },
          internship: {
            include: {
              company: {
                select: { id: true, name: true, logoUrl: true, headquarters: true },
              },
            },
          },
          resumeDocument: {
            select: { id: true, title: true, fileName: true, fileUrl: true },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: createdApp.id,
          previousStatus: null,
          newStatus: ApplicationStatus.APPLIED,
          changedById: req.user!.id,
          note: 'Application submitted by candidate.',
        },
      });

      return createdApp;
    });

    res.status(201).json({
      success: true,
      message: `Successfully applied to ${opportunityTitle} at ${companyName}!`,
      data: application,
    });
  } catch (error) {
    console.error('Error applying to opportunity:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application. Please try again.' });
  }
}

/**
 * Check if the authenticated student has already applied to an opportunity.
 */
export async function checkStudentApplicationStatus(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(403).json({ success: false, message: 'Only students can check application status.' });
      return;
    }

    const typeStr = String(req.params.type).toUpperCase();
    const id = parseInt(String(req.params.id), 10);

    if (isNaN(id) || !['JOB', 'INTERNSHIP'].includes(typeStr)) {
      res.status(400).json({ success: false, message: 'Invalid opportunity parameters.' });
      return;
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        studentId: student.id,
        jobId: typeStr === 'JOB' ? id : undefined,
        internshipId: typeStr === 'INTERNSHIP' ? id : undefined,
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        opportunityType: true,
      },
    });

    res.json({
      success: true,
      data: {
        hasApplied: Boolean(existingApplication),
        application: existingApplication || null,
      },
    });
  } catch (error) {
    console.error('Error checking student application status:', error);
    res.status(500).json({ success: false, message: 'Failed to verify application status.' });
  }
}

/**
 * Get all applications submitted by the authenticated student.
 */
export async function getStudentApplications(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(403).json({ success: false, message: 'Only students can view personal applications.' });
      return;
    }

    const pageNum = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortBy = ['appliedAt', 'status', 'updatedAt'].includes(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : 'appliedAt';
    const sortOrder = String(req.query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const status = req.query.status ? String(req.query.status) : undefined;
    const opportunityType = req.query.opportunityType ? String(req.query.opportunityType) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const where: any = {
      studentId: student.id,
    };

    if (status && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
      where.status = status as ApplicationStatus;
    }

    if (opportunityType && ['JOB', 'INTERNSHIP'].includes(opportunityType.toUpperCase())) {
      where.opportunityType = opportunityType.toUpperCase() as OpportunityType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { job: { title: { contains: q } } },
        { job: { company: { name: { contains: q } } } },
        { internship: { title: { contains: q } } },
        { internship: { company: { name: { contains: q } } } },
      ];
    }

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          job: {
            include: {
              company: {
                select: { id: true, name: true, logoUrl: true, headquarters: true },
              },
            },
          },
          internship: {
            include: {
              company: {
                select: { id: true, name: true, logoUrl: true, headquarters: true },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
}

/**
 * Get single student application details with complete timeline history.
 * Multi-tenant enforced: Student can only view their own applications.
 */
export async function getStudentApplicationById(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid application ID.' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            company: true,
            eligibilityCriteria: true,
          },
        },
        internship: {
          include: {
            company: true,
            eligibilityCriteria: true,
          },
        },
        resumeDocument: {
          select: {
            id: true,
            title: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedBy: {
              select: { role: true },
            },
          },
        },
      },
    });

    if (!application || application.studentId !== student.id) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application detail:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve application details.' });
  }
}

/**
 * Student withdraws their own application.
 * Only permitted if application is currently in APPLIED or UNDER_REVIEW status.
 */
export async function withdrawStudentApplication(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid application ID.' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application || application.studentId !== student.id) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const transition = validateStatusTransition(
      application.status,
      ApplicationStatus.WITHDRAWN,
      req.user!.role
    );

    if (!transition.isValid) {
      res.status(400).json({
        success: false,
        message: transition.message || 'Cannot withdraw this application at this stage.',
      });
      return;
    }

    const withdrawalNote = req.body?.note ? String(req.body.note).trim() : 'Withdrawn by candidate.';

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.WITHDRAWN,
          statusRemarks: withdrawalNote,
        },
        include: {
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          previousStatus: application.status,
          newStatus: ApplicationStatus.WITHDRAWN,
          changedById: req.user!.id,
          note: withdrawalNote,
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Application has been successfully withdrawn.',
      data: updatedApplication,
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw application.' });
  }
}

// ==========================================
// 2. RECRUITER APPLICATION MANAGEMENT
// ==========================================

/**
 * Get all applications submitted for the recruiter's company opportunities.
 * Strictly enforces company boundary: Recruiter cannot view other companies' applicants.
 */
export async function getRecruiterApplications(req: Request, res: Response): Promise<void> {
  try {
    let companyId: number | null = null;

    if (req.user!.role === 'RECRUITER') {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || !recruiter.companyId) {
        res.status(403).json({ success: false, message: 'Recruiter profile or company association not found.' });
        return;
      }
      companyId = recruiter.companyId;
    }

    const pageNum = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortBy = ['appliedAt', 'status', 'updatedAt'].includes(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : 'appliedAt';
    const sortOrder = String(req.query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const status = req.query.status ? String(req.query.status) : undefined;
    const opportunityType = req.query.opportunityType ? String(req.query.opportunityType) : undefined;
    const opportunityId = req.query.opportunityId ? String(req.query.opportunityId) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    // Filter to company opportunities
    const where: any = {};
    if (companyId) {
      where.OR = [
        { job: { companyId } },
        { internship: { companyId } },
      ];
    }

    if (status && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
      where.status = status as ApplicationStatus;
    }

    if (opportunityType && ['JOB', 'INTERNSHIP'].includes(opportunityType.toUpperCase())) {
      where.opportunityType = opportunityType.toUpperCase() as OpportunityType;
    }

    if (opportunityId) {
      const oppId = parseInt(opportunityId, 10);
      if (!isNaN(oppId)) {
        if (opportunityType?.toUpperCase() === 'JOB') {
          where.jobId = oppId;
        } else if (opportunityType?.toUpperCase() === 'INTERNSHIP') {
          where.internshipId = oppId;
        } else {
          where.OR = [{ jobId: oppId }, { internshipId: oppId }];
        }
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { student: { fullName: { contains: q } } },
        { student: { studentId: { contains: q } } },
        { student: { user: { email: { contains: q } } } },
        { job: { title: { contains: q } } },
        { internship: { title: { contains: q } } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              enrollmentNumber: true,
              course: true,
              program: true,
              semester: true,
              graduationYear: true,
              cgpa: true,
              backlogs: true,
              department: {
                select: { id: true, name: true, code: true },
              },
              user: {
                select: { email: true },
              },
            },
          },
          job: {
            select: { id: true, title: true, companyId: true, employmentType: true, location: true },
          },
          internship: {
            select: { id: true, title: true, companyId: true, duration: true, location: true },
          },
          resumeDocument: {
            select: { id: true, title: true, fileName: true, fileUrl: true },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching recruiter applications:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
}

// ==========================================
// 3. PLACEMENT ADMIN APPLICATION OVERSIGHT
// ==========================================

/**
 * Get institutional application listings for Placement Admins and Super Admins.
 */
export async function getAdminApplications(req: Request, res: Response): Promise<void> {
  try {
    const pageNum = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortBy = ['appliedAt', 'status', 'updatedAt'].includes(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : 'appliedAt';
    const sortOrder = String(req.query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const status = req.query.status ? String(req.query.status) : undefined;
    const opportunityType = req.query.opportunityType ? String(req.query.opportunityType) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const where: any = {};

    if (status && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
      where.status = status as ApplicationStatus;
    }

    if (opportunityType && ['JOB', 'INTERNSHIP'].includes(opportunityType.toUpperCase())) {
      where.opportunityType = opportunityType.toUpperCase() as OpportunityType;
    }

    if (req.query.companyId) {
      const compId = parseInt(String(req.query.companyId), 10);
      if (!isNaN(compId)) {
        where.OR = [{ job: { companyId: compId } }, { internship: { companyId: compId } }];
      }
    }

    if (req.query.departmentId) {
      const deptId = parseInt(String(req.query.departmentId), 10);
      if (!isNaN(deptId)) {
        where.student = { departmentId: deptId };
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { student: { fullName: { contains: q } } },
        { student: { studentId: { contains: q } } },
        { student: { user: { email: { contains: q } } } },
        { job: { title: { contains: q } } },
        { job: { company: { name: { contains: q } } } },
        { internship: { title: { contains: q } } },
        { internship: { company: { name: { contains: q } } } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              course: true,
              program: true,
              cgpa: true,
              backlogs: true,
              department: {
                select: { id: true, name: true, code: true },
              },
              user: {
                select: { email: true },
              },
            },
          },
          job: {
            include: {
              company: {
                select: { id: true, name: true, logoUrl: true },
              },
            },
          },
          internship: {
            include: {
              company: {
                select: { id: true, name: true, logoUrl: true },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve institutional applications.' });
  }
}

// ==========================================
// 4. SHARED APPLICATION DETAILS & REVIEW
// ==========================================

/**
 * Get comprehensive application details for Reviewers (Recruiter, Placement Admin, Super Admin).
 * Enforces company boundary for recruiters.
 */
export async function getApplicationDetailsById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid application ID.' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            department: true,
            user: { select: { email: true, createdAt: true } },
            skills: { include: { skill: true } },
            academicRecords: { orderBy: { passingYear: 'asc' } },
            certifications: true,
          },
        },
        job: {
          include: {
            company: true,
            eligibilityCriteria: true,
          },
        },
        internship: {
          include: {
            company: true,
            eligibilityCriteria: true,
          },
        },
        resumeDocument: {
          select: {
            id: true,
            title: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            createdAt: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedBy: {
              select: { id: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Role-based boundary enforcement
    if (req.user!.role === 'RECRUITER') {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || !recruiter.companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      const oppCompanyId = application.job?.companyId || application.internship?.companyId;
      if (oppCompanyId !== recruiter.companyId) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }
    } else if (req.user!.role === 'STUDENT') {
      const student = await getAuthenticatedStudent(req.user!.id);
      if (!student || application.studentId !== student.id) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve application details.' });
  }
}

/**
 * Update application review status (e.g. UNDER_REVIEW, SHORTLISTED, REJECTED).
 * Validates role-based status transition rules and records status history.
 */
export async function updateApplicationStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid application ID.' });
      return;
    }

    const validation = validateStatusUpdateInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid status update parameters.',
        errors: validation.errors,
      });
      return;
    }

    const { status: newStatus, note } = validation.value;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        internship: true,
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Role-based boundary enforcement
    if (req.user!.role === 'RECRUITER') {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || !recruiter.companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }

      const oppCompanyId = application.job?.companyId || application.internship?.companyId;
      if (oppCompanyId !== recruiter.companyId) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }
    } else if (req.user!.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Students are not authorized to update application review statuses.',
      });
      return;
    }

    // Validate Transition
    const transition = validateStatusTransition(application.status, newStatus, req.user!.role);
    if (!transition.isValid) {
      res.status(400).json({
        success: false,
        message: transition.message || `Cannot transition application from ${application.status} to ${newStatus}.`,
      });
      return;
    }

    const statusNote = note ? note.trim() : `Status transitioned to ${newStatus} by ${req.user!.role}.`;

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: {
          status: newStatus,
          statusRemarks: statusNote,
        },
        include: {
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          previousStatus: application.status,
          newStatus,
          changedById: req.user!.id,
          note: statusNote,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE_APPLICATION_STATUS',
          entity: 'Application',
          entityId: String(id),
          oldValues: JSON.stringify({ status: application.status }),
          newValues: JSON.stringify({
            status: newStatus,
            note: statusNote,
          }),
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Application status successfully updated to ${newStatus}.`,
      data: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
}

/**
 * Add an internal note to an application history without altering status.
 */
export async function addApplicationNote(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid application ID.' });
      return;
    }

    const validation = validateNoteInput(req.body);
    if (validation.errors.length > 0 || !validation.note) {
      res.status(400).json({
        success: false,
        message: 'Invalid note parameter.',
        errors: validation.errors,
      });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true, internship: true },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Role-based boundary enforcement
    if (req.user!.role === 'RECRUITER') {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || !recruiter.companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }
      const oppCompanyId = application.job?.companyId || application.internship?.companyId;
      if (oppCompanyId !== recruiter.companyId) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }
    } else if (req.user!.role === 'STUDENT') {
      res.status(403).json({ success: false, message: 'Students cannot add reviewer notes.' });
      return;
    }

    const noteRecord = await prisma.applicationStatusHistory.create({
      data: {
        applicationId: id,
        previousStatus: application.status,
        newStatus: application.status,
        changedById: req.user!.id,
        note: validation.note,
      },
      include: {
        changedBy: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Review note added successfully.',
      data: noteRecord,
    });
  } catch (error) {
    console.error('Error adding application note:', error);
    res.status(500).json({ success: false, message: 'Failed to record application note.' });
  }
}
