export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type AcademicStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'DETAINED';

export type AcademicLevel = 'CLASS_10' | 'CLASS_12' | 'DIPLOMA' | 'UNDERGRADUATE' | 'POSTGRADUATE' | 'SEMESTER';

export type SkillCategory = 'TECHNICAL' | 'SOFT_SKILL' | 'DOMAIN' | 'TOOL' | 'LANGUAGE';

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type DocumentType = 'RESUME' | 'CERTIFICATE' | 'MARKSHEET' | 'INTERNSHIP_CERTIFICATE' | 'OFFER_LETTER' | 'ID_PROOF' | 'OTHER';

export interface SectionCompletion {
  percentage: number;
  weight: number;
  isComplete: boolean;
  missingFields: string[];
}

export interface ProfileCompletionDetails {
  score: number;
  sections: {
    personal: SectionCompletion;
    academic: SectionCompletion;
    skills: SectionCompletion;
    career: SectionCompletion;
    documents: SectionCompletion;
  };
  missingItems: string[];
  recommendations: string[];
}

export interface StudentProfile {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  profilePhoto?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  studentId: string;
  enrollmentNumber: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  academicStatus: AcademicStatus;
  isPlacementEligible: boolean;
  createdAt: string;
  updatedAt: string;
  completion?: ProfileCompletionDetails | null;
}

export interface StudentAcademicRecord {
  id: number;
  studentId: number;
  level: AcademicLevel;
  semesterNumber?: number | null;
  institution: string;
  boardOrUniv?: string | null;
  passingYear: number;
  cgpa?: number | null;
  percentage?: number | null;
  marksObtained?: number | null;
  totalMarks?: number | null;
  backlogsCount: number;
  marksheetUrl?: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface AcademicDetails {
  studentId: string;
  enrollmentNumber: string;
  course: string;
  program: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  semester: number;
  graduationYear: number;
  cgpa?: number | null;
  percentage?: number | null;
  backlogs: number;
  academicStatus: AcademicStatus;
  isPlacementEligible: boolean;
  academicRecords: StudentAcademicRecord[];
}

export interface CatalogSkill {
  id: number;
  name: string;
  category: SkillCategory;
}

export interface StudentSkill {
  id: number;
  skillId: number;
  name: string;
  category: SkillCategory;
  proficiency: SkillProficiency;
  yearsOfExperience?: number | null;
  createdAt?: string;
}

export interface Certification {
  id: number;
  studentId: number;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerInfo {
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  careerInterests?: string | null;
  preferredRoles?: string | null;
  preferredLocations?: string | null;
}

export interface StudentDocument {
  id: number;
  type: DocumentType;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface ApplicationHistoryItem {
  id: number;
  newStatus: string;
  note?: string | null;
  createdAt: string;
}

export interface StudentApplicationItem {
  id: number;
  opportunityType: 'JOB' | 'INTERNSHIP';
  title: string;
  companyName: string;
  companyLogo?: string | null;
  status: string;
  appliedAt: string;
  statusRemarks?: string | null;
  recentHistory?: ApplicationHistoryItem[];
}

export interface StudentInterviewItem {
  id: number;
  roundName: string;
  roundNumber: number;
  companyName: string;
  companyLogo?: string | null;
  opportunityTitle: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode: string;
  meetingLink?: string | null;
  location?: string | null;
  interviewerName?: string | null;
  status: string;
}

export interface StudentOfferItem {
  id: number;
  designation: string;
  companyName: string;
  salary?: number | null;
  stipend?: number | null;
  currency: string;
  status: string;
  offerDate: string;
  acceptanceDeadline?: string | null;
}

export interface StudentPlacementItem {
  id: number;
  companyName: string;
  designation: string;
  packageAmount: number;
  currency: string;
  placementDate: string;
  placementType: string;
  status: string;
}

export interface StudentNotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string | null;
}

export interface StudentDeadlinesItem {
  id: string;
  title: string;
  type: string;
  deadline: string;
  organization: string;
}

export interface DashboardSummary {
  profile: {
    id: number;
    fullName: string;
    studentId: string;
    enrollmentNumber: string;
    department: string;
    course: string;
    semester: number;
    graduationYear: number;
    cgpa?: number | null;
    academicStatus: AcademicStatus;
    isPlacementEligible: boolean;
    profilePhoto?: string | null;
  };
  completion: ProfileCompletionDetails | null;
  stats: {
    eligibleOpportunitiesCount: number;
    newOpportunitiesCount: number;
    appliedCount: number;
    interviewsCount: number;
    offersCount: number;
    placementsCount: number;
  };
  applications: StudentApplicationItem[];
  upcomingInterviews: StudentInterviewItem[];
  offers: StudentOfferItem[];
  placement: StudentPlacementItem | null;
  notifications: StudentNotificationItem[];
  deadlines: StudentDeadlinesItem[];
}
