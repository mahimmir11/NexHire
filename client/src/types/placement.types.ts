export type PlacementStatus = 'CONFIRMED' | 'JOINED' | 'DEFERRED' | 'RESCINDED' | 'DECLINED';

export type PlacementType = 'ON_CAMPUS' | 'OFF_CAMPUS' | 'PPO';

export interface PlacementStudent {
  id: number;
  fullName: string;
  studentId: string;
  enrollmentNumber?: string;
  course: string;
  program: string;
  semester?: number;
  graduationYear?: number;
  cgpa?: number | string | null;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  user?: {
    id: number;
    email: string;
  };
  skills?: Array<{
    id: number;
    proficiency: string;
    skill: {
      id: number;
      name: string;
      category: string;
    };
  }>;
}

export interface PlacementCompany {
  id: number;
  name: string;
  logoUrl?: string | null;
  industry?: string;
  website?: string | null;
  headquarters?: string;
  contactEmail?: string;
}

export interface PlacementOpportunity {
  id: number;
  title: string;
  employmentType?: string;
  workMode?: string;
  location?: string;
}

export interface PlacementOffer {
  id: number;
  offerDate: string;
  joiningDate?: string | null;
  salary?: number | string | null;
  stipend?: number | string | null;
  currency: string;
  designation: string;
  status: string;
  offerDocument?: {
    id: number;
    title: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  } | null;
}

export interface PlacementApplication {
  id: number;
  opportunityType: 'JOB' | 'INTERNSHIP';
  status: string;
  appliedAt: string;
  job?: { id: number; title: string; employmentType?: string };
  internship?: { id: number; title: string };
  resumeDocument?: {
    id: number;
    title: string;
    fileName: string;
    fileUrl: string;
  } | null;
  statusHistory?: Array<{
    id: number;
    previousStatus?: string | null;
    newStatus: string;
    note?: string | null;
    createdAt: string;
    changedBy?: {
      id: number;
      email: string;
      role: string;
    } | null;
  }>;
  interviews?: Array<{
    id: number;
    roundNumber: number;
    roundName: string;
    interviewDate: string;
    mode: string;
    status: string;
    result: string;
  }>;
}

export interface Placement {
  id: number;
  studentId: number;
  companyId: number;
  applicationId?: number | null;
  jobId?: number | null;
  offerId?: number | null;
  placementDate: string;
  packageAmount: number | string;
  currency: string;
  joiningDate?: string | null;
  placementType: PlacementType;
  designation: string;
  location?: string | null;
  status: PlacementStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;

  student: PlacementStudent;
  company: PlacementCompany;
  job?: PlacementOpportunity | null;
  offer?: PlacementOffer | null;
  application?: PlacementApplication | null;
}

export interface PlacementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PlacementListResponse {
  placements: Placement[];
  pagination: PlacementPagination;
}

export interface StudentPlacementResponse {
  isPlaced: boolean;
  placements: Placement[];
}

export interface PlacementStats {
  totalPlacements: number;
  statusBreakdown: {
    confirmed: number;
    joined: number;
    deferred: number;
    declined: number;
    rescinded: number;
  };
  typeBreakdown: {
    onCampus: number;
    ppo: number;
    offCampus: number;
  };
  salaryStats: {
    average: number;
    highest: number;
    lowest: number;
  };
  placementsByDepartment: Array<{
    id: number;
    name: string;
    code: string;
    count: number;
  }>;
  recentPlacements: Array<{
    id: number;
    student: { id: number; fullName: string; course: string };
    company: { id: number; name: string; logoUrl?: string | null };
  }>;
}

export interface CreatePlacementPayload {
  applicationId: number;
  offerId?: number | null;
  packageAmount: number;
  currency?: string;
  designation: string;
  location?: string | null;
  placementDate?: string;
  joiningDate?: string | null;
  placementType?: PlacementType;
  status?: PlacementStatus;
  notes?: string | null;
}

export interface UpdatePlacementPayload {
  packageAmount?: number;
  currency?: string;
  designation?: string;
  location?: string | null;
  joiningDate?: string | null;
  placementType?: PlacementType;
  notes?: string | null;
}

export interface UpdatePlacementStatusPayload {
  status: PlacementStatus;
  notes?: string | null;
}
