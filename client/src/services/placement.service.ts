import { authService } from './auth.service';
import type {
  Placement,
  PlacementListResponse,
  StudentPlacementResponse,
  PlacementStats,
  CreatePlacementPayload,
  UpdatePlacementPayload,
  UpdatePlacementStatusPayload,
  PlacementStatus,
  PlacementType,
} from '../types/placement.types';

const API_BASE = 'http://localhost:5000/api/placements';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
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
      (data.errors
        ? Array.isArray(data.errors)
          ? data.errors.map((e: any) => e.message).join(', ')
          : JSON.stringify(data.errors)
        : 'Request failed');
    throw new Error(errorMsg);
  }

  return data.data;
}

export const placementService = {
  // ==========================================
  // 1. STUDENT APIS
  // ==========================================

  async getStudentPlacement(): Promise<StudentPlacementResponse> {
    return request<StudentPlacementResponse>('/student/my-placement');
  },

  // ==========================================
  // 2. RECRUITER APIS
  // ==========================================

  async getRecruiterPlacements(params?: {
    page?: number;
    limit?: number;
    status?: PlacementStatus;
    placementType?: PlacementType;
    search?: string;
  }): Promise<PlacementListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.placementType) query.set('placementType', params.placementType);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<PlacementListResponse>(`/recruiter/all${queryString}`);
  },

  // ==========================================
  // 3. ADMIN APIS
  // ==========================================

  async getAdminPlacements(params?: {
    page?: number;
    limit?: number;
    companyId?: number;
    departmentId?: number;
    status?: PlacementStatus;
    placementType?: PlacementType;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PlacementListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.companyId) query.set('companyId', String(params.companyId));
    if (params?.departmentId) query.set('departmentId', String(params.departmentId));
    if (params?.status) query.set('status', params.status);
    if (params?.placementType) query.set('placementType', params.placementType);
    if (params?.search) query.set('search', params.search);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<PlacementListResponse>(`/admin/all${queryString}`);
  },

  async getPlacementStats(): Promise<PlacementStats> {
    return request<PlacementStats>('/stats');
  },

  // ==========================================
  // 4. SHARED CRUD OPERATIONS
  // ==========================================

  async getPlacementById(id: number): Promise<Placement> {
    return request<Placement>(`/${id}`);
  },

  async createPlacement(payload: CreatePlacementPayload): Promise<Placement> {
    return request<Placement>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePlacement(id: number, payload: UpdatePlacementPayload): Promise<Placement> {
    return request<Placement>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updatePlacementStatus(id: number, payload: UpdatePlacementStatusPayload): Promise<Placement> {
    return request<Placement>(`/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
