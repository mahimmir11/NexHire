import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database.js';
import { verifyToken } from '../utils/security.utils.js';
import { SafeUser } from '../types/auth.types.js';

/**
 * Middleware: Enforces user authentication via JWT Bearer token or HTTP-only cookie.
 * Verifies user active status directly against the MySQL database.
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check Authorization Header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Fallback to HTTP-only cookie
    else if (req.cookies && req.cookies.nexhire_token) {
      token = req.cookies.nexhire_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
      return;
    }

    // 3. Verify JWT signature & expiration
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Session has expired or token is invalid. Please log in again.',
      });
      return;
    }

    // 4. Fetch fresh user state from MySQL to ensure account is valid & active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: {
          include: {
            department: { select: { code: true, name: true } },
          },
        },
        recruiter: {
          include: {
            company: { select: { name: true, verificationStatus: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
      return;
    }

    // 5. Construct safe user profile (without passwordHash)
    let profileData: SafeUser['profile'];
    if (user.student) {
      profileData = {
        fullName: user.student.fullName,
        studentId: user.student.studentId,
        enrollmentNumber: user.student.enrollmentNumber,
        department: user.student.department.name,
        avatarUrl: user.student.profilePhoto,
      };
    } else if (user.recruiter) {
      profileData = {
        fullName: user.recruiter.fullName,
        companyName: user.recruiter.company.name,
        designation: user.recruiter.designation,
      };
    } else {
      profileData = {
        fullName: user.role === UserRole.SUPER_ADMIN ? 'Super Administrator' : 'Placement Administrator',
      };
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      profile: profileData,
    };

    next();
  } catch (error: unknown) {
    console.error('Authentication middleware error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: 'Internal authentication error. Please try again.',
    });
  }
}

/**
 * Middleware: Enforces Role-Based Access Control (RBAC).
 * Compares authenticated database role against allowed role list.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required before checking authorization.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied: Your account role (${req.user.role}) does not have permission to access this resource.`,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}
