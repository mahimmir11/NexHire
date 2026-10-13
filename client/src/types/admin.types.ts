export interface AdminOverviewStats {
  users: {
    total: number;
    students: number;
    recruiters: number;
    administrators: number;
  };
  companies: {
    total: number;
    verified: number;
    pending: number;
  };
  opportunities: {
    total: number;
    jobs: number;
    activeJobs: number;
    internships: number;
    activeInternships: number;
  };
  applications: {
    total: number;
    shortlisted: number;
    selected: number;
    hired: number;
  };
  recruitment: {
    interviews: number;
    offers: number;
    acceptedOffers: number;
  };
  placements: {
    total: number;
    joined: number;
    averagePackage: number;
    highestPackage: number;
    totalValue: number;
  };
  recentActivity: Array<{
    id: number;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
    user?: {
      id: number;
      email: string;
      role: string;
    } | null;
  }>;
}

export interface AdminUser {
  id: number;
  email: string;
  role: 'SUPER_ADMIN' | 'PLACEMENT_ADMIN' | 'STUDENT' | 'RECRUITER';
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  student?: {
    id: number;
    fullName: string;
    studentId: string;
    course: string;
    department?: {
      id: number;
      code: string;
      name: string;
    } | null;
  } | null;
  recruiter?: {
    id: number;
    fullName: string;
    designation?: string | null;
    company?: {
      id: number;
      name: string;
      verificationStatus: string;
    } | null;
  } | null;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
  };
}

export interface AuditLogItem {
  id: number;
  userId: number | null;
  action: string;
  entity: string;
  entityId: string;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: number;
    email: string;
    role: string;
  } | null;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  group: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
