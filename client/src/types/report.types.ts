export interface AnalyticsSummary {
  totalApplications: number;
  applicationStatusBreakdown: Record<string, number>;
  totalPlacements: number;
  placementsByDepartment: Array<{
    code: string;
    name: string;
    count: number;
    totalPackage: number;
    avgPackage: number;
  }>;
  topHiringCompanies: Array<{
    id: number;
    name: string;
    hires: number;
  }>;
  salaryDistribution: {
    under6LPA: number;
    between6and10LPA: number;
    between10and15LPA: number;
    above15LPA: number;
  };
  offerStats: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
}

export type ReportType = 'placements' | 'applications' | 'interviews' | 'offers';

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReportDataResponse {
  reportType: ReportType;
  items: any[];
  pagination: ReportPagination;
}
