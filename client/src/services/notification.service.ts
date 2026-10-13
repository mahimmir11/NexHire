import { authService } from './auth.service';
import type { AppNotification, NotificationListResponse } from '../types/notification.types';

const API_BASE = 'http://localhost:5000/api/notifications';

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

export const notificationClientService = {
  async getNotifications(page = 1, limit = 15, isRead?: boolean): Promise<NotificationListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (isRead !== undefined) {
      params.append('isRead', String(isRead));
    }
    const res = await request<{ success: boolean; data: NotificationListResponse }>(`/?${params.toString()}`);
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await request<{ success: boolean; data: { unreadCount: number } }>('/unread-count');
    return res.data.unreadCount;
  },

  async markAsRead(id: number): Promise<AppNotification> {
    const res = await request<{ success: boolean; data: AppNotification }>(`/${id}/read`, {
      method: 'PUT',
    });
    return res.data;
  },

  async markAllAsRead(): Promise<number> {
    const res = await request<{ success: boolean; data: { updatedCount: number } }>('/mark-all-read', {
      method: 'PUT',
    });
    return res.data.updatedCount;
  },

  async deleteNotification(id: number): Promise<void> {
    await request<{ success: boolean; message: string }>(`/${id}`, {
      method: 'DELETE',
    });
  },
};
