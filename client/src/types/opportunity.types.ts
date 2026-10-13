export type OpportunityStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TRAINEESHIP';

export type WorkMode = 'ON_SITE' | 'REMOTE' | 'HYBRID';

export type StipendPeriod = 'PER_MONTH' | 'PER_WEEK' | 'LUMP_SUM' | 'UNPAID';

export type OpportunityType = 'JOB' | 'INTERNSHIP';

export interface CriterionResult {
  criterion: string;
  required: string | number | string[];
  actual: string | number | string[] | null | undefined;
  satisfied: boolean;
  message?: string;
}

export interface EligibilityEvaluation {
  isEligible: boolean;
  reasons: string[];
  criteriaSummary: Record<string, CriterionResult>;
  evaluatedAt: string;
}

export interface EligibilityCriteria {
  id?: number;
  jobId?: number | null;
  internshipId?: number | null;
  minCgpa?: number | string | null;
  minPercentage?: number | string | null;
  maxBacklogs: number;
  allowedCourses?: string | string[] | null;
  allowedPrograms?: string | string[] | null;
  allowedDepartments?: string | string[] | null;
  allowedSemesters?: string | number[] | null;
  graduationYears?: string | number[] | null;
  requiredSkills?: string | string[] | null;
  additionalCriteria?: string | null;
}

export interface OpportunityListItem {
  id: number;
  type: OpportunityType;
  title: string;
  description: string;
  responsibilities: string;
  requirements?: string;
  requiredSkills: string;
  employmentType?: EmploymentType;
  duration?: string;
  startDate?: string | null;
  endDate?: string | null;
  location: string;
  workMode: WorkMode;
  salaryMin?: number | string;
  salaryMax?: number | string;
  salaryCurrency?: string;
  stipendAmount?: number | string;
  stipendCurrency?: string;
  stipendPeriod?: StipendPeriod;
  isPPOApplicable?: boolean;
  vacancies: number;
  applicationDeadline: string;
  isDeadlinePassed: boolean;
  status: OpportunityStatus;
  company: {
    id: number;
    name: string;
    logoUrl?: string | null;
    industry?: string;
    verificationStatus?: string;
  };
  createdAt: string;
  eligibilityCriteria?: EligibilityCriteria | null;
  eligibility?: {
    isEligible: boolean;
    reasons: string[];
  } | null;
}

export interface OpportunityDetail extends OpportunityListItem {
  selectionProcess?: string | null;
  salaryBreakup?: string | null;
  recruiter?: {
    id: number;
    fullName: string;
    designation: string;
    email: string;
  } | null;
  studentEligibility?: EligibilityEvaluation | null;
}

export interface PaginatedOpportunities {
  items: OpportunityListItem[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OpportunityFilterParams {
  type?: 'ALL' | 'JOB' | 'INTERNSHIP';
  search?: string;
  workMode?: WorkMode;
  location?: string;
  employmentType?: EmploymentType;
  sortBy?: 'newest' | 'deadline' | 'salary' | 'stipend';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface JobCreatePayload {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  requiredSkills: string;
  employmentType: EmploymentType;
  location: string;
  workMode: WorkMode;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency?: string;
  salaryBreakup?: string;
  vacancies: number;
  applicationDeadline: string;
  selectionProcess?: string;
  status?: OpportunityStatus;
  eligibilityCriteria?: Partial<EligibilityCriteria>;
}

export interface InternshipCreatePayload {
  title: string;
  description: string;
  responsibilities: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  stipendAmount: number;
  stipendCurrency?: string;
  stipendPeriod: StipendPeriod;
  location: string;
  workMode: WorkMode;
  requiredSkills: string;
  vacancies: number;
  applicationDeadline: string;
  selectionProcess?: string;
  isPPOApplicable?: boolean;
  status?: OpportunityStatus;
  eligibilityCriteria?: Partial<EligibilityCriteria>;
}
