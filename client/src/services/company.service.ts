import { authService } from './auth.service';
import type {
  CompanyProfile,
  RecruiterItem,
  RecruiterDashboardSummary,
  CompanyListItem,
  CompanyDetailsAdmin,
  CompanyProfileUpdatePayload,
  RecruiterCreatePayload,
  RecruiterUpdatePayload,
  CompanyVerificationPayload,
} from '../types/company.types';

const API_BASE = 'http://localhost:5000/api/company';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type if body is FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
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

export const companyService = {
  // ==========================================
  // RECRUITER APIS (Scoped to current company)
  // ==========================================

  async getMyCompanyProfile(): Promise<CompanyProfile> {
    return request<CompanyProfile>('/my-company');
  },

  async updateMyCompanyProfile(data: CompanyProfileUpdatePayload): Promise<CompanyProfile> {
    return request<CompanyProfile>('/my-company', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadCompanyLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);

    return request<{ logoUrl: string }>('/my-company/logo', {
      method: 'POST',
      body: formData,
    });
  },

  async getMyCompanyRecruiters(): Promise<RecruiterItem[]> {
    return request<RecruiterItem[]>('/my-company/recruiters');
  },

  async addCompanyRecruiter(data: RecruiterCreatePayload): Promise<RecruiterItem> {
    return request<RecruiterItem>('/my-company/recruiters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCompanyRecruiter(id: number, data: RecruiterUpdatePayload): Promise<RecruiterItem> {
    return request<RecruiterItem>(`/my-company/recruiters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getDashboardSummary(): Promise<RecruiterDashboardSummary> {
    return request<RecruiterDashboardSummary>('/my-company/dashboard');
  },

  // ==========================================
  // PLACEMENT ADMIN & SUPER ADMIN APIS
  // ==========================================

  async getAllCompanies(status?: string, search?: string): Promise<CompanyListItem[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<CompanyListItem[]>(`/admin/all${query}`);
  },

  async getPendingCompanies(): Promise<CompanyListItem[]> {
    return request<CompanyListItem[]>('/admin/pending');
  },

  async getCompanyDetailsAdmin(id: number): Promise<CompanyDetailsAdmin> {
    return request<CompanyDetailsAdmin>(`/admin/${id}`);
  },

  async verifyCompany(id: number, payload: CompanyVerificationPayload): Promise<CompanyProfile> {
    return request<CompanyProfile>(`/admin/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
