import { InterviewMode, InterviewResult, InterviewRoundType } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ScheduleInterviewInput {
  applicationId: number;
  roundId?: number | null;
  roundNumber?: number;
  roundName: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode: InterviewMode;
  location?: string | null;
  meetingLink?: string | null;
  interviewerName?: string | null;
  notes?: string | null;
}

function parseDateTime(timeVal: any, dateVal?: any): Date | null {
  if (!timeVal) return null;
  if (timeVal instanceof Date) return isNaN(timeVal.getTime()) ? null : timeVal;
  if (typeof timeVal !== 'string') return null;

  // Try direct parse first (ISO 8601 strings, e.g. 2026-10-01T10:00:00.000Z or 2026-10-01T10:00)
  const direct = new Date(timeVal);
  if (!isNaN(direct.getTime()) && timeVal.includes('T')) {
    return direct;
  }

  // If dateVal is provided, try combining with "HH:mm" or "HH:mm:ss"
  if (dateVal) {
    const baseDate = typeof dateVal === 'string' ? dateVal.split('T')[0] : (dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : '');
    const timeMatch = timeVal.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch && baseDate) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      const seconds = timeMatch[3] || '00';
      const combined = new Date(`${baseDate}T${hours}:${minutes}:${seconds}`);
      if (!isNaN(combined.getTime())) {
        return combined;
      }
    }
  }

  if (!isNaN(direct.getTime())) {
    return direct;
  }

  return null;
}

export function validateScheduleInterviewInput(data: any): { errors: ValidationError[]; value?: ScheduleInterviewInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  // applicationId
  const appId = Number(data.applicationId);
  if (!data.applicationId || isNaN(appId) || !Number.isInteger(appId) || appId <= 0) {
    errors.push({ field: 'applicationId', message: 'A valid application ID is required.' });
  }

  // roundId
  let roundId: number | null = null;
  if (data.roundId !== undefined && data.roundId !== null && data.roundId !== '') {
    const rId = Number(data.roundId);
    if (isNaN(rId) || !Number.isInteger(rId) || rId <= 0) {
      errors.push({ field: 'roundId', message: 'Round ID must be a positive integer.' });
    } else {
      roundId = rId;
    }
  }

  // roundNumber
  let roundNumber: number | undefined;
  if (data.roundNumber !== undefined && data.roundNumber !== null && data.roundNumber !== '') {
    const rNum = Number(data.roundNumber);
    if (isNaN(rNum) || !Number.isInteger(rNum) || rNum <= 0) {
      errors.push({ field: 'roundNumber', message: 'Round number must be a positive integer.' });
    } else {
      roundNumber = rNum;
    }
  }

  // roundName
  if (!data.roundName || typeof data.roundName !== 'string' || data.roundName.trim().length === 0) {
    errors.push({ field: 'roundName', message: 'Round name is required (e.g. Technical Round 1).' });
  } else if (data.roundName.trim().length > 150) {
    errors.push({ field: 'roundName', message: 'Round name cannot exceed 150 characters.' });
  }

  // interviewDate
  if (!data.interviewDate) {
    errors.push({ field: 'interviewDate', message: 'Interview date is required.' });
  } else {
    const d = new Date(data.interviewDate);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'interviewDate', message: 'Invalid interview date format.' });
    }
  }

  // startTime & endTime
  let sTime: Date | null = null;
  let eTime: Date | null = null;

  if (!data.startTime) {
    errors.push({ field: 'startTime', message: 'Start time is required.' });
  } else {
    sTime = parseDateTime(data.startTime, data.interviewDate);
    if (!sTime) {
      errors.push({ field: 'startTime', message: 'Invalid start time format.' });
    }
  }

  if (!data.endTime) {
    errors.push({ field: 'endTime', message: 'End time is required.' });
  } else {
    eTime = parseDateTime(data.endTime, data.interviewDate);
    if (!eTime) {
      errors.push({ field: 'endTime', message: 'Invalid end time format.' });
    }
  }

  if (sTime && eTime && eTime <= sTime) {
    errors.push({ field: 'endTime', message: 'End time must be after start time.' });
  }

  // mode
  if (!data.mode || !Object.values(InterviewMode).includes(data.mode)) {
    errors.push({ field: 'mode', message: `Interview mode must be one of: ${Object.values(InterviewMode).join(', ')}.` });
  } else {
    if (data.mode === InterviewMode.ONLINE) {
      if (!data.meetingLink || typeof data.meetingLink !== 'string' || data.meetingLink.trim().length === 0) {
        errors.push({ field: 'meetingLink', message: 'Meeting link is required for ONLINE interviews.' });
      } else if (data.meetingLink.trim().length > 500) {
        errors.push({ field: 'meetingLink', message: 'Meeting link cannot exceed 500 characters.' });
      }
    } else if (data.mode === InterviewMode.IN_PERSON) {
      if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
        errors.push({ field: 'location', message: 'Interview location/room is required for IN_PERSON interviews.' });
      } else if (data.location.trim().length > 250) {
        errors.push({ field: 'location', message: 'Location cannot exceed 250 characters.' });
      }
    }
  }

  // interviewerName
  if (data.interviewerName !== undefined && data.interviewerName !== null) {
    if (typeof data.interviewerName !== 'string') {
      errors.push({ field: 'interviewerName', message: 'Interviewer name must be a string.' });
    } else if (data.interviewerName.trim().length > 150) {
      errors.push({ field: 'interviewerName', message: 'Interviewer name cannot exceed 150 characters.' });
    }
  }

  // notes
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      errors.push({ field: 'notes', message: 'Notes must be a string.' });
    } else if (data.notes.trim().length > 2000) {
      errors.push({ field: 'notes', message: 'Notes cannot exceed 2000 characters.' });
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      applicationId: appId,
      roundId,
      roundNumber,
      roundName: String(data.roundName).trim(),
      interviewDate: data.interviewDate,
      startTime: sTime ? sTime.toISOString() : data.startTime,
      endTime: eTime ? eTime.toISOString() : data.endTime,
      mode: data.mode as InterviewMode,
      location: data.location ? String(data.location).trim() : null,
      meetingLink: data.meetingLink ? String(data.meetingLink).trim() : null,
      interviewerName: data.interviewerName ? String(data.interviewerName).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
    },
  };
}

