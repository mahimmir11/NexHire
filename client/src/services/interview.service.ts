import { authService } from './auth.service';
import type {
  Interview,
  InterviewListResponse,
  InterviewRound,
  ScheduleInterviewPayload,
  RescheduleInterviewPayload,
  RecordInterviewResultPayload,
  CreateInterviewRoundPayload,
  InterviewStatus,
  InterviewMode,
  InterviewResult,
} from '../types/interview.types';

const API_BASE = 'http://localhost:5000/api/interviews';

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
      (data.errors
        ? Array.isArray(data.errors)
          ? data.errors.map((e: any) => e.message).join(', ')
          : JSON.stringify(data.errors)
        : 'Request failed');
    throw new Error(errorMsg);
  }

  return data.data;
}

export const interviewService = {
  // ==========================================
  // 1. STUDENT APIS
  // ==========================================

  async getStudentInterviews(params?: {
    page?: number;
    limit?: number;
    status?: InterviewStatus;
    mode?: InterviewMode;
    result?: InterviewResult;
    search?: string;
  }): Promise<InterviewListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.mode) query.set('mode', params.mode);
    if (params?.result) query.set('result', params.result);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<InterviewListResponse>(`/student/my-interviews${queryString}`);
  },

  // ==========================================
  // 2. RECRUITER APIS
  // ==========================================

  async getRecruiterInterviews(params?: {
    page?: number;
    limit?: number;
    status?: InterviewStatus;
    mode?: InterviewMode;
    result?: InterviewResult;
    jobId?: number;
    internshipId?: number;
    search?: string;
  }): Promise<InterviewListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.mode) query.set('mode', params.mode);
    if (params?.result) query.set('result', params.result);
    if (params?.jobId) query.set('jobId', String(params.jobId));
    if (params?.internshipId) query.set('internshipId', String(params.internshipId));
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<InterviewListResponse>(`/recruiter/all${queryString}`);
  },

  // ==========================================
  // 3. ADMIN APIS
  // ==========================================

  async getAdminInterviews(params?: {
    page?: number;
    limit?: number;
    companyId?: number;
    status?: InterviewStatus;
    mode?: InterviewMode;
    result?: InterviewResult;
    search?: string;
  }): Promise<InterviewListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.companyId) query.set('companyId', String(params.companyId));
    if (params?.status) query.set('status', params.status);
    if (params?.mode) query.set('mode', params.mode);
    if (params?.result) query.set('result', params.result);
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<InterviewListResponse>(`/admin/all${queryString}`);
  },

  // ==========================================
  // 4. COMMON & MANAGEMENT APIS
  // ==========================================

  async getInterviewById(id: number): Promise<Interview> {
    return request<Interview>(`/${id}`);
  },

  async scheduleInterview(payload: ScheduleInterviewPayload): Promise<Interview> {
    return request<Interview>('/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async rescheduleInterview(id: number, payload: RescheduleInterviewPayload): Promise<Interview> {
    return request<Interview>(`/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async cancelInterview(id: number, reason?: string): Promise<Interview> {
    return request<Interview>(`/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  async completeInterview(id: number): Promise<Interview> {
    return request<Interview>(`/${id}/complete`, {
      method: 'PUT',
    });
  },

  async recordResult(id: number, payload: RecordInterviewResultPayload): Promise<Interview> {
    return request<Interview>(`/${id}/result`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async selectCandidate(applicationId: number, notes?: string): Promise<any> {
    return request<any>(`/application/${applicationId}/select`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  // ==========================================
  // 5. INTERVIEW ROUNDS
  // ==========================================

  async getOpportunityRounds(type: 'JOB' | 'INTERNSHIP', opportunityId: number): Promise<InterviewRound[]> {
    return request<InterviewRound[]>(`/rounds/opportunity/${type}/${opportunityId}`);
  },

  async createRound(payload: CreateInterviewRoundPayload): Promise<InterviewRound> {
    return request<InterviewRound>('/rounds', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRound(id: number, payload: Partial<CreateInterviewRoundPayload>): Promise<InterviewRound> {
    return request<InterviewRound>(`/rounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteRound(id: number): Promise<void> {
    return request<void>(`/rounds/${id}`, {
      method: 'DELETE',
    });
  },
};
