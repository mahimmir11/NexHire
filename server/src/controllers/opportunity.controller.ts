import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import {
  evaluateStudentEligibility,
  StudentWithAcademicData,
} from '../utils/eligibility.utils.js';
import {
  validateJobInput,
  validateInternshipInput,
  validateEligibilityInput,
  validateStatusTransition,
} from '../validations/opportunity.validation.js';
import {
  OpportunityStatus,
  OpportunityType,
  UserRole,
  EmploymentType,
  WorkMode,
  StipendPeriod,
  Prisma,
} from '@prisma/client';

/**
 * Helper: Derive the authenticated recruiter and their authorized company
 */
async function getAuthenticatedRecruiter(userId: number) {
  return prisma.recruiter.findUnique({
    where: { userId },
    include: { company: true },
  });
}

/**
 * Helper: Derive the authenticated student's academic profile for eligibility checks
 */
async function getAuthenticatedStudent(userId: number): Promise<StudentWithAcademicData | null> {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      department: {
        select: { id: true, name: true, code: true },
      },
      skills: {
        include: {
          skill: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return student as unknown as StudentWithAcademicData | null;
}

// ==========================================
// 1. RECRUITER: JOBS MANAGEMENT
// ==========================================

export async function getMyCompanyJobs(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({ success: false, message: 'Recruiter company profile not found.' });
      return;
    }

    const jobs = await prisma.job.findMany({
      where: { companyId: recruiter.companyId },
      include: {
        eligibilityCriteria: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: jobs.map((job) => ({
        ...job,
        applicationsCount: job._count.applications,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching recruiter company jobs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company jobs.' });
  }
}

export async function createJob(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({ success: false, message: 'Recruiter company profile not found.' });
      return;
    }

    const errors = validateJobInput(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    if (req.body.eligibilityCriteria) {
      const eligErrors = validateEligibilityInput(req.body.eligibilityCriteria);
      if (eligErrors.length > 0) {
        res.status(400).json({ success: false, message: 'Eligibility criteria validation failed', errors: eligErrors });
        return;
      }
    }

    const {
      title,
      description,
      responsibilities,
      requirements,
      requiredSkills,
      employmentType,
      location,
      workMode,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryBreakup,
      vacancies,
      applicationDeadline,
      selectionProcess,
      status,
      eligibilityCriteria,
    } = req.body;

    // Recruiter cannot directly publish
    let initialStatus: OpportunityStatus = OpportunityStatus.DRAFT;
    if (status === OpportunityStatus.PENDING_APPROVAL) {
      initialStatus = OpportunityStatus.PENDING_APPROVAL;
    }

    const createdJob = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          companyId: recruiter.companyId,
          recruiterId: recruiter.id,
          title: title.trim(),
          description: description.trim(),
          responsibilities: responsibilities.trim(),
          requirements: requirements.trim(),
          requiredSkills: requiredSkills.trim(),
          employmentType: employmentType || EmploymentType.FULL_TIME,
          location: location.trim(),
          workMode: workMode || WorkMode.ON_SITE,
          salaryMin: new Prisma.Decimal(salaryMin || 0),
          salaryMax: new Prisma.Decimal(salaryMax || 0),
          salaryCurrency: salaryCurrency || 'INR',
          salaryBreakup: salaryBreakup ? salaryBreakup.trim() : null,
          vacancies: parseInt(String(vacancies || 1), 10),
          applicationDeadline: new Date(applicationDeadline),
          selectionProcess: selectionProcess ? selectionProcess.trim() : null,
          status: initialStatus,
        },
      });

      if (eligibilityCriteria) {
        await tx.eligibilityCriteria.create({
          data: {
            jobId: job.id,
            minCgpa: eligibilityCriteria.minCgpa ? new Prisma.Decimal(eligibilityCriteria.minCgpa) : null,
            minPercentage: eligibilityCriteria.minPercentage ? new Prisma.Decimal(eligibilityCriteria.minPercentage) : null,
            maxBacklogs: parseInt(String(eligibilityCriteria.maxBacklogs ?? 0), 10),
            allowedCourses: eligibilityCriteria.allowedCourses ? JSON.stringify(eligibilityCriteria.allowedCourses) : null,
            allowedPrograms: eligibilityCriteria.allowedPrograms ? JSON.stringify(eligibilityCriteria.allowedPrograms) : null,
            allowedDepartments: eligibilityCriteria.allowedDepartments ? JSON.stringify(eligibilityCriteria.allowedDepartments) : null,
            allowedSemesters: eligibilityCriteria.allowedSemesters ? JSON.stringify(eligibilityCriteria.allowedSemesters) : null,
            graduationYears: eligibilityCriteria.graduationYears ? JSON.stringify(eligibilityCriteria.graduationYears) : null,
            requiredSkills: eligibilityCriteria.requiredSkills ? JSON.stringify(eligibilityCriteria.requiredSkills) : null,
            additionalCriteria: eligibilityCriteria.additionalCriteria ? eligibilityCriteria.additionalCriteria.trim() : null,
          },
        });
      }

      return job;
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully.',
      data: createdJob,
    });
  } catch (error: unknown) {
    console.error('Error creating job posting:', error);
    res.status(500).json({ success: false, message: 'Failed to create job posting.' });
  }
}

