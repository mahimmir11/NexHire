import { authService } from './auth.service';
import type {
  Application,
  ApplicationListResponse,
  ApplyPayload,
  ApplicationStatusCheck,
  ApplicationStatus,
  OpportunityType,
} from '../types/application.types';

const API_BASE = 'http://localhost:5000/api/applications';

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
      (data.reasons ? data.reasons.join('; ') : null) ||
      (data.errors
        ? Array.isArray(data.errors)
          ? data.errors.map((e: any) => e.message).join(', ')
          : JSON.stringify(data.errors)
        : 'Request failed');
    throw new Error(errorMsg);
  }

  return data.data;
}

export const applicationService = {
  // ==========================================
  // 1. STUDENT APIS
  // ==========================================

  async apply(payload: ApplyPayload): Promise<Application> {
    return request<Application>('/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async checkStatus(type: OpportunityType, id: number): Promise<ApplicationStatusCheck> {
    return request<ApplicationStatusCheck>(`/check-status/${type}/${id}`);
  },

  async getMyApplications(params: Record<string, any> = {}): Promise<ApplicationListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<ApplicationListResponse>(`/student/my-applications${queryString}`);
  },

  async getMyApplicationById(id: number): Promise<Application> {
    return request<Application>(`/student/${id}`);
  },

  async withdrawApplication(id: number, note?: string): Promise<Application> {
    return request<Application>(`/student/${id}/withdraw`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    });
  },

  // ==========================================
  // 2. RECRUITER APIS
  // ==========================================

  async getCompanyApplications(params: Record<string, any> = {}): Promise<ApplicationListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<ApplicationListResponse>(`/company/all${queryString}`);
  },

  // ==========================================
  // 3. PLACEMENT ADMIN APIS
  // ==========================================

  async getAdminApplications(params: Record<string, any> = {}): Promise<ApplicationListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<ApplicationListResponse>(`/admin/all${queryString}`);
  },

  // ==========================================
  // 4. SHARED REVIEWER APIS
  // ==========================================

  async getApplicationDetails(id: number): Promise<Application> {
    return request<Application>(`/${id}`);
  },

  async updateStatus(id: number, status: ApplicationStatus, note?: string): Promise<Application> {
    return request<Application>(`/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },

  async addNote(id: number, note: string): Promise<any> {
    return request<any>(`/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },
};
