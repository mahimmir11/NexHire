import type { InterviewCompanySummary, InterviewStudentSummary, InterviewOpportunitySummary } from './interview.types';

export type OfferStatus = 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';

export interface OfferDocument {
  id: number;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface Offer {
  id: number;
  applicationId: number;
  studentId: number;
  companyId: number;
  jobId: number | null;
  internshipId: number | null;
  designation: string;
  salary: number | string | null;
  stipend: number | string | null;
  currency: string;
  location: string;
  offerDate: string;
  joiningDate: string | null;
  acceptanceDeadline: string | null;
  offerLetterDocumentId: number | null;
  status: OfferStatus;
  respondedAt: string | null;
  responseNotes: string | null;
  createdAt: string;
  updatedAt: string;
  student?: InterviewStudentSummary;
  company?: InterviewCompanySummary;
  job?: InterviewOpportunitySummary | null;
  internship?: InterviewOpportunitySummary | null;
  offerDocument?: OfferDocument | null;
  application?: {
    id: number;
    status: string;
    appliedAt: string;
    statusHistory?: any[];
  };
}

export interface OfferPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OfferListResponse {
  offers: Offer[];
  pagination: OfferPagination;
}

export interface CreateOfferPayload {
  applicationId: number;
  designation: string;
  salary?: number | null;
  stipend?: number | null;
  currency?: string;
  location: string;
  offerDate?: string;
  joiningDate?: string | null;
  acceptanceDeadline?: string | null;
  offerLetterDocumentId?: number | null;
}

export interface UpdateOfferPayload {
  designation?: string;
  salary?: number | null;
  stipend?: number | null;
  currency?: string;
  location?: string;
  joiningDate?: string | null;
  acceptanceDeadline?: string | null;
  offerLetterDocumentId?: number | null;
}