export async function updateJob(req: Request, res: Response): Promise<void> {
  try {
    const jobId = parseInt(String(req.params.id), 10);
    if (isNaN(jobId)) {
      res.status(400).json({ success: false, message: 'Invalid job ID.' });
      return;
    }

    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Verify ownership
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: { eligibilityCriteria: true },
    });

    if (!existingJob) {
      res.status(404).json({ success: false, message: 'Job posting not found.' });
      return;
    }

    if (existingJob.companyId !== recruiter.companyId && req.user!.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ success: false, message: 'You are not authorized to modify this job.' });
      return;
    }

    const errors = validateJobInput(req.body, true);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    if (req.body.eligibilityCriteria) {
      const eligErrors = validateEligibilityInput(req.body.eligibilityCriteria);
      if (eligErrors.length > 0) {
        res.status(400).json({ success: false, message: 'Eligibility validation failed', errors: eligErrors });
        return;
      }
    }

    // Status transition check if status changed
    if (req.body.status && req.body.status !== existingJob.status) {
      const transition = validateStatusTransition(existingJob.status, req.body.status, req.user!.role);
      if (!transition.isValid) {
        res.status(400).json({ success: false, message: transition.message });
        return;
      }
    }

    const {
      title,
      description,
      responsibilities,
      requirements,
      requiredSkills,
      employmentType,
      location,
      workMode,
      salaryMin,
      salaryMax,
      salaryCurrency,
      salaryBreakup,
      vacancies,
      applicationDeadline,
      selectionProcess,
      status,
      eligibilityCriteria,
    } = req.body;

    const updatedJob = await prisma.$transaction(async (tx) => {
      const job = await tx.job.update({
        where: { id: jobId },
        data: {
          title: title !== undefined ? title.trim() : undefined,
          description: description !== undefined ? description.trim() : undefined,
          responsibilities: responsibilities !== undefined ? responsibilities.trim() : undefined,
          requirements: requirements !== undefined ? requirements.trim() : undefined,
          requiredSkills: requiredSkills !== undefined ? requiredSkills.trim() : undefined,
          employmentType: employmentType || undefined,
          location: location !== undefined ? location.trim() : undefined,
          workMode: workMode || undefined,
          salaryMin: salaryMin !== undefined ? new Prisma.Decimal(salaryMin) : undefined,
          salaryMax: salaryMax !== undefined ? new Prisma.Decimal(salaryMax) : undefined,
          salaryCurrency: salaryCurrency || undefined,
          salaryBreakup: salaryBreakup !== undefined ? (salaryBreakup ? salaryBreakup.trim() : null) : undefined,
          vacancies: vacancies !== undefined ? parseInt(String(vacancies), 10) : undefined,
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
          selectionProcess: selectionProcess !== undefined ? (selectionProcess ? selectionProcess.trim() : null) : undefined,
          status: status || undefined,
        },
      });

      if (eligibilityCriteria) {
        await tx.eligibilityCriteria.upsert({
          where: { jobId },
          update: {
            minCgpa: eligibilityCriteria.minCgpa !== undefined ? (eligibilityCriteria.minCgpa ? new Prisma.Decimal(eligibilityCriteria.minCgpa) : null) : undefined,
            minPercentage: eligibilityCriteria.minPercentage !== undefined ? (eligibilityCriteria.minPercentage ? new Prisma.Decimal(eligibilityCriteria.minPercentage) : null) : undefined,
            maxBacklogs: eligibilityCriteria.maxBacklogs !== undefined ? parseInt(String(eligibilityCriteria.maxBacklogs), 10) : undefined,
            allowedCourses: eligibilityCriteria.allowedCourses !== undefined ? JSON.stringify(eligibilityCriteria.allowedCourses) : undefined,
            allowedPrograms: eligibilityCriteria.allowedPrograms !== undefined ? JSON.stringify(eligibilityCriteria.allowedPrograms) : undefined,
            allowedDepartments: eligibilityCriteria.allowedDepartments !== undefined ? JSON.stringify(eligibilityCriteria.allowedDepartments) : undefined,
            allowedSemesters: eligibilityCriteria.allowedSemesters !== undefined ? JSON.stringify(eligibilityCriteria.allowedSemesters) : undefined,
            graduationYears: eligibilityCriteria.graduationYears !== undefined ? JSON.stringify(eligibilityCriteria.graduationYears) : undefined,
            requiredSkills: eligibilityCriteria.requiredSkills !== undefined ? JSON.stringify(eligibilityCriteria.requiredSkills) : undefined,
            additionalCriteria: eligibilityCriteria.additionalCriteria !== undefined ? (eligibilityCriteria.additionalCriteria ? eligibilityCriteria.additionalCriteria.trim() : null) : undefined,
          },
          create: {
            jobId,
            minCgpa: eligibilityCriteria.minCgpa ? new Prisma.Decimal(eligibilityCriteria.minCgpa) : null,
            minPercentage: eligibilityCriteria.minPercentage ? new Prisma.Decimal(eligibilityCriteria.minPercentage) : null,
            maxBacklogs: parseInt(String(eligibilityCriteria.maxBacklogs ?? 0), 10),
            allowedCourses: eligibilityCriteria.allowedCourses ? JSON.stringify(eligibilityCriteria.allowedCourses) : null,
            allowedPrograms: eligibilityCriteria.allowedPrograms ? JSON.stringify(eligibilityCriteria.allowedPrograms) : null,
            allowedDepartments: eligibilityCriteria.allowedDepartments ? JSON.stringify(eligibilityCriteria.allowedDepartments) : null,
            allowedSemesters: eligibilityCriteria.allowedSemesters ? JSON.stringify(eligibilityCriteria.allowedSemesters) : null,
            graduationYears: eligibilityCriteria.graduationYears ? JSON.stringify(eligibilityCriteria.graduationYears) : null,
            requiredSkills: eligibilityCriteria.requiredSkills ? JSON.stringify(eligibilityCriteria.requiredSkills) : null,
            additionalCriteria: eligibilityCriteria.additionalCriteria ? eligibilityCriteria.additionalCriteria.trim() : null,
          },
        });
      }

      return job;
    });

    res.json({
      success: true,
      message: 'Job posting updated successfully.',
      data: updatedJob,
    });
  } catch (error: unknown) {
    console.error('Error updating job posting:', error);
    res.status(500).json({ success: false, message: 'Failed to update job posting.' });
  }
}

