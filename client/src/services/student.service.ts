import { authService } from './auth.service';
import type {
  StudentProfile,
  AcademicDetails,
  StudentAcademicRecord,
  StudentSkill,
  CatalogSkill,
  Certification,
  CareerInfo,
  StudentDocument,
  DashboardSummary,
} from '../types/student.types';

const API_BASE = 'http://localhost:5000/api/student';

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
    const errorMsg = data.message || (data.errors ? data.errors.map((e: any) => e.message).join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }

  return data.data;
}

export const studentService = {
  // Dashboard
  async getDashboard(): Promise<DashboardSummary> {
    return request<DashboardSummary>('/dashboard');
  },

  // Profile (Personal)
  async getProfile(): Promise<StudentProfile> {
    return request<StudentProfile>('/profile');
  },

  async updateProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
    return request<StudentProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Academic
  async getAcademicInfo(): Promise<AcademicDetails> {
    return request<AcademicDetails>('/academic');
  },

  async updateAcademicInfo(data: Partial<AcademicDetails>): Promise<AcademicDetails> {
    return request<AcademicDetails>('/academic', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async createAcademicRecord(record: Partial<StudentAcademicRecord>): Promise<StudentAcademicRecord> {
    return request<StudentAcademicRecord>('/academic/records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  async deleteAcademicRecord(id: number): Promise<void> {
    return request<void>(`/academic/records/${id}`, {
      method: 'DELETE',
    });
  },

  // Skills
  async getSkills(): Promise<{ skills: StudentSkill[]; catalog: CatalogSkill[] }> {
    return request<{ skills: StudentSkill[]; catalog: CatalogSkill[] }>('/skills');
  },

  async addSkill(skillData: {
    skillId?: number;
    name?: string;
    category?: string;
    proficiency: string;
    yearsOfExperience?: number | null;
  }): Promise<StudentSkill> {
    return request<StudentSkill>('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  },

  async removeSkill(skillId: number): Promise<void> {
    return request<void>(`/skills/${skillId}`, {
      method: 'DELETE',
    });
  },

  // Certifications
  async getCertifications(): Promise<Certification[]> {
    return request<Certification[]>('/certifications');
  },

  async createCertification(certData: {
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string | null;
    credentialId?: string | null;
    credentialUrl?: string | null;
  }): Promise<Certification> {
    return request<Certification>('/certifications', {
      method: 'POST',
      body: JSON.stringify(certData),
    });
  },

  async updateCertification(
    id: number,
    certData: {
      name: string;
      issuingOrganization: string;
      issueDate: string;
      expiryDate?: string | null;
      credentialId?: string | null;
      credentialUrl?: string | null;
    }
  ): Promise<Certification> {
    return request<Certification>(`/certifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(certData),
    });
  },

  async deleteCertification(id: number): Promise<void> {
    return request<void>(`/certifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Career
  async getCareerInfo(): Promise<CareerInfo> {
    return request<CareerInfo>('/career');
  },

  async updateCareerInfo(data: CareerInfo): Promise<CareerInfo> {
    return request<CareerInfo>('/career', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Documents
  async getDocuments(): Promise<StudentDocument[]> {
    return request<StudentDocument[]>('/documents');
  },

  async uploadDocument(formData: FormData): Promise<StudentDocument> {
    return request<StudentDocument>('/documents', {
      method: 'POST',
      body: formData,
    });
  },

  async deleteDocument(id: number): Promise<void> {
    return request<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  getDocumentDownloadUrl(id: number): string {
    const token = authService.getToken();
    return `${API_BASE}/documents/${id}/download?token=${token || ''}`;
  },
};
