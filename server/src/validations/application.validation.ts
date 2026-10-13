import { OpportunityType, ApplicationStatus } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApplyToOpportunityInput {
  opportunityType: OpportunityType;
  opportunityId: number;
  coverLetter?: string | null;
  resumeDocumentId?: number | null;
}

export function validateApplyInput(data: any): { errors: ValidationError[]; value?: ApplyToOpportunityInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  // opportunityType
  if (!data.opportunityType || !Object.values(OpportunityType).includes(data.opportunityType)) {
    errors.push({ field: 'opportunityType', message: 'Opportunity type must be either JOB or INTERNSHIP.' });
  }

  // opportunityId
  const oppId = Number(data.opportunityId);
  if (!data.opportunityId || isNaN(oppId) || !Number.isInteger(oppId) || oppId <= 0) {
    errors.push({ field: 'opportunityId', message: 'Opportunity ID must be a valid positive integer.' });
  }

  // coverLetter
  if (data.coverLetter !== undefined && data.coverLetter !== null) {
    if (typeof data.coverLetter !== 'string') {
      errors.push({ field: 'coverLetter', message: 'Cover letter must be a string.' });
    } else if (data.coverLetter.length > 3000) {
      errors.push({ field: 'coverLetter', message: 'Cover letter cannot exceed 3000 characters.' });
    }
  }

  // resumeDocumentId
  let resumeDocId: number | null = null;
  if (data.resumeDocumentId !== undefined && data.resumeDocumentId !== null) {
    const docId = Number(data.resumeDocumentId);
    if (isNaN(docId) || !Number.isInteger(docId) || docId <= 0) {
      errors.push({ field: 'resumeDocumentId', message: 'Resume document ID must be a positive integer.' });
    } else {
      resumeDocId = docId;
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      opportunityType: data.opportunityType as OpportunityType,
      opportunityId: oppId,
      coverLetter: data.coverLetter ? String(data.coverLetter).trim() : null,
      resumeDocumentId: resumeDocId,
    },
  };
}

export function validateStatusUpdateInput(data: any): { errors: ValidationError[]; value?: { status: ApplicationStatus; note?: string } } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  if (!data.status || !Object.values(ApplicationStatus).includes(data.status)) {
    errors.push({ field: 'status', message: 'A valid application status is required.' });
  }

  if (data.note !== undefined && data.note !== null) {
    if (typeof data.note !== 'string') {
      errors.push({ field: 'note', message: 'Note must be a string.' });
    } else if (data.note.length > 1000) {
      errors.push({ field: 'note', message: 'Note cannot exceed 1000 characters.' });
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      status: data.status as ApplicationStatus,
      note: data.note ? String(data.note).trim() : undefined,
    },
  };
}

export function validateNoteInput(data: any): { errors: ValidationError[]; note?: string } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  if (!data.note || typeof data.note !== 'string' || data.note.trim().length === 0) {
    errors.push({ field: 'note', message: 'Note content cannot be empty.' });
  } else if (data.note.length > 1000) {
    errors.push({ field: 'note', message: 'Note cannot exceed 1000 characters.' });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { errors: [], note: String(data.note).trim() };
}

/**
 * Validates allowed status transitions based on user role and current status.
 */
export function validateStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  role: string
): { isValid: boolean; message?: string } {
  // If no change
  if (currentStatus === newStatus) {
    return { isValid: true };
  }

  // Super Admin can override
  if (role === 'SUPER_ADMIN') {
    return { isValid: true };
  }

  // Student can only transition to WITHDRAWN from APPLIED or UNDER_REVIEW
  if (role === 'STUDENT') {
    if (newStatus === ApplicationStatus.WITHDRAWN) {
      if (
        currentStatus === ApplicationStatus.APPLIED ||
        currentStatus === ApplicationStatus.UNDER_REVIEW
      ) {
        return { isValid: true };
      }
      return {
        isValid: false,
        message: `Cannot withdraw application once it has progressed to ${currentStatus}.`,
      };
    }
    return {
      isValid: false,
      message: 'Students are only permitted to withdraw their pending applications.',
    };
  }

  // Recruiters review workflow
  if (role === 'RECRUITER') {
    // Cannot modify terminal or withdrawn applications
    if (
      currentStatus === ApplicationStatus.WITHDRAWN ||
      currentStatus === ApplicationStatus.REJECTED ||
      currentStatus === ApplicationStatus.HIRED_PLACED
    ) {
      return {
        isValid: false,
        message: `Application is already in terminal state: ${currentStatus}.`,
      };
    }

    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.APPLIED]: [
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.UNDER_REVIEW]: [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.SHORTLISTED]: [
        ApplicationStatus.REJECTED,
        ApplicationStatus.INTERVIEW_SCHEDULED,
      ],
      [ApplicationStatus.INTERVIEW_SCHEDULED]: [
        ApplicationStatus.SELECTED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.SELECTED]: [
        ApplicationStatus.OFFER_RECEIVED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.OFFER_RECEIVED]: [
        ApplicationStatus.OFFER_ACCEPTED,
        ApplicationStatus.OFFER_REJECTED,
      ],
      [ApplicationStatus.OFFER_ACCEPTED]: [
        ApplicationStatus.HIRED_PLACED,
      ],
      [ApplicationStatus.OFFER_REJECTED]: [],
      [ApplicationStatus.REJECTED]: [],
      [ApplicationStatus.WITHDRAWN]: [],
      [ApplicationStatus.HIRED_PLACED]: [],
    };

    const targets = allowedTransitions[currentStatus] || [];
    if (!targets.includes(newStatus)) {
      return {
        isValid: false,
        message: `Invalid recruiter status transition from ${currentStatus} to ${newStatus}.`,
      };
    }

    return { isValid: true };
  }

  // Placement Admin institutional workflow
  if (role === 'PLACEMENT_ADMIN') {
    if (currentStatus === ApplicationStatus.WITHDRAWN) {
      return {
        isValid: false,
        message: 'Cannot modify a student-withdrawn application.',
      };
    }
    return { isValid: true };
  }

  return { isValid: false, message: 'Unauthorized role for status transition.' };
}