export async function submitJobForApproval(req: Request, res: Response): Promise<void> {
  try {
    const jobId = parseInt(String(req.params.id), 10);
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.companyId !== recruiter.companyId) {
      res.status(404).json({ success: false, message: 'Job not found or access denied.' });
      return;
    }

    if (job.status !== OpportunityStatus.DRAFT) {
      res.status(400).json({ success: false, message: `Only DRAFT jobs can be submitted for approval (current: ${job.status}).` });
      return;
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: OpportunityStatus.PENDING_APPROVAL },
    });

    res.json({
      success: true,
      message: 'Job submitted to Placement Administration for review and approval.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error submitting job for approval:', error);
    res.status(500).json({ success: false, message: 'Failed to submit job for approval.' });
  }
}

export async function closeJob(req: Request, res: Response): Promise<void> {
  try {
    const jobId = parseInt(String(req.params.id), 10);
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || (job.companyId !== recruiter.companyId && req.user!.role !== UserRole.SUPER_ADMIN)) {
      res.status(404).json({ success: false, message: 'Job not found or access denied.' });
      return;
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status: OpportunityStatus.CLOSED },
    });

    res.json({
      success: true,
      message: 'Job has been closed.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error closing job:', error);
    res.status(500).json({ success: false, message: 'Failed to close job.' });
  }
}

// ==========================================
// 2. RECRUITER: INTERNSHIPS MANAGEMENT
// ==========================================

