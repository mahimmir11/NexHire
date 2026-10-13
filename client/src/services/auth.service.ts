import type { AuthResponse, User } from '../types/auth.types';

const API_BASE = 'http://localhost:5000/api/auth';
const TOKEN_KEY = 'nexhire_auth_token';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed. Please check your credentials.');
    }

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      this.removeToken();
    }
  },

  async getCurrentUser(tokenOverride?: string): Promise<User> {
    const token = tokenOverride || this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.user) {
      throw new Error(data.message || 'Session expired or unauthenticated.');
    }

    return data.user;
  },

  async testEndpoint(endpointName: string): Promise<{ success: boolean; status: number; message: string; data?: any }> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/test/${endpointName}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await res.json();

    return {
      success: res.ok && data.success,
      status: res.status,
      message: data.message || `HTTP ${res.status}`,
      data,
    };
  },
};
