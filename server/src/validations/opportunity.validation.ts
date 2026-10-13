import {
  OpportunityStatus,
  EmploymentType,
  WorkMode,
  StipendPeriod,
  UserRole,
} from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateJobInput(data: any, isUpdate = false): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Job title must be at least 3 characters long.' });
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
      errors.push({ field: 'description', message: 'Job description must be at least 10 characters.' });
    }
  }

  if (!isUpdate || data.responsibilities !== undefined) {
    if (!data.responsibilities || typeof data.responsibilities !== 'string' || data.responsibilities.trim().length < 10) {
      errors.push({ field: 'responsibilities', message: 'Key responsibilities must be at least 10 characters.' });
    }
  }

  if (!isUpdate || data.requirements !== undefined) {
    if (!data.requirements || typeof data.requirements !== 'string' || data.requirements.trim().length < 10) {
      errors.push({ field: 'requirements', message: 'Job requirements must be at least 10 characters.' });
    }
  }

  if (!isUpdate || data.requiredSkills !== undefined) {
    if (!data.requiredSkills || typeof data.requiredSkills !== 'string' || data.requiredSkills.trim().length < 2) {
      errors.push({ field: 'requiredSkills', message: 'Please specify required skills.' });
    }
  }

  if (!isUpdate || data.location !== undefined) {
    if (!data.location || typeof data.location !== 'string' || data.location.trim().length < 2) {
      errors.push({ field: 'location', message: 'Location is required.' });
    }
  }

  if (!isUpdate || data.workMode !== undefined) {
    if (data.workMode && !Object.values(WorkMode).includes(data.workMode)) {
      errors.push({ field: 'workMode', message: `Invalid work mode. Valid: ${Object.values(WorkMode).join(', ')}` });
    }
  }

  if (!isUpdate || data.employmentType !== undefined) {
    if (data.employmentType && !Object.values(EmploymentType).includes(data.employmentType)) {
      errors.push({
        field: 'employmentType',
        message: `Invalid employment type. Valid: ${Object.values(EmploymentType).join(', ')}`,
      });
    }
  }

  if (!isUpdate || data.salaryMin !== undefined || data.salaryMax !== undefined) {
    const min = data.salaryMin !== undefined ? Number(data.salaryMin) : undefined;
    const max = data.salaryMax !== undefined ? Number(data.salaryMax) : undefined;

    if (min !== undefined && (isNaN(min) || min < 0)) {
      errors.push({ field: 'salaryMin', message: 'Minimum salary/CTC must be 0 or greater.' });
    }
    if (max !== undefined && (isNaN(max) || max < 0)) {
      errors.push({ field: 'salaryMax', message: 'Maximum salary/CTC must be 0 or greater.' });
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push({ field: 'salaryMax', message: 'Maximum salary cannot be less than minimum salary.' });
    }
  }

  if (!isUpdate || data.vacancies !== undefined) {
    const vac = Number(data.vacancies);
    if (isNaN(vac) || vac < 1) {
      errors.push({ field: 'vacancies', message: 'Vacancies count must be at least 1.' });
    }
  }

  if (!isUpdate || data.applicationDeadline !== undefined) {
    if (!data.applicationDeadline) {
      errors.push({ field: 'applicationDeadline', message: 'Application deadline is required.' });
    } else {
      const deadlineDate = new Date(data.applicationDeadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.push({ field: 'applicationDeadline', message: 'Invalid deadline date format.' });
      }
    }
  }

  return errors;
}