export async function getMyCompanyInternships(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({ success: false, message: 'Recruiter company profile not found.' });
      return;
    }

    const internships = await prisma.internship.findMany({
      where: { companyId: recruiter.companyId },
      include: {
        eligibilityCriteria: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: internships.map((internship) => ({
        ...internship,
        applicationsCount: internship._count.applications,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching recruiter company internships:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company internships.' });
  }
}

export async function createInternship(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({ success: false, message: 'Recruiter company profile not found.' });
      return;
    }

    const errors = validateInternshipInput(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    if (req.body.eligibilityCriteria) {
      const eligErrors = validateEligibilityInput(req.body.eligibilityCriteria);
      if (eligErrors.length > 0) {
        res.status(400).json({ success: false, message: 'Eligibility validation failed', errors: eligErrors });
        return;
      }
    }

    const {
      title,
      description,
      responsibilities,
      duration,
      startDate,
      endDate,
      stipendAmount,
      stipendCurrency,
      stipendPeriod,
      location,
      workMode,
      requiredSkills,
      vacancies,
      applicationDeadline,
      selectionProcess,
      isPPOApplicable,
      status,
      eligibilityCriteria,
    } = req.body;

    let initialStatus: OpportunityStatus = OpportunityStatus.DRAFT;
    if (status === OpportunityStatus.PENDING_APPROVAL) {
      initialStatus = OpportunityStatus.PENDING_APPROVAL;
    }

    const createdInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          companyId: recruiter.companyId,
          recruiterId: recruiter.id,
          title: title.trim(),
          description: description.trim(),
          responsibilities: responsibilities.trim(),
          duration: duration.trim(),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          stipendAmount: new Prisma.Decimal(stipendAmount || 0),
          stipendCurrency: stipendCurrency || 'INR',
          stipendPeriod: stipendPeriod || StipendPeriod.PER_MONTH,
          location: location.trim(),
          workMode: workMode || WorkMode.ON_SITE,
          requiredSkills: requiredSkills ? requiredSkills.trim() : '',
          vacancies: parseInt(String(vacancies || 1), 10),
          applicationDeadline: new Date(applicationDeadline),
          selectionProcess: selectionProcess ? selectionProcess.trim() : null,
          isPPOApplicable: Boolean(isPPOApplicable),
          status: initialStatus,
        },
      });

      if (eligibilityCriteria) {
        await tx.eligibilityCriteria.create({
          data: {
            internshipId: internship.id,
            minCgpa: eligibilityCriteria.minCgpa ? new Prisma.Decimal(eligibilityCriteria.minCgpa) : null,
            minPercentage: eligibilityCriteria.minPercentage ? new Prisma.Decimal(eligibilityCriteria.minPercentage) : null,
            maxBacklogs: parseInt(String(eligibilityCriteria.maxBacklogs ?? 0), 10),
            allowedCourses: eligibilityCriteria.allowedCourses ? JSON.stringify(eligibilityCriteria.allowedCourses) : null,
            allowedPrograms: eligibilityCriteria.allowedPrograms ? JSON.stringify(eligibilityCriteria.allowedPrograms) : null,
            allowedDepartments: eligibilityCriteria.allowedDepartments ? JSON.stringify(eligibilityCriteria.allowedDepartments) : null,
            allowedSemesters: eligibilityCriteria.allowedSemesters ? JSON.stringify(eligibilityCriteria.allowedSemesters) : null,
            graduationYears: eligibilityCriteria.graduationYears ? JSON.stringify(eligibilityCriteria.graduationYears) : null,
            requiredSkills: eligibilityCriteria.requiredSkills ? JSON.stringify(eligibilityCriteria.requiredSkills) : null,
            additionalCriteria: eligibilityCriteria.additionalCriteria ? eligibilityCriteria.additionalCriteria.trim() : null,
          },
        });
      }

      return internship;
    });

    res.status(201).json({
      success: true,
      message: 'Internship posting created successfully.',
      data: createdInternship,
    });
  } catch (error: unknown) {
    console.error('Error creating internship posting:', error);
    res.status(500).json({ success: false, message: 'Failed to create internship posting.' });
  }
}

