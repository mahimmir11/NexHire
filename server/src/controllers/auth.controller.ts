import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database.js';
import { config } from '../config/env.js';
import { comparePassword, generateToken } from '../utils/security.utils.js';
import { LoginRequestBody, SafeUser } from '../types/auth.types.js';

/**
 * POST /api/auth/login
 * Authenticates user credentials, sets session cookie, and returns safe user profile with token.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequestBody;

    // 1. Input validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Lookup user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
        message: 'Invalid email or password.',
      });
      return;
    }

    // 3. Verify password hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // 4. Check account status
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
      return;
    }

    // 5. Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6. Security Audit Log (Never stores passwords)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN_SUCCESS',
          entity: 'User',
          entityId: String(user.id),
          newValues: JSON.stringify({
            role: user.role,
            email: user.email,
            timestamp: new Date().toISOString(),
          }),
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      });
    } catch {
      // Audit log failures should not block successful authentication
    }

    // 7. Generate JWT access token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 8. Set HTTP-only secure cookie
    const cookieMaxAge = config.jwtCookieExpiresIn * 24 * 60 * 60 * 1000;
    res.cookie('nexhire_token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
    });

    // 9. Format safe profile data
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

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: new Date(),
      createdAt: user.createdAt,
      profile: profileData,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (error: unknown) {
    console.error('Login controller error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login. Please try again later.',
    });
  }
}

/**
 * POST /api/auth/logout
 * Clears the session cookie and invalidates client session state.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (req.user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action: 'USER_LOGOUT',
            entity: 'User',
            entityId: String(req.user.id),
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
          },
        });
      } catch {
        // Continue logout even if audit logging fails
      }
    }

    res.clearCookie('nexhire_token', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error: unknown) {
    console.error('Logout error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: 'Logout encountered an unexpected error.',
    });
  }
}

/**
 * GET /api/auth/me
 * Returns current authenticated user's profile details.
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: req.user,
  });
}

/**
 * Testing & Verification endpoints for RBAC
 */
export function testProtected(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: `Access granted: Authenticated as ${req.user?.email} (${req.user?.role})`,
    user: req.user,
  });
}

export function testSuperAdminOnly(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Authorized: SUPER_ADMIN exclusive endpoint accessed successfully.',
    user: req.user,
  });
}

export function testPlacementAdminAccess(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Authorized: PLACEMENT_ADMIN / SUPER_ADMIN endpoint accessed successfully.',
    user: req.user,
  });
}

export function testStudentAccess(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Authorized: STUDENT portal endpoint accessed successfully.',
    user: req.user,
  });
}

export function testRecruiterAccess(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Authorized: RECRUITER company portal endpoint accessed successfully.',
    user: req.user,
  });
}
