import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ApplicationStatus, InterviewMode, InterviewResult, InterviewStatus, Prisma, UserRole } from '@prisma/client';
import {
  validateScheduleInterviewInput,
  validateRescheduleInterviewInput,
  validateRecordInterviewResultInput,
  validateCreateInterviewRoundInput,
} from '../validations/interview.validation.js';

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
// 1. INTERVIEW SCHEDULING & MANAGEMENT
// ==========================================

/**
 * Schedule an interview for an application.
 * Business Rules:
 * - Application must be in SHORTLISTED or INTERVIEW_SCHEDULED state.
 * - Recruiter can only schedule for opportunities belonging to their company.
 * - Placement Admin and Super Admin have institutional scheduling authority.
 * - Students CANNOT schedule interviews.
 * - Creates ApplicationStatusHistory when moving from SHORTLISTED -> INTERVIEW_SCHEDULED.
 */
export async function scheduleInterview(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateScheduleInterviewInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid interview scheduling parameters.',
        errors: validation.errors,
      });
      return;
    }

    const {
      applicationId,
      roundId,
      roundNumber: reqRoundNumber,
      roundName,
      interviewDate,
      startTime,
      endTime,
      mode,
      location,
      meetingLink,
      interviewerName,
      notes,
    } = validation.value;

    // Fetch application with opportunity and student details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { id: true, companyId: true, title: true } },
        internship: { select: { id: true, companyId: true, title: true } },
        student: { select: { id: true, fullName: true, studentId: true } },
        interviews: {
          orderBy: { roundNumber: 'desc' },
          select: { id: true, roundNumber: true, roundName: true, status: true, result: true },
        },
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const oppCompanyId = application.job?.companyId || application.internship?.companyId;
    if (!oppCompanyId) {
      res.status(400).json({ success: false, message: 'Application is not linked to a valid opportunity company.' });
      return;
    }

    // Role-based boundary check
    let recruiterId: number | null = null;
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== oppCompanyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only schedule interviews for your own company’s candidates.',
        });
        return;
      }
      recruiterId = recruiter.id;
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students are not authorized to schedule interviews.' });
      return;
    }

    // Check application eligibility state
    // An application can ONLY enter or continue interview process if SHORTLISTED or INTERVIEW_SCHEDULED
    if (
      application.status !== ApplicationStatus.SHORTLISTED &&
      application.status !== ApplicationStatus.INTERVIEW_SCHEDULED
    ) {
      res.status(400).json({
        success: false,
        message: `Cannot schedule an interview for an application in '${application.status}' state. Application must be SHORTLISTED first.`,
      });
      return;
    }

    // Compute round number if not specified
    const nextRoundNumber = reqRoundNumber || (application.interviews.length > 0 ? application.interviews[0].roundNumber + 1 : 1);

    // Verify roundId if provided
    if (roundId) {
      const roundRecord = await prisma.interviewRound.findUnique({
        where: { id: roundId },
      });
      if (
        !roundRecord ||
        (application.jobId && roundRecord.jobId !== application.jobId) ||
        (application.internshipId && roundRecord.internshipId !== application.internshipId)
      ) {
        res.status(400).json({ success: false, message: 'Specified interview round does not belong to this opportunity.' });
        return;
      }
    }

    const scheduledDate = new Date(interviewDate);
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    const interview = await prisma.$transaction(async (tx) => {
      const createdInterview = await tx.interview.create({
        data: {
          applicationId,
          roundId: roundId || null,
          studentId: application.studentId,
          companyId: oppCompanyId,
          jobId: application.jobId,
          internshipId: application.internshipId,
          recruiterId,
          roundNumber: nextRoundNumber,
          roundName,
          interviewDate: scheduledDate,
          startTime: startDateTime,
          endTime: endDateTime,
          mode,
          location: mode === InterviewMode.IN_PERSON ? location : null,
          meetingLink: mode === InterviewMode.ONLINE ? meetingLink : null,
          interviewerName: interviewerName || null,
          notes: notes || null,
          status: InterviewStatus.SCHEDULED,
          result: InterviewResult.PENDING,
        },
        include: {
          round: true,
          company: { select: { id: true, name: true, logoUrl: true } },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              department: { select: { name: true } },
              user: { select: { email: true } },
            },
          },
        },
      });

      // If application is SHORTLISTED, advance status to INTERVIEW_SCHEDULED
      if (application.status === ApplicationStatus.SHORTLISTED) {
        await tx.application.update({
          where: { id: applicationId },
          data: {
            status: ApplicationStatus.INTERVIEW_SCHEDULED,
            statusRemarks: `Interview scheduled for Round ${nextRoundNumber}: ${roundName}`,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId,
            previousStatus: ApplicationStatus.SHORTLISTED,
            newStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
            changedById: req.user!.id,
            note: `Round ${nextRoundNumber} interview scheduled (${roundName}) on ${scheduledDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`,
          },
        });
      } else {
        // Application is already in INTERVIEW_SCHEDULED (scheduling another round)
        await tx.applicationStatusHistory.create({
          data: {
            applicationId,
            previousStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
            newStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
            changedById: req.user!.id,
            note: `Subsequent Round ${nextRoundNumber} scheduled: ${roundName}`,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'SCHEDULE_INTERVIEW',
          entity: 'Interview',
          entityId: String(createdInterview.id),
          newValues: JSON.stringify({
            applicationId,
            roundNumber: nextRoundNumber,
            roundName,
            interviewDate,
            mode,
          }),
        },
      });

      return createdInterview;
    });

    res.status(201).json({
      success: true,
      message: `Interview successfully scheduled for Round ${interview.roundNumber} (${interview.roundName}).`,
      data: interview,
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule interview.' });
  }
}

