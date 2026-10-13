import { authService } from './auth.service';
import type { AnalyticsSummary, ReportType, ReportDataResponse } from '../types/report.types';

const API_BASE = 'http://localhost:5000/api/reports';

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

export const reportService = {
  async getAnalytics(params: {
    departmentId?: number;
    companyId?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AnalyticsSummary> {
    const query = new URLSearchParams();
    if (params.departmentId) query.append('departmentId', String(params.departmentId));
    if (params.companyId) query.append('companyId', String(params.companyId));
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const res = await request<{ success: boolean; data: AnalyticsSummary }>(`/analytics?${query.toString()}`);
    return res.data;
  },

  async getReportData(params: {
    reportType: ReportType;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    placementType?: string;
    result?: string;
  }): Promise<ReportDataResponse> {
    const query = new URLSearchParams({
      reportType: params.reportType,
      page: String(params.page || 1),
      limit: String(params.limit || 15),
    });
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.placementType) query.append('placementType', params.placementType);
    if (params.result) query.append('result', params.result);

    const res = await request<{ success: boolean; data: ReportDataResponse }>(`/data?${query.toString()}`);
    return res.data;
  },

  async downloadCsv(reportType: ReportType): Promise<void> {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE}/export?reportType=${reportType}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error('Failed to generate CSV export.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NexHire_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