export interface RescheduleInterviewInput {
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode?: InterviewMode;
  location?: string | null;
  meetingLink?: string | null;
  notes?: string | null;
}

export function validateRescheduleInterviewInput(data: any): { errors: ValidationError[]; value?: RescheduleInterviewInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  // interviewDate
  if (!data.interviewDate) {
    errors.push({ field: 'interviewDate', message: 'Rescheduled interview date is required.' });
  } else {
    const d = new Date(data.interviewDate);
    if (isNaN(d.getTime())) {
      errors.push({ field: 'interviewDate', message: 'Invalid interview date format.' });
    }
  }

  // startTime & endTime
  let sTime: Date | null = null;
  let eTime: Date | null = null;

  if (!data.startTime) {
    errors.push({ field: 'startTime', message: 'Start time is required.' });
  } else {
    sTime = parseDateTime(data.startTime, data.interviewDate);
    if (!sTime) {
      errors.push({ field: 'startTime', message: 'Invalid start time format.' });
    }
  }

  if (!data.endTime) {
    errors.push({ field: 'endTime', message: 'End time is required.' });
  } else {
    eTime = parseDateTime(data.endTime, data.interviewDate);
    if (!eTime) {
      errors.push({ field: 'endTime', message: 'Invalid end time format.' });
    }
  }

  if (sTime && eTime && eTime <= sTime) {
    errors.push({ field: 'endTime', message: 'End time must be after start time.' });
  }

  // mode
  if (data.mode && !Object.values(InterviewMode).includes(data.mode)) {
    errors.push({ field: 'mode', message: `Invalid interview mode: ${data.mode}.` });
  }

  if (data.mode === InterviewMode.ONLINE && (!data.meetingLink || data.meetingLink.trim().length === 0)) {
    errors.push({ field: 'meetingLink', message: 'Meeting link is required for ONLINE interviews.' });
  }

  if (data.mode === InterviewMode.IN_PERSON && (!data.location || data.location.trim().length === 0)) {
    errors.push({ field: 'location', message: 'Location is required for IN_PERSON interviews.' });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      interviewDate: data.interviewDate,
      startTime: sTime ? sTime.toISOString() : data.startTime,
      endTime: eTime ? eTime.toISOString() : data.endTime,
      mode: data.mode as InterviewMode | undefined,
      location: data.location ? String(data.location).trim() : null,
      meetingLink: data.meetingLink ? String(data.meetingLink).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
    },
  };
}

