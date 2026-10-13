import { UserRole } from '@prisma/client';
import { Request } from 'express';

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface SafeUser {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  profile?: {
    fullName: string;
    studentId?: string;
    enrollmentNumber?: string;
    department?: string;
    companyName?: string;
    designation?: string;
    avatarUrl?: string | null;
  };
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
