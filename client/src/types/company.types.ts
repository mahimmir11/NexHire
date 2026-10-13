export type CompanyVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type RecruiterAccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'INACTIVE' | 'SUSPENDED';

export interface CompanyCompletionSection {
  isComplete: boolean;
  weight: number;
  percentage: number;
  missingFields: string[];
}

export interface CompanyProfileCompletion {
  score: number;
  sections: {
    identity: CompanyCompletionSection;
    presence: CompanyCompletionSection;
    contact: CompanyCompletionSection;
  };
  missingFields: string[];
  recommendations: string[];
}

export interface CompanyProfile {
  id: number;
  name: string;
  logoUrl?: string | null;
  industry: string;
  website?: string | null;
  description: string;
  headquarters: string;
  locations?: string | null;
  companySize?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  verificationStatus: CompanyVerificationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completion?: CompanyProfileCompletion;
  currentRecruiter?: {
    id: number;
    fullName: string;
    designation: string;
    email: string;
    phone?: string | null;
    accountStatus: RecruiterAccountStatus;
  };
}

export interface RecruiterItem {
  id: number;
  userId: number;
  companyId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  designation: string;
  accountStatus: RecruiterAccountStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    isActive: boolean;
    lastLoginAt?: string | null;
  };
  isCurrentUser?: boolean;
}

export interface RecruiterDashboardSummary {
  company: {
    id: number;
    name: string;
    logoUrl?: string | null;
    industry: string;
    website?: string | null;
    description?: string | null;
    headquarters: string;
    locations?: string | null;
    companySize?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
    verificationStatus: CompanyVerificationStatus;
    isActive: boolean;
  };
  currentRecruiter: {
    id: number;
    fullName: string;
    designation: string;
    email: string;
  };
  completion: CompanyProfileCompletion;
  stats: {
    recruitersCount: number;
    activeJobsCount: number;
    activeInternshipsCount: number;
    applicationsCount: number;
    interviewsCount: number;
    offersCount: number;
  };
  recentRecruiters: Array<{
    id: number;
    fullName: string;
    designation: string;
    email: string;
    accountStatus: RecruiterAccountStatus;
  }>;
}

export interface CompanyListItem {
  id: number;
  name: string;
  logoUrl?: string | null;
  industry: string;
  website?: string | null;
  headquarters: string;
  companySize?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  verificationStatus: CompanyVerificationStatus;
  isActive: boolean;
  createdAt: string;
  recruitersCount: number;
  drivesCount: number;
}

export interface CompanyDetailsAdmin extends CompanyProfile {
  recruiters: RecruiterItem[];
  _count: {
    jobs: number;
    internships: number;
    offers: number;
  };
}

export interface CompanyProfileUpdatePayload {
  name?: string;
  industry?: string;
  website?: string;
  description?: string;
  headquarters?: string;
  locations?: string;
  companySize?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface RecruiterCreatePayload {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  designation: string;
}

export interface RecruiterUpdatePayload {
  fullName?: string;
  phone?: string;
  designation?: string;
  accountStatus?: RecruiterAccountStatus;
}

export interface CompanyVerificationPayload {
  status: CompanyVerificationStatus;
  notes?: string;
}
