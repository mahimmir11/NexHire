import { authService } from './auth.service';
import type {
  OpportunityDetail,
  PaginatedOpportunities,
  OpportunityFilterParams,
  JobCreatePayload,
  InternshipCreatePayload,
  EligibilityEvaluation,
} from '../types/opportunity.types';

const API_BASE = 'http://localhost:5000/api/opportunities';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    const errorMsg =
      data.message ||
      (data.errors ? data.errors.map((e: any) => e.message).join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }

  return data.data;
}

export const opportunityService = {
  // ==========================================
  // DISCOVERY & STUDENT APIS
  // ==========================================

  async discoverOpportunities(filters: OpportunityFilterParams = {}): Promise<PaginatedOpportunities> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.workMode) params.append('workMode', filters.workMode);
    if (filters.location) params.append('location', filters.location);
    if (filters.employmentType) params.append('employmentType', filters.employmentType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<PaginatedOpportunities>(`/discover${query}`);
  },

  async getJobDetails(id: number): Promise<OpportunityDetail> {
    return request<OpportunityDetail>(`/jobs/${id}`);
  },

  async getInternshipDetails(id: number): Promise<OpportunityDetail> {
    return request<OpportunityDetail>(`/internships/${id}`);
  },

  async checkEligibility(type: 'JOB' | 'INTERNSHIP', id: number): Promise<{
    opportunity: { id: number; type: string; title: string; companyName: string };
  } & EligibilityEvaluation> {
    return request(`/check-eligibility/${type}/${id}`);
  },

  // ==========================================
  // RECRUITER APIS (Company-Scoped)
  // ==========================================

  async getMyCompanyJobs(): Promise<any[]> {
    return request<any[]>('/recruiter/jobs');
  },

  async createJob(payload: JobCreatePayload): Promise<any> {
    return request('/recruiter/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateJob(id: number, payload: Partial<JobCreatePayload>): Promise<any> {
    return request(`/recruiter/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async submitJobForApproval(id: number): Promise<any> {
    return request(`/recruiter/jobs/${id}/submit`, {
      method: 'PUT',
    });
  },

  async closeJob(id: number): Promise<any> {
    return request(`/recruiter/jobs/${id}/close`, {
      method: 'PUT',
    });
  },

  async getMyCompanyInternships(): Promise<any[]> {
    return request<any[]>('/recruiter/internships');
  },

  async createInternship(payload: InternshipCreatePayload): Promise<any> {
    return request('/recruiter/internships', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateInternship(id: number, payload: Partial<InternshipCreatePayload>): Promise<any> {
    return request(`/recruiter/internships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async submitInternshipForApproval(id: number): Promise<any> {
    return request(`/recruiter/internships/${id}/submit`, {
      method: 'PUT',
    });
  },

  async closeInternship(id: number): Promise<any> {
    return request(`/recruiter/internships/${id}/close`, {
      method: 'PUT',
    });
  },

  // ==========================================
  // PLACEMENT ADMIN APIS
  // ==========================================

  async getAdminOpportunities(params: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedOpportunities> {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.type) q.append('type', params.type);
    if (params.search) q.append('search', params.search);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));

    const query = q.toString() ? `?${q.toString()}` : '';
    return request<PaginatedOpportunities>(`/admin/all${query}`);
  },

  async reviewOpportunity(
    type: 'JOB' | 'INTERNSHIP',
    id: number,
    action: 'APPROVE' | 'REJECT' | 'CLOSE' | 'ARCHIVE',
    notes?: string
  ): Promise<any> {
    return request(`/admin/${type}/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, notes }),
    });
  },
};
