export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'INTERVIEW_SCHEDULED'
  | 'SELECTED'
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'WITHDRAWN'
  | 'HIRED_PLACED';

export type OpportunityType = 'JOB' | 'INTERNSHIP';

export interface ApplicationStatusHistory {
  id: number;
  applicationId: number;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedById: number | null;
  note: string | null;
  createdAt: string;
  changedBy?: {
    id: number;
    email: string;
    role: string;
  } | null;
}

export interface ApplicationOpportunitySummary {
  id: number;
  title: string;
  companyId: number;
  location: string;
  workMode: string;
  employmentType?: string;
  duration?: string;
  salaryMin?: number;
  salaryMax?: number;
  stipendAmount?: number;
  stipendPeriod?: string;
  applicationDeadline?: string;
  company: {
    id: number;
    name: string;
    logoUrl: string | null;
    headquarters: string | null;
  };
  eligibilityCriteria?: any;
}

export interface ApplicationStudentSummary {
  id: number;
  fullName: string;
  studentId: string;
  enrollmentNumber: string;
  course: string;
  program: string;
  semester: number;
  graduationYear: number;
  cgpa: number | null;
  backlogs: number;
  department: {
    id: number;
    name: string;
    code: string;
  };
  user: {
    email: string;
    phone?: string | null;
  };
  skills?: Array<{
    id: number;
    skill: {
      id: number;
      name: string;
      category: string;
    };
    proficiency: string;
  }>;
  academicRecords?: Array<{
    id: number;
    level: string;
    passingYear: number;
    percentage: number | null;
    cgpa: number | null;
    institution: string;
  }>;
}

export interface ApplicationDocument {
  id: number;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt?: string;
}

export interface Application {
  id: number;
  studentId: number;
  opportunityType: OpportunityType;
  jobId: number | null;
  internshipId: number | null;
  status: ApplicationStatus;
  appliedAt: string;
  coverLetter: string | null;
  resumeDocumentId: number | null;
  statusRemarks: string | null;
  createdAt: string;
  updatedAt: string;
  job?: ApplicationOpportunitySummary | null;
  internship?: ApplicationOpportunitySummary | null;
  student?: ApplicationStudentSummary;
  resumeDocument?: ApplicationDocument | null;
  statusHistory?: ApplicationStatusHistory[];
}

export interface ApplicationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicationListResponse {
  applications: Application[];
  pagination: ApplicationPagination;
}

export interface ApplyPayload {
  opportunityType: OpportunityType;
  opportunityId: number;
  coverLetter?: string | null;
  resumeDocumentId?: number | null;
}

export interface ApplicationStatusCheck {
  hasApplied: boolean;
  application: {
    id: number;
    status: ApplicationStatus;
    appliedAt: string;
    opportunityType: OpportunityType;
  } | null;
}
