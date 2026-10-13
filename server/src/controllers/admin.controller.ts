import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ApplicationStatus, CompanyVerificationStatus, OpportunityStatus, PlacementStatus, Prisma, UserRole } from '@prisma/client';

// ==========================================
// 1. ADMIN DASHBOARD & OVERVIEW STATS
// ==========================================

export async function getAdminOverviewStats(_req: Request, res: Response): Promise<void> {
  try {
    const [
      totalUsers,
      studentUsers,
      recruiterUsers,
      adminUsers,
      totalCompanies,
      verifiedCompanies,
      pendingCompanies,
      totalJobs,
      activeJobs,
      totalInternships,
      activeInternships,
      totalApplications,
      shortlistedApps,
      selectedApps,
      hiredApps,
      totalInterviews,
      totalOffers,
      acceptedOffers,
      totalPlacements,
      joinedPlacements,
      placementSalaryAgg,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.user.count({ where: { role: UserRole.RECRUITER } }),
      prisma.user.count({ where: { role: { in: [UserRole.PLACEMENT_ADMIN, UserRole.SUPER_ADMIN] } } }),
      prisma.company.count(),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.VERIFIED } }),
      prisma.company.count({ where: { verificationStatus: CompanyVerificationStatus.PENDING } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: OpportunityStatus.PUBLISHED } }),
      prisma.internship.count(),
      prisma.internship.count({ where: { status: OpportunityStatus.PUBLISHED } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: ApplicationStatus.SHORTLISTED } }),
      prisma.application.count({ where: { status: ApplicationStatus.SELECTED } }),
      prisma.application.count({ where: { status: ApplicationStatus.HIRED_PLACED } }),
      prisma.interview.count(),
      prisma.offer.count(),
      prisma.offer.count({ where: { status: 'ACCEPTED' } }),
      prisma.placement.count(),
      prisma.placement.count({ where: { status: PlacementStatus.JOINED } }),
      prisma.placement.aggregate({
        _avg: { packageAmount: true },
        _max: { packageAmount: true },
        _sum: { packageAmount: true },
      }),
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, role: true } },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: studentUsers,
          recruiters: recruiterUsers,
          administrators: adminUsers,
        },
        companies: {
          total: totalCompanies,
          verified: verifiedCompanies,
          pending: pendingCompanies,
        },
        opportunities: {
          total: totalJobs + totalInternships,
          jobs: totalJobs,
          activeJobs,
          internships: totalInternships,
          activeInternships,
        },
        applications: {
          total: totalApplications,
          shortlisted: shortlistedApps,
          selected: selectedApps,
          hired: hiredApps,
        },
        recruitment: {
          interviews: totalInterviews,
          offers: totalOffers,
          acceptedOffers,
        },
        placements: {
          total: totalPlacements,
          totalPlacements,
          joined: joinedPlacements,
          averagePackage: placementSalaryAgg._avg.packageAmount ? Number(placementSalaryAgg._avg.packageAmount) : 0,
          highestPackage: placementSalaryAgg._max.packageAmount ? Number(placementSalaryAgg._max.packageAmount) : 0,
          totalValue: placementSalaryAgg._sum.packageAmount ? Number(placementSalaryAgg._sum.packageAmount) : 0,
        },
        recentActivity: recentAuditLogs,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative statistics.',
      error: error.message,
    });
  }
}

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

export async function getUsersList(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;

    const { role, search, isActive } = req.query;

    const where: Prisma.UserWhereInput = {};

    if (role && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role as UserRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { email: { contains: q } },
        { student: { fullName: { contains: q } } },
        { student: { studentId: { contains: q } } },
        { recruiter: { fullName: { contains: q } } },
        { recruiter: { company: { name: { contains: q } } } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
              course: true,
              department: { select: { id: true, code: true, name: true } },
            },
          },
          recruiter: {
            select: {
              id: true,
              fullName: true,
              designation: true,
              company: { select: { id: true, name: true, verificationStatus: true } },
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users list.',
      error: error.message,
    });
  }
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.id as string, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID format.' });
      return;
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ success: false, message: 'isActive (boolean) is required.' });
      return;
    }

    // Protect self-deactivation for current user
    if (userId === req.user!.id) {
      res.status(400).json({
        success: false,
        message: 'Security protection: You cannot deactivate your own administrative account.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, role: true, isActive: true },
    });

    // Log action in audit trail
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER_STATUS',
        entity: 'User',
        entityId: String(userId),
        oldValues: JSON.stringify({ isActive: user.isActive }),
        newValues: JSON.stringify({ isActive }),
      },
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user account status.',
      error: error.message,
    });
  }
}

