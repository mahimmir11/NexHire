import { authService } from './auth.service';
import type {
  AdminOverviewStats,
  AdminUser,
  Department,
  AuditLogItem,
  SystemSetting,
} from '../types/admin.types';

const API_BASE = 'http://localhost:5000/api/admin';

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
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const adminService = {
  // 1. Dashboard Overview
  async getOverviewStats(): Promise<AdminOverviewStats> {
    const res = await request<{ success: boolean; data: AdminOverviewStats }>('/overview');
    return res.data;
  },

  // 2. User Management
  async getUsers(page = 1, limit = 15, role?: string, search?: string, isActive?: boolean): Promise<{
    users: AdminUser[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    if (isActive !== undefined) params.append('isActive', String(isActive));

    const res = await request<{
      success: boolean;
      data: {
        users: AdminUser[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`/users?${params.toString()}`);
    return res.data;
  },

  async updateUserStatus(userId: number, isActive: boolean): Promise<AdminUser> {
    const res = await request<{ success: boolean; data: AdminUser }>(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  },

  // 3. Department Management
  async getDepartments(): Promise<Department[]> {
    const res = await request<{ success: boolean; data: Department[] }>('/departments');
    return res.data;
  },

  async createDepartment(data: { name: string; code: string; description?: string }): Promise<Department> {
    const res = await request<{ success: boolean; data: Department }>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateDepartment(id: number, data: { name?: string; code?: string; description?: string; isActive?: boolean }): Promise<Department> {
    const res = await request<{ success: boolean; data: Department }>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteDepartment(id: number): Promise<{ message: string }> {
    const res = await request<{ success: boolean; message: string }>(`/departments/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  // 4. Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    logs: AuditLogItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.action) query.append('action', params.action);
    if (params.entity) query.append('entity', params.entity);
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const res = await request<{
      success: boolean;
      data: {
        logs: AuditLogItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    }>(`/audit-logs?${query.toString()}`);
    return res.data;
  },

  // 5. System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    const res = await request<{ success: boolean; data: SystemSetting[] }>('/settings');
    return res.data;
  },

  async updateSystemSettings(settings: Array<{ key: string; value: string; group?: string; description?: string }>): Promise<SystemSetting[]> {
    const res = await request<{ success: boolean; data: SystemSetting[] }>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
    return res.data;
  },
};