export async function updateInternship(req: Request, res: Response): Promise<void> {
  try {
    const internshipId = parseInt(String(req.params.id), 10);
    if (isNaN(internshipId)) {
      res.status(400).json({ success: false, message: 'Invalid internship ID.' });
      return;
    }

    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const existing = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: { eligibilityCriteria: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Internship not found.' });
      return;
    }

    if (existing.companyId !== recruiter.companyId && req.user!.role !== UserRole.SUPER_ADMIN) {
      res.status(403).json({ success: false, message: 'You are not authorized to modify this internship.' });
      return;
    }

    const errors = validateInternshipInput(req.body, true);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    if (req.body.eligibilityCriteria) {
      const eligErrors = validateEligibilityInput(req.body.eligibilityCriteria);
      if (eligErrors.length > 0) {
        res.status(400).json({ success: false, message: 'Eligibility validation failed', errors: eligErrors });
        return;
      }
    }

    if (req.body.status && req.body.status !== existing.status) {
      const transition = validateStatusTransition(existing.status, req.body.status, req.user!.role);
      if (!transition.isValid) {
        res.status(400).json({ success: false, message: transition.message });
        return;
      }
    }

    const {
      title,
      description,
      responsibilities,
      duration,
      startDate,
      endDate,
      stipendAmount,
      stipendCurrency,
      stipendPeriod,
      location,
      workMode,
      requiredSkills,
      vacancies,
      applicationDeadline,
      selectionProcess,
      isPPOApplicable,
      status,
      eligibilityCriteria,
    } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.update({
        where: { id: internshipId },
        data: {
          title: title !== undefined ? title.trim() : undefined,
          description: description !== undefined ? description.trim() : undefined,
          responsibilities: responsibilities !== undefined ? responsibilities.trim() : undefined,
          duration: duration !== undefined ? duration.trim() : undefined,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
          stipendAmount: stipendAmount !== undefined ? new Prisma.Decimal(stipendAmount) : undefined,
          stipendCurrency: stipendCurrency || undefined,
          stipendPeriod: stipendPeriod || undefined,
          location: location !== undefined ? location.trim() : undefined,
          workMode: workMode || undefined,
          requiredSkills: requiredSkills !== undefined ? requiredSkills.trim() : undefined,
          vacancies: vacancies !== undefined ? parseInt(String(vacancies), 10) : undefined,
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
          selectionProcess: selectionProcess !== undefined ? (selectionProcess ? selectionProcess.trim() : null) : undefined,
          isPPOApplicable: isPPOApplicable !== undefined ? Boolean(isPPOApplicable) : undefined,
          status: status || undefined,
        },
      });

      if (eligibilityCriteria) {
        await tx.eligibilityCriteria.upsert({
          where: { internshipId },
          update: {
            minCgpa: eligibilityCriteria.minCgpa !== undefined ? (eligibilityCriteria.minCgpa ? new Prisma.Decimal(eligibilityCriteria.minCgpa) : null) : undefined,
            minPercentage: eligibilityCriteria.minPercentage !== undefined ? (eligibilityCriteria.minPercentage ? new Prisma.Decimal(eligibilityCriteria.minPercentage) : null) : undefined,
            maxBacklogs: eligibilityCriteria.maxBacklogs !== undefined ? parseInt(String(eligibilityCriteria.maxBacklogs), 10) : undefined,
            allowedCourses: eligibilityCriteria.allowedCourses !== undefined ? JSON.stringify(eligibilityCriteria.allowedCourses) : undefined,
            allowedPrograms: eligibilityCriteria.allowedPrograms !== undefined ? JSON.stringify(eligibilityCriteria.allowedPrograms) : undefined,
            allowedDepartments: eligibilityCriteria.allowedDepartments !== undefined ? JSON.stringify(eligibilityCriteria.allowedDepartments) : undefined,
            allowedSemesters: eligibilityCriteria.allowedSemesters !== undefined ? JSON.stringify(eligibilityCriteria.allowedSemesters) : undefined,
            graduationYears: eligibilityCriteria.graduationYears !== undefined ? JSON.stringify(eligibilityCriteria.graduationYears) : undefined,
            requiredSkills: eligibilityCriteria.requiredSkills !== undefined ? JSON.stringify(eligibilityCriteria.requiredSkills) : undefined,
            additionalCriteria: eligibilityCriteria.additionalCriteria !== undefined ? (eligibilityCriteria.additionalCriteria ? eligibilityCriteria.additionalCriteria.trim() : null) : undefined,
          },
          create: {
            internshipId,
            minCgpa: eligibilityCriteria.minCgpa ? new Prisma.Decimal(eligibilityCriteria.minCgpa) : null,
            minPercentage: eligibilityCriteria.minPercentage ? new Prisma.Decimal(eligibilityCriteria.minPercentage) : null,
            maxBacklogs: parseInt(String(eligibilityCriteria.maxBacklogs ?? 0), 10),
            allowedCourses: eligibilityCriteria.allowedCourses ? JSON.stringify(eligibilityCriteria.allowedCourses) : null,
            allowedPrograms: eligibilityCriteria.allowedPrograms ? JSON.stringify(eligibilityCriteria.allowedPrograms) : null,
            allowedDepartments: eligibilityCriteria.allowedDepartments ? JSON.stringify(eligibilityCriteria.allowedDepartments) : null,
            allowedSemesters: eligibilityCriteria.allowedSemesters ? JSON.stringify(eligibilityCriteria.allowedSemesters) : null,
            graduationYears: eligibilityCriteria.graduationYears ? JSON.stringify(eligibilityCriteria.graduationYears) : null,
            requiredSkills: eligibilityCriteria.requiredSkills ? JSON.stringify(eligibilityCriteria.requiredSkills) : null,
            additionalCriteria: eligibilityCriteria.additionalCriteria ? eligibilityCriteria.additionalCriteria.trim() : null,
          },
        });
      }

      return internship;
    });

    res.json({
      success: true,
      message: 'Internship updated successfully.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating internship posting:', error);
    res.status(500).json({ success: false, message: 'Failed to update internship posting.' });
  }
}