/**
 * Reschedule an existing interview.
 */
export async function rescheduleInterview(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid interview ID.' });
      return;
    }

    const validation = validateRescheduleInterviewInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid rescheduling parameters.',
        errors: validation.errors,
      });
      return;
    }

    const { interviewDate, startTime, endTime, mode, location, meetingLink, notes } = validation.value;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found.' });
      return;
    }

    // Authorization check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== interview.companyId) {
        res.status(403).json({ success: false, message: 'Access denied: You can only reschedule interviews for your company.' });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students are not authorized to reschedule interviews.' });
      return;
    }

    if (interview.status === InterviewStatus.COMPLETED) {
      res.status(400).json({ success: false, message: 'Cannot reschedule an interview that is already completed.' });
      return;
    }

    const newMode = mode || interview.mode;
    const newLocation = newMode === InterviewMode.IN_PERSON ? (location ?? interview.location) : null;
    const newMeetingLink = newMode === InterviewMode.ONLINE ? (meetingLink ?? interview.meetingLink) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedInterview = await tx.interview.update({
        where: { id },
        data: {
          interviewDate: new Date(interviewDate),
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          mode: newMode,
          location: newLocation,
          meetingLink: newMeetingLink,
          status: InterviewStatus.RESCHEDULED,
          notes: notes ? (interview.notes ? `${interview.notes}\n[Rescheduled]: ${notes}` : `[Rescheduled]: ${notes}`) : interview.notes,
        },
        include: {
          student: { select: { id: true, fullName: true, studentId: true } },
          company: { select: { id: true, name: true } },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'RESCHEDULE_INTERVIEW',
          entity: 'Interview',
          entityId: String(id),
          oldValues: JSON.stringify({
            interviewDate: interview.interviewDate,
            startTime: interview.startTime,
            endTime: interview.endTime,
          }),
          newValues: JSON.stringify({
            interviewDate,
            startTime,
            endTime,
            mode: newMode,
          }),
        },
      });

      return updatedInterview;
    });

    res.json({
      success: true,
      message: 'Interview successfully rescheduled.',
      data: updated,
    });
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule interview.' });
  }
}

/**
 * Cancel an interview.
 */