export function validateInternshipInput(data: any, isUpdate = false): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Internship title must be at least 3 characters long.' });
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
      errors.push({ field: 'description', message: 'Internship description must be at least 10 characters.' });
    }
  }

  if (!isUpdate || data.responsibilities !== undefined) {
    if (!data.responsibilities || typeof data.responsibilities !== 'string' || data.responsibilities.trim().length < 10) {
      errors.push({ field: 'responsibilities', message: 'Responsibilities must be at least 10 characters.' });
    }
  }

  if (!isUpdate || data.duration !== undefined) {
    if (!data.duration || typeof data.duration !== 'string' || data.duration.trim().length < 2) {
      errors.push({ field: 'duration', message: 'Duration is required (e.g. 3 Months, 6 Months).' });
    }
  }

  if (!isUpdate || data.stipendAmount !== undefined) {
    const stipend = Number(data.stipendAmount);
    if (isNaN(stipend) || stipend < 0) {
      errors.push({ field: 'stipendAmount', message: 'Stipend amount must be 0 or greater.' });
    }
  }

  if (!isUpdate || data.stipendPeriod !== undefined) {
    if (data.stipendPeriod && !Object.values(StipendPeriod).includes(data.stipendPeriod)) {
      errors.push({
        field: 'stipendPeriod',
        message: `Invalid stipend period. Valid: ${Object.values(StipendPeriod).join(', ')}`,
      });
    }
  }

  if (!isUpdate || data.location !== undefined) {
    if (!data.location || typeof data.location !== 'string' || data.location.trim().length < 2) {
      errors.push({ field: 'location', message: 'Location is required.' });
    }
  }

  if (!isUpdate || data.workMode !== undefined) {
    if (data.workMode && !Object.values(WorkMode).includes(data.workMode)) {
      errors.push({ field: 'workMode', message: `Invalid work mode. Valid: ${Object.values(WorkMode).join(', ')}` });
    }
  }

  if (!isUpdate || data.vacancies !== undefined) {
    const vac = Number(data.vacancies);
    if (isNaN(vac) || vac < 1) {
      errors.push({ field: 'vacancies', message: 'Vacancies count must be at least 1.' });
    }
  }

  if (!isUpdate || data.applicationDeadline !== undefined) {
    if (!data.applicationDeadline) {
      errors.push({ field: 'applicationDeadline', message: 'Application deadline is required.' });
    } else {
      const deadlineDate = new Date(data.applicationDeadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.push({ field: 'applicationDeadline', message: 'Invalid deadline date format.' });
      }
    }
  }

  return errors;
}

export function validateEligibilityInput(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.minCgpa !== undefined && data.minCgpa !== null && data.minCgpa !== '') {
    const cgpa = Number(data.minCgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      errors.push({ field: 'minCgpa', message: 'Minimum CGPA must be between 0.0 and 10.0.' });
    }
  }

  if (data.minPercentage !== undefined && data.minPercentage !== null && data.minPercentage !== '') {
    const pct = Number(data.minPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.push({ field: 'minPercentage', message: 'Minimum percentage must be between 0.0% and 100.0%.' });
    }
  }

  if (data.maxBacklogs !== undefined && data.maxBacklogs !== null && data.maxBacklogs !== '') {
    const backlogs = Number(data.maxBacklogs);
    if (isNaN(backlogs) || backlogs < 0 || !Number.isInteger(backlogs)) {
      errors.push({ field: 'maxBacklogs', message: 'Maximum backlogs must be a non-negative integer.' });
    }
  }

  return errors;
}

/**
 * Validates role-based opportunity lifecycle status transitions
 */
export function validateStatusTransition(
  currentStatus: OpportunityStatus,
  targetStatus: OpportunityStatus,
  userRole: UserRole
): { isValid: boolean; message?: string } {
  if (currentStatus === targetStatus) {
    return { isValid: true };
  }

  // Placement Admin / Super Admin can make all institutional lifecycle decisions
  if (userRole === UserRole.PLACEMENT_ADMIN || userRole === UserRole.SUPER_ADMIN) {
    return { isValid: true };
  }

  // Recruiter permissions
  if (userRole === UserRole.RECRUITER) {
    if (targetStatus === OpportunityStatus.PUBLISHED) {
      return {
        isValid: false,
        message: 'Recruiters cannot self-publish opportunities. Please submit for Placement Admin approval.',
      };
    }

    if (currentStatus === OpportunityStatus.DRAFT && targetStatus === OpportunityStatus.PENDING_APPROVAL) {
      return { isValid: true };
    }

    if (currentStatus === OpportunityStatus.PENDING_APPROVAL && targetStatus === OpportunityStatus.DRAFT) {
      return { isValid: true };
    }

    if (currentStatus === OpportunityStatus.PUBLISHED && targetStatus === OpportunityStatus.CLOSED) {
      return { isValid: true };
    }

    if (currentStatus === OpportunityStatus.DRAFT && targetStatus === OpportunityStatus.CANCELLED) {
      return { isValid: true };
    }

    return {
      isValid: false,
      message: `Invalid status transition from ${currentStatus} to ${targetStatus} for Recruiter role.`,
    };
  }

  return {
    isValid: false,
    message: 'User role not authorized to alter opportunity status.',
  };
}