export interface RecordInterviewResultInput {
  result: InterviewResult;
  feedback?: string | null;
  notes?: string | null;
  action?: 'NONE' | 'SELECT' | 'REJECT';
}

export function validateRecordInterviewResultInput(data: any): { errors: ValidationError[]; value?: RecordInterviewResultInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  if (!data.result || !Object.values(InterviewResult).includes(data.result)) {
    errors.push({ field: 'result', message: `Result must be one of: ${Object.values(InterviewResult).join(', ')}.` });
  }

  if (data.action && !['NONE', 'SELECT', 'REJECT'].includes(data.action)) {
    errors.push({ field: 'action', message: 'Action must be one of: NONE, SELECT, REJECT.' });
  }

  if (data.feedback !== undefined && data.feedback !== null) {
    if (typeof data.feedback !== 'string') {
      errors.push({ field: 'feedback', message: 'Feedback must be a string.' });
    } else if (data.feedback.trim().length > 3000) {
      errors.push({ field: 'feedback', message: 'Feedback cannot exceed 3000 characters.' });
    }
  }

  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      errors.push({ field: 'notes', message: 'Notes must be a string.' });
    } else if (data.notes.trim().length > 2000) {
      errors.push({ field: 'notes', message: 'Notes cannot exceed 2000 characters.' });
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      result: data.result as InterviewResult,
      feedback: data.feedback ? String(data.feedback).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
      action: data.action || 'NONE',
    },
  };
}

export interface CreateInterviewRoundInput {
  jobId?: number | null;
  internshipId?: number | null;
  roundNumber?: number;
  name: string;
  type: InterviewRoundType;
  description?: string | null;
  isEliminative?: boolean;
}

export function validateCreateInterviewRoundInput(data: any): { errors: ValidationError[]; value?: CreateInterviewRoundInput } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { errors: [{ field: 'body', message: 'Request body must be an object.' }] };
  }

  const jId = data.jobId ? Number(data.jobId) : null;
  const iId = data.internshipId ? Number(data.internshipId) : null;

  if (!jId && !iId) {
    errors.push({ field: 'opportunity', message: 'Either jobId or internshipId must be provided.' });
  }

  if (jId && (isNaN(jId) || !Number.isInteger(jId) || jId <= 0)) {
    errors.push({ field: 'jobId', message: 'Job ID must be a positive integer.' });
  }

  if (iId && (isNaN(iId) || !Number.isInteger(iId) || iId <= 0)) {
    errors.push({ field: 'internshipId', message: 'Internship ID must be a positive integer.' });
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Round name is required.' });
  } else if (data.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Round name cannot exceed 100 characters.' });
  }

  if (!data.type || !Object.values(InterviewRoundType).includes(data.type)) {
    errors.push({ field: 'type', message: `Round type must be one of: ${Object.values(InterviewRoundType).join(', ')}.` });
  }

  let roundNum = 1;
  if (data.roundNumber !== undefined && data.roundNumber !== null) {
    const rn = Number(data.roundNumber);
    if (isNaN(rn) || !Number.isInteger(rn) || rn <= 0) {
      errors.push({ field: 'roundNumber', message: 'Round number must be a positive integer.' });
    } else {
      roundNum = rn;
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    value: {
      jobId: jId,
      internshipId: iId,
      roundNumber: roundNum,
      name: String(data.name).trim(),
      type: data.type as InterviewRoundType,
      description: data.description ? String(data.description).trim() : null,
      isEliminative: data.isEliminative !== undefined ? Boolean(data.isEliminative) : true,
    },
  };
}
