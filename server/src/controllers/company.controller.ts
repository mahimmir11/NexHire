import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { storageService } from '../services/storage.service.js';
import { hashPassword } from '../utils/security.utils.js';
import { calculateCompanyProfileCompletion } from '../utils/company.utils.js';
import {
  validateCompanyProfileUpdate,
  validateRecruiterCreation,
  validateRecruiterUpdate,
  validateCompanyVerification,
} from '../validations/company.validation.js';
import { CompanyVerificationStatus, RecruiterAccountStatus, UserRole } from '@prisma/client';

/**
 * Helper: Derive the authenticated recruiter and their authorized company.
 * Strictly prevents arbitrary company access.
 */
async function getAuthenticatedRecruiterAndCompany(userId: number) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId },
    include: {
      company: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  return recruiter;
}

// ==========================================
// 1. RECRUITER: COMPANY PROFILE
// ==========================================

export async function getCurrentCompanyProfile(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiterAndCompany(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({
        success: false,
        message: 'No associated company profile found for this recruiter account.',
      });
      return;
    }

    const company = recruiter.company;
    const completion = calculateCompanyProfileCompletion(company);

    res.json({
      success: true,
      data: {
        ...company,
        completion,
        currentRecruiter: {
          id: recruiter.id,
          fullName: recruiter.fullName,
          designation: recruiter.designation,
          email: recruiter.email,
          phone: recruiter.phone,
          accountStatus: recruiter.accountStatus,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company profile.' });
  }
}

export async function updateCurrentCompanyProfile(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiterAndCompany(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({
        success: false,
        message: 'No associated company profile found for this recruiter account.',
      });
      return;
    }

    const errors = validateCompanyProfileUpdate(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const {
      name,
      industry,
      website,
      description,
      headquarters,
      locations,
      companySize,
      contactEmail,
      contactPhone,
      logoUrl,
    } = req.body;

    // Check if name is being changed and unique constraint
    if (name && name.trim() !== recruiter.company.name) {
      const existing = await prisma.company.findUnique({
        where: { name: String(name).trim() },
      });
      if (existing && existing.id !== recruiter.company.id) {
        res.status(409).json({
          success: false,
          message: 'Another company is already registered with this name.',
        });
        return;
      }
    }

    const updated = await prisma.company.update({
      where: { id: recruiter.company.id },
      data: {
        ...(name ? { name: String(name).trim() } : {}),
        ...(industry ? { industry: String(industry).trim() } : {}),
        website: website !== undefined ? (website ? String(website).trim() : null) : undefined,
        ...(description ? { description: String(description).trim() } : {}),
        ...(headquarters ? { headquarters: String(headquarters).trim() } : {}),
        locations: locations !== undefined ? (locations ? String(locations).trim() : null) : undefined,
        companySize: companySize !== undefined ? (companySize ? String(companySize).trim() : null) : undefined,
        ...(contactEmail ? { contactEmail: String(contactEmail).trim() } : {}),
        contactPhone: contactPhone !== undefined ? (contactPhone ? String(contactPhone).trim() : null) : undefined,
        logoUrl: logoUrl !== undefined ? (logoUrl ? String(logoUrl).trim() : null) : undefined,
      },
    });

    const completion = calculateCompanyProfileCompletion(updated);

    res.json({
      success: true,
      message: 'Company profile updated successfully.',
      data: {
        ...updated,
        completion,
      },
    });
  } catch (error: unknown) {
    console.error('Error updating company profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update company profile.' });
  }
}

export async function uploadCompanyLogo(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiterAndCompany(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({ success: false, message: 'Company profile not found.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No logo image file uploaded.' });
      return;
    }

    const savedFile = await storageService.saveFile(req.file, 'avatars');

    const updated = await prisma.company.update({
      where: { id: recruiter.company.id },
      data: { logoUrl: savedFile.fileUrl },
    });

    res.json({
      success: true,
      message: 'Company logo uploaded successfully.',
      logoUrl: updated.logoUrl,
    });
  } catch (error: unknown) {
    console.error('Error uploading company logo:', error);
    res.status(500).json({ success: false, message: 'Failed to upload company logo.' });
  }
}

// ==========================================
// 2. RECRUITER: TEAM MANAGEMENT
// ==========================================

export async function getCompanyRecruiters(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiterAndCompany(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({ success: false, message: 'Company profile not found.' });
      return;
    }

    const recruiters = await prisma.recruiter.findMany({
      where: { companyId: recruiter.company.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: recruiters.map((r) => ({
        id: r.id,
        userId: r.userId,
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        designation: r.designation,
        accountStatus: r.accountStatus,
        createdAt: r.createdAt,
        lastLoginAt: r.user.lastLoginAt,
        isActive: r.user.isActive,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching company recruiters:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve recruiters list.' });
  }
}

export async function addCompanyRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const currentRecruiter = await getAuthenticatedRecruiterAndCompany(req.user!.id);
    if (!currentRecruiter || !currentRecruiter.company) {
      res.status(404).json({ success: false, message: 'Company profile not found.' });
      return;
    }

    const errors = validateRecruiterCreation(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { fullName, email, designation, phone, accountStatus, password } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();

    // Check if email already registered in system
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'A user account with this email address already exists in the system.',
      });
      return;
    }

    // Default password or supplied
    const initialPlainPassword = password ? String(password) : 'NexHire@2026!';
    const passwordHash = await hashPassword(initialPlainPassword);

    // Create User & Recruiter in transaction
    const newRecruiter = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: UserRole.RECRUITER,
          isActive: true,
          emailVerified: true,
        },
      });

      const rec = await tx.recruiter.create({
        data: {
          userId: user.id,
          companyId: currentRecruiter.company.id,
          fullName: String(fullName).trim(),
          email: cleanEmail,
          phone: phone ? String(phone).trim() : null,
          designation: String(designation).trim(),
          accountStatus: (accountStatus as RecruiterAccountStatus) || RecruiterAccountStatus.ACTIVE,
        },
      });

      return rec;
    });

    res.status(201).json({
      success: true,
      message: 'Recruiter added to company successfully.',
      data: newRecruiter,
    });
  } catch (error: unknown) {
    console.error('Error adding recruiter:', error);
    res.status(500).json({ success: false, message: 'Failed to add recruiter.' });
  }
}