export async function cancelInterview(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid interview ID.' });
      return;
    }

    const reason = req.body?.reason ? String(req.body.reason).trim() : 'Cancelled by administrator/recruiter';

    const interview = await prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found.' });
      return;
    }

    // Role check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== interview.companyId) {
        res.status(403).json({ success: false, message: 'Access denied: You can only cancel your company’s interviews.' });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students are not authorized to cancel interviews.' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.interview.update({
        where: { id },
        data: {
          status: InterviewStatus.CANCELLED,
          notes: interview.notes ? `${interview.notes}\n[Cancelled]: ${reason}` : `[Cancelled]: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CANCEL_INTERVIEW',
          entity: 'Interview',
          entityId: String(id),
          newValues: JSON.stringify({ status: InterviewStatus.CANCELLED, reason }),
        },
      });

      return cancelled;
    });

    res.json({
      success: true,
      message: 'Interview has been cancelled.',
      data: updated,
    });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel interview.' });
  }
}

/**
 * Mark interview as COMPLETED.
 */
export async function completeInterview(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid interview ID.' });
      return;
    }

    const interview = await prisma.interview.findUnique({ where: { id } });
    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found.' });
      return;
    }

    // Authorization
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== interview.companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students cannot modify interview status.' });
      return;
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: { status: InterviewStatus.COMPLETED },
    });

    res.json({
      success: true,
      message: 'Interview marked as completed.',
      data: updated,
    });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ success: false, message: 'Failed to complete interview.' });
  }
}

/**
 * Record interview result & feedback (QUALIFIED, NOT_QUALIFIED, ON_HOLD, ABSENT).
 * Also supports advancing application lifecycle (e.g. SELECT or REJECT) with full status history.
 */
export async function recordInterviewResult(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid interview ID.' });
      return;
    }

    const validation = validateRecordInterviewResultInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid result submission.',
        errors: validation.errors,
      });
      return;
    }

    const { result, feedback, notes, action } = validation.value;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: true,
        student: { select: { fullName: true } },
      },
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found.' });
      return;
    }

    // Role check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== interview.companyId) {
        res.status(403).json({ success: false, message: 'Access denied: You can only record results for your company.' });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students are not authorized to record interview results.' });
      return;
    }

    const outcome = await prisma.$transaction(async (tx) => {
      // 1. Update Interview record
      const updatedInterview = await tx.interview.update({
        where: { id },
        data: {
          result,
          feedback: feedback ?? interview.feedback,
          notes: notes ?? interview.notes,
          status: InterviewStatus.COMPLETED,
        },
      });

      // 2. Check if recruiter/admin chose to advance or reject the candidate directly
      if (action === 'SELECT') {
        await tx.application.update({
          where: { id: interview.applicationId },
          data: {
            status: ApplicationStatus.SELECTED,
            statusRemarks: `Candidate selected following Round ${interview.roundNumber} (${interview.roundName}). Result: ${result}`,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: interview.applicationId,
            previousStatus: interview.application.status,
            newStatus: ApplicationStatus.SELECTED,
            changedById: req.user!.id,
            note: `Candidate selected for offer after Round ${interview.roundNumber} (${interview.roundName}). Evaluator feedback: ${
              feedback || 'Qualified'
            }`,
          },
        });
      } else if (action === 'REJECT' || result === InterviewResult.NOT_QUALIFIED) {
        // If explicitly requested to reject or marked NOT_QUALIFIED
        if (action === 'REJECT') {
          await tx.application.update({
            where: { id: interview.applicationId },
            data: {
              status: ApplicationStatus.REJECTED,
              statusRemarks: `Candidate not selected after Round ${interview.roundNumber} (${interview.roundName}).`,
            },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: interview.applicationId,
              previousStatus: interview.application.status,
              newStatus: ApplicationStatus.REJECTED,
              changedById: req.user!.id,
              note: `Application rejected following Round ${interview.roundNumber} (${interview.roundName}).`,
            },
          });
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'RECORD_INTERVIEW_RESULT',
          entity: 'Interview',
          entityId: String(id),
          oldValues: JSON.stringify({ result: interview.result }),
          newValues: JSON.stringify({ result, action, feedback }),
        },
      });

      return updatedInterview;
    });

    res.json({
      success: true,
      message: `Interview result successfully recorded as ${result}.`,
      data: outcome,
    });
  } catch (error) {
    console.error('Error recording interview result:', error);
    res.status(500).json({ success: false, message: 'Failed to record interview result.' });
  }
}

/**
 * Explicit candidate selection action on application after interview rounds.
 */
export async function selectCandidateForApplication(req: Request, res: Response): Promise<void> {
  try {
    const applicationId = parseInt(String(req.params.id), 10);
    if (isNaN(applicationId)) {
      res.status(400).json({ success: false, message: 'Invalid application ID.' });
      return;
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        internship: true,
        interviews: { orderBy: { roundNumber: 'desc' } },
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const oppCompanyId = application.job?.companyId || application.internship?.companyId;

    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== oppCompanyId) {
        res.status(403).json({ success: false, message: 'Access denied: You can only select candidates for your company.' });
        return;
      }
    } else if (req.user!.role === UserRole.STUDENT) {
      res.status(403).json({ success: false, message: 'Students cannot alter application selection status.' });
      return;
    }

    if (application.status === ApplicationStatus.SELECTED) {
      res.status(400).json({ success: false, message: 'Candidate is already in SELECTED status.' });
      return;
    }

    const remarks = req.body?.notes ? String(req.body.notes).trim() : 'Candidate selected through recruitment interview process.';

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.SELECTED,
          statusRemarks: remarks,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          previousStatus: application.status,
          newStatus: ApplicationStatus.SELECTED,
          changedById: req.user!.id,
          note: remarks,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'SELECT_CANDIDATE',
          entity: 'Application',
          entityId: String(applicationId),
          newValues: JSON.stringify({ status: ApplicationStatus.SELECTED, remarks }),
        },
      });

      return app;
    });

    res.json({
      success: true,
      message: 'Candidate has been selected successfully and is now eligible to receive an offer.',
      data: updated,
    });
  } catch (error) {
    console.error('Error selecting candidate:', error);
    res.status(500).json({ success: false, message: 'Failed to select candidate.' });
  }
}

// ==========================================
// 2. QUERYING INTERVIEWS
// ==========================================

/**
 * Student: View personal interviews.
 */
export async function getStudentInterviews(req: Request, res: Response): Promise<void> {
  try {
    const student = await getAuthenticatedStudent(req.user!.id);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status as InterviewStatus | undefined;
    const modeFilter = req.query.mode as InterviewMode | undefined;
    const resultFilter = req.query.result as InterviewResult | undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const where: Prisma.InterviewWhereInput = {
      studentId: student.id,
      ...(statusFilter && { status: statusFilter }),
      ...(modeFilter && { mode: modeFilter }),
      ...(resultFilter && { result: resultFilter }),
      ...(search && {
        OR: [
          { roundName: { contains: search } },
          { interviewerName: { contains: search } },
          { company: { name: { contains: search } } },
          { job: { title: { contains: search } } },
          { internship: { title: { contains: search } } },
        ],
      }),
    };

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { interviewDate: 'asc' },
        include: {
          company: { select: { id: true, name: true, logoUrl: true, headquarters: true } },
          job: { select: { id: true, title: true, location: true, employmentType: true } },
          internship: { select: { id: true, title: true, location: true, duration: true } },
          round: { select: { id: true, roundNumber: true, name: true, type: true, isEliminative: true } },
          application: { select: { id: true, status: true } },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching student interviews:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve interviews.' });
  }
}

/**
 * Recruiter: View company's scheduled & past interviews.
 */
export async function getRecruiterInterviews(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiter(req.user!.id);
    if (!recruiter) {
      res.status(403).json({ success: false, message: 'Recruiter profile not found.' });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status as InterviewStatus | undefined;
    const modeFilter = req.query.mode as InterviewMode | undefined;
    const resultFilter = req.query.result as InterviewResult | undefined;
    const jobId = req.query.jobId ? parseInt(String(req.query.jobId), 10) : undefined;
    const internshipId = req.query.internshipId ? parseInt(String(req.query.internshipId), 10) : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const where: Prisma.InterviewWhereInput = {
      companyId: recruiter.companyId,
      ...(statusFilter && { status: statusFilter }),
      ...(modeFilter && { mode: modeFilter }),
      ...(resultFilter && { result: resultFilter }),
      ...(jobId && { jobId }),
      ...(internshipId && { internshipId }),
      ...(search && {
        OR: [
          { student: { fullName: { contains: search } } },
          { student: { studentId: { contains: search } } },
          { student: { user: { email: { contains: search } } } },
          { roundName: { contains: search } },
          { interviewerName: { contains: search } },
          { job: { title: { contains: search } } },
          { internship: { title: { contains: search } } },
        ],
      }),
    };

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { interviewDate: 'asc' },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              course: true,
              program: true,
              semester: true,
              cgpa: true,
              department: { select: { code: true, name: true } },
              user: { select: { email: true } },
            },
          },
          job: { select: { id: true, title: true } },
          internship: { select: { id: true, title: true } },
          round: { select: { id: true, roundNumber: true, name: true, type: true, isEliminative: true } },
          application: { select: { id: true, status: true, appliedAt: true } },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching recruiter interviews:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve interviews.' });
  }
}

/**
 * Placement Admin & Super Admin: View institutional interviews with global search/filter.
 */
export async function getAdminInterviews(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const companyId = req.query.companyId ? parseInt(String(req.query.companyId), 10) : undefined;
    const statusFilter = req.query.status as InterviewStatus | undefined;
    const modeFilter = req.query.mode as InterviewMode | undefined;
    const resultFilter = req.query.result as InterviewResult | undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const where: Prisma.InterviewWhereInput = {
      ...(companyId && { companyId }),
      ...(statusFilter && { status: statusFilter }),
      ...(modeFilter && { mode: modeFilter }),
      ...(resultFilter && { result: resultFilter }),
      ...(search && {
        OR: [
          { student: { fullName: { contains: search } } },
          { student: { studentId: { contains: search } } },
          { company: { name: { contains: search } } },
          { roundName: { contains: search } },
          { interviewerName: { contains: search } },
          { job: { title: { contains: search } } },
          { internship: { title: { contains: search } } },
        ],
      }),
    };

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { interviewDate: 'asc' },
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
          round: { select: { id: true, roundNumber: true, name: true, type: true } },
          application: { select: { id: true, status: true } },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin interviews:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve institutional interviews.' });
  }
}

/**
 * Get individual interview details with full application timeline.
 */
export async function getInterviewById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid interview ID.' });
      return;
    }

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, contactEmail: true, headquarters: true } },
        job: { select: { id: true, title: true, location: true, workMode: true, salaryMin: true, salaryMax: true } },
        internship: { select: { id: true, title: true, location: true, workMode: true, stipendAmount: true, duration: true } },
        student: {
          include: {
            department: { select: { id: true, name: true, code: true } },
            user: { select: { id: true, email: true } },
            skills: { include: { skill: true } },
          },
        },
        round: true,
        application: {
          include: {
            statusHistory: {
              orderBy: { createdAt: 'desc' },
              include: { changedBy: { select: { id: true, email: true, role: true } } },
            },
            interviews: {
              orderBy: { roundNumber: 'asc' },
              include: { round: true },
            },
          },
        },
      },
    });

    if (!interview) {
      res.status(404).json({ success: false, message: 'Interview not found.' });
      return;
    }

    // Role-based boundary check (IDOR protection)
    if (req.user!.role === UserRole.STUDENT) {
      const student = await getAuthenticatedStudent(req.user!.id);
      if (!student || interview.studentId !== student.id) {
        res.status(404).json({ success: false, message: 'Interview not found.' });
        return;
      }
    } else if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter || recruiter.companyId !== interview.companyId) {
        res.status(404).json({ success: false, message: 'Interview not found.' });
        return;
      }
    }

    res.json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error('Error fetching interview by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve interview details.' });
  }
}

// ==========================================
// 3. INTERVIEW ROUND MANAGEMENT
// ==========================================

/**
 * Create a new recruitment round for an opportunity.
 */
export async function createInterviewRound(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreateInterviewRoundInput(req.body);
    if (validation.errors.length > 0 || !validation.value) {
      res.status(400).json({
        success: false,
        message: 'Invalid round configuration.',
        errors: validation.errors,
      });
      return;
    }

    const { jobId, internshipId, roundNumber, name, type, description, isEliminative } = validation.value;

    // Check opportunity ownership if recruiter
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      if (!recruiter) {
        res.status(403).json({ success: false, message: 'Recruiter profile not found.' });
        return;
      }

      if (jobId) {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.companyId !== recruiter.companyId) {
          res.status(403).json({ success: false, message: 'You can only configure rounds for your company’s jobs.' });
          return;
        }
      }

      if (internshipId) {
        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        if (!internship || internship.companyId !== recruiter.companyId) {
          res.status(403).json({ success: false, message: 'You can only configure rounds for your company’s internships.' });
          return;
        }
      }
    }

    const round = await prisma.interviewRound.create({
      data: {
        jobId: jobId || null,
        internshipId: internshipId || null,
        roundNumber,
        name,
        type,
        description,
        isEliminative,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Interview round created successfully.',
      data: round,
    });
  } catch (error) {
    console.error('Error creating interview round:', error);
    res.status(500).json({ success: false, message: 'Failed to create interview round.' });
  }
}

/**
 * Get interview rounds defined for an opportunity.
 */
export async function getOpportunityInterviewRounds(req: Request, res: Response): Promise<void> {
  try {
    const type = String(req.params.type).toUpperCase();
    const id = parseInt(String(req.params.id), 10);

    if (isNaN(id) || !['JOB', 'INTERNSHIP'].includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid opportunity type or ID.' });
      return;
    }

    const rounds = await prisma.interviewRound.findMany({
      where: {
        ...(type === 'JOB' ? { jobId: id } : { internshipId: id }),
      },
      orderBy: { roundNumber: 'asc' },
      include: {
        _count: { select: { interviews: true } },
      },
    });

    res.json({
      success: true,
      data: rounds,
    });
  } catch (error) {
    console.error('Error fetching opportunity rounds:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve interview rounds.' });
  }
}

/**
 * Update an interview round.
 */
export async function updateInterviewRound(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid round ID.' });
      return;
    }

    const existingRound = await prisma.interviewRound.findUnique({
      where: { id },
      include: { job: true, internship: true },
    });

    if (!existingRound) {
      res.status(404).json({ success: false, message: 'Interview round not found.' });
      return;
    }

    // Role check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      const companyId = existingRound.job?.companyId || existingRound.internship?.companyId;
      if (!recruiter || recruiter.companyId !== companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }
    }

    const { name, type, description, isEliminative, roundNumber } = req.body;

    const updated = await prisma.interviewRound.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(type && { type }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(isEliminative !== undefined && { isEliminative: Boolean(isEliminative) }),
        ...(roundNumber !== undefined && { roundNumber: Number(roundNumber) }),
      },
    });

    res.json({
      success: true,
      message: 'Interview round updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating interview round:', error);
    res.status(500).json({ success: false, message: 'Failed to update interview round.' });
  }
}

/**
 * Delete an interview round (only if no scheduled interviews reference it).
 */
export async function deleteInterviewRound(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid round ID.' });
      return;
    }

    const existingRound = await prisma.interviewRound.findUnique({
      where: { id },
      include: {
        job: true,
        internship: true,
        _count: { select: { interviews: true } },
      },
    });

    if (!existingRound) {
      res.status(404).json({ success: false, message: 'Interview round not found.' });
      return;
    }

    // Check if interviews exist
    if (existingRound._count.interviews > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete round because candidate interviews are already scheduled or recorded under it.',
      });
      return;
    }

    // Role check
    if (req.user!.role === UserRole.RECRUITER) {
      const recruiter = await getAuthenticatedRecruiter(req.user!.id);
      const companyId = existingRound.job?.companyId || existingRound.internship?.companyId;
      if (!recruiter || recruiter.companyId !== companyId) {
        res.status(403).json({ success: false, message: 'Access denied.' });
        return;
      }
    }

    await prisma.interviewRound.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Interview round deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting interview round:', error);
    res.status(500).json({ success: false, message: 'Failed to delete interview round.' });
  }
}