// ==========================================
// 3. DEPARTMENT MANAGEMENT
// ==========================================

export async function getDepartments(_req: Request, res: Response): Promise<void> {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments.',
      error: error.message,
    });
  }
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  try {
    const { name, code, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Department name is required.' });
      return;
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Department code is required.' });
      return;
    }

    const existing = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim() } },
          { code: { equals: code.trim().toUpperCase() } },
        ],
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A department with this name or code already exists.',
      });
      return;
    }

    const dept = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_DEPARTMENT',
        entity: 'Department',
        entityId: String(dept.id),
        newValues: JSON.stringify({ name: dept.name, code: dept.code }),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: dept,
    });
  } catch (error: any) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department.',
      error: error.message,
    });
  }
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  try {
    const departmentId = parseInt(req.params.id as string, 10);
    if (isNaN(departmentId)) {
      res.status(400).json({ success: false, message: 'Invalid department ID.' });
      return;
    }

    const { name, code, description, isActive } = req.body;

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (code) updateData.code = code.trim().toUpperCase();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.department.update({
      where: { id: departmentId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_DEPARTMENT',
        entity: 'Department',
        entityId: String(departmentId),
        oldValues: JSON.stringify({ name: department.name, code: department.code, isActive: department.isActive }),
        newValues: JSON.stringify(updateData),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department.',
      error: error.message,
    });
  }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  try {
    const departmentId = parseInt(req.params.id as string, 10);
    if (isNaN(departmentId)) {
      res.status(400).json({ success: false, message: 'Invalid department ID.' });
      return;
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: { select: { students: true } },
      },
    });

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found.' });
      return;
    }

    // Safe deletion: If students reference it, deactivate rather than hard delete
    if (department._count.students > 0) {
      const deactivated = await prisma.department.update({
        where: { id: departmentId },
        data: { isActive: false },
      });

      res.status(200).json({
        success: true,
        message: `Department has ${department._count.students} registered student(s); safely deactivated instead of deleting.`,
        data: deactivated,
      });
      return;
    }

    await prisma.department.delete({
      where: { id: departmentId },
    });

    res.status(200).json({
      success: true,
      message: 'Department removed successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department.',
      error: error.message,
    });
  }
}

// ==========================================
// 4. AUDIT LOGS
// ==========================================

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { action, entity, search, startDate, endDate } = req.query;

    const where: Prisma.AuditLogWhereInput = {};

    if (action && typeof action === 'string' && action.trim() !== '') {
      where.action = { contains: action.trim() };
    }

    if (entity && typeof entity === 'string' && entity.trim() !== '') {
      where.entity = { contains: entity.trim() };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { action: { contains: q } },
        { entity: { contains: q } },
        { entityId: { contains: q } },
        { user: { email: { contains: q } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, role: true } },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system audit logs.',
      error: error.message,
    });
  }
}

// ==========================================
// 5. SYSTEM SETTINGS
// ==========================================

export async function getSystemSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { group: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system configuration settings.',
      error: error.message,
    });
  }
}

export async function updateSystemSettings(req: Request, res: Response): Promise<void> {
  try {
    const { settings } = req.body; // Array of { key, value, description, group }
    if (!Array.isArray(settings)) {
      res.status(400).json({ success: false, message: 'Settings array is required.' });
      return;
    }

    const upsertPromises = settings.map((s) => {
      if (!s.key || typeof s.key !== 'string') return Promise.resolve(null);
      return prisma.systemSetting.upsert({
        where: { key: s.key },
        create: {
          key: s.key,
          value: String(s.value ?? ''),
          group: s.group || 'GENERAL',
          description: s.description || null,
        },
        update: {
          value: String(s.value ?? ''),
          description: s.description !== undefined ? s.description : undefined,
        },
      });
    });

    await Promise.all(upsertPromises);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        entity: 'SystemSetting',
        entityId: 'GLOBAL',
        newValues: JSON.stringify(settings),
      },
    });

    const allSettings = await prisma.systemSetting.findMany({
      orderBy: { group: 'asc' },
    });

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      data: allSettings,
    });
  } catch (error: any) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings.',
      error: error.message,
    });
  }
}
