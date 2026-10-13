import { authService } from './auth.service';
import type {
  Offer,
  OfferListResponse,
  CreateOfferPayload,
  UpdateOfferPayload,
  OfferStatus,
} from '../types/offer.types';

const API_BASE = 'http://localhost:5000/api/offers';

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

export const offerService = {
  // ==========================================
  // 1. STUDENT APIS
  // ==========================================

  async getStudentOffers(params?: {
    page?: number;
    limit?: number;
    status?: OfferStatus;
    search?: string;
  }): Promise<OfferListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<OfferListResponse>(`/student/my-offers${queryString}`);
  },

  async acceptOffer(id: number, responseNotes?: string): Promise<Offer> {
    return request<Offer>(`/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ responseNotes }),
    });
  },

  async rejectOffer(id: number, responseNotes?: string): Promise<Offer> {
    return request<Offer>(`/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ responseNotes }),
    });
  },

  // ==========================================
  // 2. RECRUITER APIS
  // ==========================================

  async getRecruiterOffers(params?: {
    page?: number;
    limit?: number;
    status?: OfferStatus;
    search?: string;
  }): Promise<OfferListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<OfferListResponse>(`/recruiter/all${queryString}`);
  },

  async createOffer(payload: CreateOfferPayload): Promise<Offer> {
    return request<Offer>('/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateOffer(id: number, payload: UpdateOfferPayload): Promise<Offer> {
    return request<Offer>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async uploadOfferDocument(id: number, file: File): Promise<Offer> {
    const formData = new FormData();
    formData.append('file', file);

    return request<Offer>(`/${id}/document`, {
      method: 'POST',
      body: formData,
    });
  },

  // ==========================================
  // 3. ADMIN APIS
  // ==========================================

  async getAdminOffers(params?: {
    page?: number;
    limit?: number;
    companyId?: number;
    status?: OfferStatus;
    search?: string;
  }): Promise<OfferListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.companyId) query.set('companyId', String(params.companyId));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<OfferListResponse>(`/admin/all${queryString}`);
  },

  // ==========================================
  // 4. COMMON APIS
  // ==========================================

  async getOfferById(id: number): Promise<Offer> {
    return request<Offer>(`/${id}`);
  },
};