export async function updateCompanyRecruiter(req: Request, res: Response): Promise<void> {
  try {
    const currentRecruiter = await getAuthenticatedRecruiterAndCompany(req.user!.id);
    if (!currentRecruiter || !currentRecruiter.company) {
      res.status(404).json({ success: false, message: 'Company profile not found.' });
      return;
    }

    const recruiterId = parseInt(String(req.params.id), 10);
    if (isNaN(recruiterId)) {
      res.status(400).json({ success: false, message: 'Invalid recruiter ID.' });
      return;
    }

    // Strictly enforce multi-tenant isolation: target recruiter must belong to same company
    const targetRecruiter = await prisma.recruiter.findFirst({
      where: {
        id: recruiterId,
        companyId: currentRecruiter.company.id,
      },
    });

    if (!targetRecruiter) {
      res.status(404).json({
        success: false,
        message: 'Recruiter not found or access denied for this company.',
      });
      return;
    }

    const errors = validateRecruiterUpdate(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { fullName, designation, phone, accountStatus } = req.body;

    const updated = await prisma.recruiter.update({
      where: { id: recruiterId },
      data: {
        ...(fullName ? { fullName: String(fullName).trim() } : {}),
        ...(designation ? { designation: String(designation).trim() } : {}),
        phone: phone !== undefined ? (phone ? String(phone).trim() : null) : undefined,
        ...(accountStatus ? { accountStatus: accountStatus as RecruiterAccountStatus } : {}),
      },
    });

    res.json({
      success: true,
      message: 'Recruiter details updated successfully.',
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error updating recruiter:', error);
    res.status(500).json({ success: false, message: 'Failed to update recruiter details.' });
  }
}

// ==========================================
// 3. RECRUITER: DASHBOARD FOUNDATION
// ==========================================

export async function getCompanyDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const recruiter = await getAuthenticatedRecruiterAndCompany(req.user!.id);
    if (!recruiter || !recruiter.company) {
      res.status(404).json({ success: false, message: 'Company profile not found.' });
      return;
    }

    const company = recruiter.company;
    const completion = calculateCompanyProfileCompletion(company);

    // Parallel fetch of real database metrics
    const [
      recruitersCount,
      activeJobsCount,
      activeInternshipsCount,
      applicationsCount,
      interviewsCount,
      offersCount,
      recentRecruiters,
    ] = await Promise.all([
      prisma.recruiter.count({ where: { companyId: company.id } }),
      prisma.job.count({ where: { companyId: company.id, status: 'PUBLISHED' } }),
      prisma.internship.count({ where: { companyId: company.id, status: 'PUBLISHED' } }),
      prisma.application.count({
        where: {
          OR: [
            { job: { companyId: company.id } },
            { internship: { companyId: company.id } },
          ],
        },
      }),
      prisma.interview.count({ where: { companyId: company.id } }),
      prisma.offer.count({ where: { companyId: company.id } }),
      prisma.recruiter.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: {
          id: true,
          fullName: true,
          designation: true,
          email: true,
          accountStatus: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          logoUrl: company.logoUrl,
          industry: company.industry,
          website: company.website,
          description: company.description,
          headquarters: company.headquarters,
          locations: company.locations,
          companySize: company.companySize,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          verificationStatus: company.verificationStatus,
          isActive: company.isActive,
        },
        currentRecruiter: {
          id: recruiter.id,
          fullName: recruiter.fullName,
          designation: recruiter.designation,
          email: recruiter.email,
        },
        completion,
        stats: {
          recruitersCount,
          activeJobsCount,
          activeInternshipsCount,
          applicationsCount,
          interviewsCount,
          offersCount,
        },
        recentRecruiters,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching recruiter dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company dashboard.' });
  }
}

// ==========================================
// 4. ADMINISTRATION: PLACEMENT & SUPER ADMIN
// ==========================================

export async function getAllCompanies(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query;

    const whereClause: Record<string, unknown> = {};

    if (status && Object.values(CompanyVerificationStatus).includes(status as CompanyVerificationStatus)) {
      whereClause.verificationStatus = status as CompanyVerificationStatus;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { name: { contains: search.trim() } },
        { industry: { contains: search.trim() } },
        { headquarters: { contains: search.trim() } },
      ];
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            recruiters: true,
            jobs: true,
            internships: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: companies.map((c) => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logoUrl,
        industry: c.industry,
        website: c.website,
        headquarters: c.headquarters,
        companySize: c.companySize,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone,
        verificationStatus: c.verificationStatus,
        isActive: c.isActive,
        createdAt: c.createdAt,
        recruitersCount: c._count.recruiters,
        drivesCount: c._count.jobs + c._count.internships,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching companies list:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve companies list.' });
  }
}

export async function getPendingCompanies(_req: Request, res: Response): Promise<void> {
  try {
    const pendingCompanies = await prisma.company.findMany({
      where: { verificationStatus: CompanyVerificationStatus.PENDING },
      include: {
        recruiters: {
          select: {
            id: true,
            fullName: true,
            email: true,
            designation: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: pendingCompanies,
    });
  } catch (error: unknown) {
    console.error('Error fetching pending companies:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve pending companies.' });
  }
}

export async function getCompanyDetailsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(String(req.params.id), 10);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID.' });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        recruiters: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                isActive: true,
                lastLoginAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            jobs: true,
            internships: true,
            offers: true,
          },
        },
      },
    });

    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error: unknown) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve company details.' });
  }
}

export async function verifyCompany(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(String(req.params.id), 10);
    if (isNaN(companyId)) {
      res.status(400).json({ success: false, message: 'Invalid company ID.' });
      return;
    }

    const errors = validateCompanyVerification(req.body);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    const { status, notes } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        verificationStatus: status as CompanyVerificationStatus,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: `COMPANY_VERIFICATION_${status}`,
        entity: 'Company',
        entityId: String(companyId),
        oldValues: JSON.stringify({ verificationStatus: company.verificationStatus }),
        newValues: JSON.stringify({ verificationStatus: status, notes: notes || null }),
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'NexHire-Admin-Portal',
      },
    });

    res.json({
      success: true,
      message: `Company verification status updated to ${status}.`,
      data: updated,
    });
  } catch (error: unknown) {
    console.error('Error verifying company:', error);
    res.status(500).json({ success: false, message: 'Failed to update company verification status.' });
  }
}