export async function submitInternshipForApproval(req: Request, res: Response): Promise<void> {
  try {
    const internshipId = parseInt(String(req.params.id), 10);
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
    if (!internship || internship.companyId !== recruiter.companyId) {
      res.status(404).json({ success: false, message: 'Internship not found or access denied.' });
      return;
    }

    if (internship.status !== OpportunityStatus.DRAFT) {
      res.status(400).json({ success: false, message: `Only DRAFT internships can be submitted for approval (current: ${internship.status}).` });
      return;
    }

    const updated = await prisma.internship.update({
      where: { id: internshipId },
      data: { status: OpportunityStatus.PENDING_APPROVAL },
    });

    res.json({
      success: true,
      message: 'Internship submitted to Placement Administration for review.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error submitting internship for approval:', error);
    res.status(500).json({ success: false, message: 'Failed to submit internship for approval.' });
  }
}

export async function closeInternship(req: Request, res: Response): Promise<void> {
  try {
    const internshipId = parseInt(String(req.params.id), 10);
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
    if (!internship || (internship.companyId !== recruiter.companyId && req.user!.role !== UserRole.SUPER_ADMIN)) {
      res.status(404).json({ success: false, message: 'Internship not found or access denied.' });
      return;
    }

    const updated = await prisma.internship.update({
      where: { id: internshipId },
      data: { status: OpportunityStatus.CLOSED },
    });

    res.json({
      success: true,
      message: 'Internship has been closed.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error closing internship:', error);
    res.status(500).json({ success: false, message: 'Failed to close internship.' });
  }
}

// ==========================================
// 3. STUDENT & DISCOVERY APIS (SEARCH / FILTER / SORT / PAGINATE)
// ==========================================

export async function discoverOpportunities(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const type = (req.query.type as string) || 'ALL'; // 'ALL' | 'JOB' | 'INTERNSHIP'
    const search = ((req.query.search as string) || '').trim();
    const workMode = req.query.workMode as WorkMode | undefined;
    const location = ((req.query.location as string) || '').trim();
    const employmentType = req.query.employmentType as EmploymentType | undefined;
    const sortBy = (req.query.sortBy as string) || 'newest'; // 'newest' | 'deadline' | 'salary'
    const sortOrder: Prisma.SortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    // Role visibility: Students only see PUBLISHED opportunities
    const isStudent = req.user?.role === UserRole.STUDENT;
    const requiredStatus = isStudent ? OpportunityStatus.PUBLISHED : undefined;

    // Student profile for inline eligibility check
    let student: StudentWithAcademicData | null = null;
    if (isStudent && req.user) {
      student = await getAuthenticatedStudent(req.user.id);
    }

    const items: any[] = [];
    let totalCount = 0;

    // 1. Fetch Jobs if requested
    if (type === 'ALL' || type === 'JOB') {
      const jobWhere: Prisma.JobWhereInput = {
        ...(requiredStatus ? { status: requiredStatus } : {}),
        ...(workMode ? { workMode } : {}),
        ...(employmentType ? { employmentType } : {}),
        ...(location ? { location: { contains: location } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { company: { name: { contains: search } } },
                { requiredSkills: { contains: search } },
                { location: { contains: search } },
              ],
            }
          : {}),
      };

      const [jobs, jobCount] = await Promise.all([
        prisma.job.findMany({
          where: jobWhere,
          include: {
            company: {
              select: { id: true, name: true, logoUrl: true, industry: true, verificationStatus: true },
            },
            eligibilityCriteria: true,
          },
          orderBy:
            sortBy === 'deadline'
              ? { applicationDeadline: sortOrder }
              : sortBy === 'salary'
              ? { salaryMax: sortOrder }
              : { createdAt: sortOrder },
        }),
        prisma.job.count({ where: jobWhere }),
      ]);

      const formattedJobs = jobs.map((job) => {
        let eligibilityEvaluation = null;
        if (student) {
          eligibilityEvaluation = evaluateStudentEligibility(student, job.eligibilityCriteria);
        }

        const isDeadlinePassed = new Date(job.applicationDeadline) < new Date();

        return {
          id: job.id,
          type: 'JOB',
          title: job.title,
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          requiredSkills: job.requiredSkills,
          employmentType: job.employmentType,
          location: job.location,
          workMode: job.workMode,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          vacancies: job.vacancies,
          applicationDeadline: job.applicationDeadline,
          isDeadlinePassed,
          status: job.status,
          company: job.company,
          createdAt: job.createdAt,
          eligibilityCriteria: job.eligibilityCriteria,
          eligibility: eligibilityEvaluation
            ? { isEligible: eligibilityEvaluation.isEligible, reasons: eligibilityEvaluation.reasons }
            : null,
        };
      });

      items.push(...formattedJobs);
      totalCount += jobCount;
    }

    // 2. Fetch Internships if requested
    if (type === 'ALL' || type === 'INTERNSHIP') {
      const internshipWhere: Prisma.InternshipWhereInput = {
        ...(requiredStatus ? { status: requiredStatus } : {}),
        ...(workMode ? { workMode } : {}),
        ...(location ? { location: { contains: location } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { company: { name: { contains: search } } },
                { requiredSkills: { contains: search } },
                { location: { contains: search } },
              ],
            }
          : {}),
      };

      const [internships, internshipCount] = await Promise.all([
        prisma.internship.findMany({
          where: internshipWhere,
          include: {
            company: {
              select: { id: true, name: true, logoUrl: true, industry: true, verificationStatus: true },
            },
            eligibilityCriteria: true,
          },
          orderBy:
            sortBy === 'deadline'
              ? { applicationDeadline: sortOrder }
              : sortBy === 'salary'
              ? { stipendAmount: sortOrder }
              : { createdAt: sortOrder },
        }),
        prisma.internship.count({ where: internshipWhere }),
      ]);

      const formattedInternships = internships.map((internship) => {
        let eligibilityEvaluation = null;
        if (student) {
          eligibilityEvaluation = evaluateStudentEligibility(student, internship.eligibilityCriteria);
        }

        const isDeadlinePassed = new Date(internship.applicationDeadline) < new Date();

        return {
          id: internship.id,
          type: 'INTERNSHIP',
          title: internship.title,
          description: internship.description,
          responsibilities: internship.responsibilities,
          duration: internship.duration,
          startDate: internship.startDate,
          endDate: internship.endDate,
          stipendAmount: internship.stipendAmount,
          stipendCurrency: internship.stipendCurrency,
          stipendPeriod: internship.stipendPeriod,
          location: internship.location,
          workMode: internship.workMode,
          requiredSkills: internship.requiredSkills,
          vacancies: internship.vacancies,
          applicationDeadline: internship.applicationDeadline,
          isPPOApplicable: internship.isPPOApplicable,
          isDeadlinePassed,
          status: internship.status,
          company: internship.company,
          createdAt: internship.createdAt,
          eligibilityCriteria: internship.eligibilityCriteria,
          eligibility: eligibilityEvaluation
            ? { isEligible: eligibilityEvaluation.isEligible, reasons: eligibilityEvaluation.reasons }
            : null,
        };
      });

      items.push(...formattedInternships);
      totalCount += internshipCount;
    }

    // Sort combined results if 'ALL'
    if (type === 'ALL') {
      items.sort((a, b) => {
        if (sortBy === 'deadline') {
          const dateA = new Date(a.applicationDeadline).getTime();
          const dateB = new Date(b.applicationDeadline).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    // Apply pagination slice on combined items
    const paginatedItems = items.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    res.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error discovering opportunities:', error);
    res.status(500).json({ success: false, message: 'Failed to discover opportunities.' });
  }
}

export async function getJobDetails(req: Request, res: Response): Promise<void> {
  try {
    const jobId = parseInt(String(req.params.id), 10);
    if (isNaN(jobId)) {
      res.status(400).json({ success: false, message: 'Invalid job ID.' });
      return;
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        recruiter: {
          select: { id: true, fullName: true, designation: true, email: true },
        },
        eligibilityCriteria: true,
      },
    });

    if (!job) {
      res.status(404).json({ success: false, message: 'Job posting not found.' });
      return;
    }

    // If student, cannot see unapproved opportunities
    if (req.user?.role === UserRole.STUDENT && job.status !== OpportunityStatus.PUBLISHED) {
      res.status(403).json({ success: false, message: 'This opportunity is not currently available for discovery.' });
      return;
    }

    // If recruiter from another company, restrict
    if (req.user?.role === UserRole.RECRUITER) {
      const currentRecruiter = await getAuthenticatedRecruiter(req.user.id);
      if (currentRecruiter && currentRecruiter.companyId !== job.companyId) {
        // Only allow if published
        if (job.status !== OpportunityStatus.PUBLISHED) {
          res.status(403).json({ success: false, message: 'Access denied.' });
          return;
        }
      }
    }

    const isDeadlinePassed = new Date(job.applicationDeadline) < new Date();

    // If authenticated student, evaluate eligibility using actual student database data
    let studentEligibility = null;
    if (req.user?.role === UserRole.STUDENT) {
      const student = await getAuthenticatedStudent(req.user.id);
      if (student) {
        studentEligibility = evaluateStudentEligibility(student, job.eligibilityCriteria);
      }
    }

    res.json({
      success: true,
      data: {
        ...job,
        type: 'JOB',
        isDeadlinePassed,
        studentEligibility,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve job details.' });
  }
}

export async function getInternshipDetails(req: Request, res: Response): Promise<void> {
  try {
    const internshipId = parseInt(String(req.params.id), 10);
    if (isNaN(internshipId)) {
      res.status(400).json({ success: false, message: 'Invalid internship ID.' });
      return;
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        company: true,
        recruiter: {
          select: { id: true, fullName: true, designation: true, email: true },
        },
        eligibilityCriteria: true,
      },
    });

    if (!internship) {
      res.status(404).json({ success: false, message: 'Internship posting not found.' });
      return;
    }

    if (req.user?.role === UserRole.STUDENT && internship.status !== OpportunityStatus.PUBLISHED) {
      res.status(403).json({ success: false, message: 'This opportunity is not currently available for discovery.' });
      return;
    }

    const isDeadlinePassed = new Date(internship.applicationDeadline) < new Date();

    let studentEligibility = null;
    if (req.user?.role === UserRole.STUDENT) {
      const student = await getAuthenticatedStudent(req.user.id);
      if (student) {
        studentEligibility = evaluateStudentEligibility(student, internship.eligibilityCriteria);
      }
    }

    res.json({
      success: true,
      data: {
        ...internship,
        type: 'INTERNSHIP',
        isDeadlinePassed,
        studentEligibility,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching internship details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve internship details.' });
  }
}

export async function checkStudentEligibilityForOpportunity(req: Request, res: Response): Promise<void> {
  try {
    const type = String(req.params.type || '').toUpperCase(); // 'JOB' | 'INTERNSHIP'
    const id = parseInt(String(req.params.id), 10);

    if (isNaN(id) || !['JOB', 'INTERNSHIP'].includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid opportunity parameters.' });
      return;
    }

    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    let criteria = null;
    let title = '';
    let companyName = '';

    if (type === 'JOB') {
      const job = await prisma.job.findUnique({
        where: { id },
        include: { eligibilityCriteria: true, company: { select: { name: true } } },
      });
      if (!job) {
        res.status(404).json({ success: false, message: 'Job not found.' });
        return;
      }
      criteria = job.eligibilityCriteria;
      title = job.title;
      companyName = job.company.name;
    } else {
      const internship = await prisma.internship.findUnique({
        where: { id },
        include: { eligibilityCriteria: true, company: { select: { name: true } } },
      });
      if (!internship) {
        res.status(404).json({ success: false, message: 'Internship not found.' });
        return;
      }
      criteria = internship.eligibilityCriteria;
      title = internship.title;
      companyName = internship.company.name;
    }

    const evaluation = evaluateStudentEligibility(student, criteria);

    res.json({
      success: true,
      data: {
        opportunity: { id, type, title, companyName },
        ...evaluation,
      },
    });
  } catch (error: unknown) {
    console.error('Error checking student eligibility:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate student eligibility.' });
  }
}

// ==========================================
// 4. PLACEMENT ADMIN & SUPER ADMIN APIS
// ==========================================

export async function getAdminOpportunities(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '15'), 10)));
    const skip = (page - 1) * limit;

    const status = req.query.status as OpportunityStatus | undefined;
    const type = (req.query.type as string) || 'ALL';
    const search = ((req.query.search as string) || '').trim();

    const items: any[] = [];
    let totalCount = 0;

    if (type === 'ALL' || type === 'JOB') {
      const jobWhere: Prisma.JobWhereInput = {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { company: { name: { contains: search } } },
              ],
            }
          : {}),
      };

      const [jobs, count] = await Promise.all([
        prisma.job.findMany({
          where: jobWhere,
          include: {
            company: { select: { id: true, name: true, logoUrl: true, verificationStatus: true } },
            recruiter: { select: { id: true, fullName: true, email: true } },
            eligibilityCriteria: true,
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.job.count({ where: jobWhere }),
      ]);

      items.push(
        ...jobs.map((j) => ({
          ...j,
          type: 'JOB',
          applicationsCount: j._count.applications,
        }))
      );
      totalCount += count;
    }

    if (type === 'ALL' || type === 'INTERNSHIP') {
      const internshipWhere: Prisma.InternshipWhereInput = {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { company: { name: { contains: search } } },
              ],
            }
          : {}),
      };

      const [internships, count] = await Promise.all([
        prisma.internship.findMany({
          where: internshipWhere,
          include: {
            company: { select: { id: true, name: true, logoUrl: true, verificationStatus: true } },
            recruiter: { select: { id: true, fullName: true, email: true } },
            eligibilityCriteria: true,
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.internship.count({ where: internshipWhere }),
      ]);

      items.push(
        ...internships.map((i) => ({
          ...i,
          type: 'INTERNSHIP',
          applicationsCount: i._count.applications,
        }))
      );
      totalCount += count;
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paginated = items.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        items: paginated,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching admin opportunities:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin opportunities.' });
  }
}

export async function reviewOpportunity(req: Request, res: Response): Promise<void> {
  try {
    const type = String(req.params.type || '').toUpperCase(); // 'JOB' | 'INTERNSHIP'
    const id = parseInt(String(req.params.id), 10);
    const { action, notes } = req.body; // 'APPROVE' | 'REJECT' | 'CLOSE' | 'ARCHIVE'

    if (isNaN(id) || !['JOB', 'INTERNSHIP'].includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid opportunity parameters.' });
      return;
    }

    let targetStatus: OpportunityStatus;
    switch (action) {
      case 'APPROVE':
        targetStatus = OpportunityStatus.PUBLISHED;
        break;
      case 'REJECT':
        targetStatus = OpportunityStatus.DRAFT;
        break;
      case 'CLOSE':
        targetStatus = OpportunityStatus.CLOSED;
        break;
      case 'ARCHIVE':
        targetStatus = OpportunityStatus.ARCHIVED;
        break;
      default:
        res.status(400).json({ success: false, message: 'Invalid action. Must be APPROVE, REJECT, CLOSE, or ARCHIVE.' });
        return;
    }

    let updatedOpportunity = null;

    if (type === 'JOB') {
      const job = await prisma.job.findUnique({ where: { id } });
      if (!job) {
        res.status(404).json({ success: false, message: 'Job not found.' });
        return;
      }

      updatedOpportunity = await prisma.job.update({
        where: { id },
        data: { status: targetStatus },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: `JOB_${action}`,
          entity: 'Job',
          entityId: String(id),
          oldValues: JSON.stringify({ status: job.status }),
          newValues: JSON.stringify({ status: targetStatus, notes: notes || null }),
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'NexHire-Admin',
        },
      });
    } else {
      const internship = await prisma.internship.findUnique({ where: { id } });
      if (!internship) {
        res.status(404).json({ success: false, message: 'Internship not found.' });
        return;
      }

      updatedOpportunity = await prisma.internship.update({
        where: { id },
        data: { status: targetStatus },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: `INTERNSHIP_${action}`,
          entity: 'Internship',
          entityId: String(id),
          oldValues: JSON.stringify({ status: internship.status }),
          newValues: JSON.stringify({ status: targetStatus, notes: notes || null }),
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'NexHire-Admin',
        },
      });
    }

    res.json({
      success: true,
      message: `Opportunity ${action.toLowerCase()}d successfully. New status: ${targetStatus}.`,
      data: updatedOpportunity,
    });
  } catch (error: unknown) {
    console.error('Error reviewing opportunity:', error);
    res.status(500).json({ success: false, message: 'Failed to review opportunity.' });
  }
}
