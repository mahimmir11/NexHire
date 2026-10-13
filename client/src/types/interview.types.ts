export type InterviewMode = 'ONLINE' | 'IN_PERSON' | 'TELEPHONIC';

export type InterviewResult = 'PENDING' | 'QUALIFIED' | 'NOT_QUALIFIED' | 'ON_HOLD' | 'ABSENT';

export type InterviewStatus = 'SCHEDULED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type InterviewRoundType =
  | 'ONLINE_ASSESSMENT'
  | 'TECHNICAL'
  | 'MANAGERIAL'
  | 'HR'
  | 'GROUP_DISCUSSION'
  | 'OTHER';

export interface InterviewRound {
  id: number;
  jobId: number | null;
  internshipId: number | null;
  roundNumber: number;
  name: string;
  type: InterviewRoundType;
  description: string | null;
  isEliminative: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    interviews: number;
  };
}

export interface InterviewStudentSummary {
  id: number;
  fullName: string;
  studentId: string;
  course: string;
  program?: string;
  semester?: number;
  cgpa?: number | null;
  department: {
    code: string;
    name: string;
  };
  user: {
    email: string;
    phone?: string | null;
  };
  skills?: Array<{
    id: number;
    skill: {
      name: string;
      category: string;
    };
  }>;
}

export interface InterviewCompanySummary {
  id: number;
  name: string;
  logoUrl: string | null;
  headquarters?: string | null;
  website?: string | null;
  contactEmail?: string;
}

export interface InterviewOpportunitySummary {
  id: number;
  title: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  duration?: string;
  salaryMin?: number;
  salaryMax?: number;
  stipendAmount?: number;
}

export interface Interview {
  id: number;
  applicationId: number;
  roundId: number | null;
  studentId: number;
  companyId: number;
  jobId: number | null;
  internshipId: number | null;
  recruiterId: number | null;
  roundNumber: number;
  roundName: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode: InterviewMode;
  location: string | null;
  meetingLink: string | null;
  interviewerName: string | null;
  notes: string | null;
  feedback: string | null;
  result: InterviewResult;
  status: InterviewStatus;
  createdAt: string;
  updatedAt: string;
  student?: InterviewStudentSummary;
  company?: InterviewCompanySummary;
  job?: InterviewOpportunitySummary | null;
  internship?: InterviewOpportunitySummary | null;
  round?: InterviewRound | null;
  application?: {
    id: number;
    status: string;
    appliedAt: string;
    statusHistory?: any[];
    interviews?: Interview[];
  };
}

export interface InterviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InterviewListResponse {
  interviews: Interview[];
  pagination: InterviewPagination;
}

export interface ScheduleInterviewPayload {
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

export interface RescheduleInterviewPayload {
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode?: InterviewMode;
  location?: string | null;
  meetingLink?: string | null;
  notes?: string | null;
}

export interface RecordInterviewResultPayload {
  result: InterviewResult;
  feedback?: string | null;
  notes?: string | null;
  action?: 'NONE' | 'SELECT' | 'REJECT';
}

export interface CreateInterviewRoundPayload {
  jobId?: number | null;
  internshipId?: number | null;
  roundNumber?: number;
  name: string;
  type: InterviewRoundType;
  description?: string | null;
  isEliminative?: boolean;
}
