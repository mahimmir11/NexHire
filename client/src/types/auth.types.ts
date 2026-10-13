export type UserRole = 'SUPER_ADMIN' | 'PLACEMENT_ADMIN' | 'STUDENT' | 'RECRUITER';

export interface UserProfile {
  fullName: string;
  studentId?: string;
  enrollmentNumber?: string;
  department?: string;
  companyName?: string;
  designation?: string;
  avatarUrl?: string | null;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  profile?: UserProfile;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}
