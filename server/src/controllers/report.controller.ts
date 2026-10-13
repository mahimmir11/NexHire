import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { ApplicationStatus, PlacementStatus, Prisma } from '@prisma/client';

// ==========================================
// 1. ADVANCED ANALYTICS SUMMARY
// ==========================================

export async function getAnalyticsSummary(req: Request, res: Response): Promise<void> {
  try {
    const { departmentId, companyId, startDate, endDate } = req.query;

    const appWhere: Prisma.ApplicationWhereInput = {};
    const placementWhere: Prisma.PlacementWhereInput = {};

    if (departmentId) {
      const deptId = parseInt(departmentId as string, 10);
      if (!isNaN(deptId)) {
        appWhere.student = { departmentId: deptId };
        placementWhere.student = { departmentId: deptId };
      }
    }

    if (companyId) {
      const cId = parseInt(companyId as string, 10);
      if (!isNaN(cId)) {
        appWhere.OR = [
          { job: { companyId: cId } },
          { internship: { companyId: cId } },
        ];
        placementWhere.companyId = cId;
      }
    }

    if (startDate || endDate) {
      appWhere.appliedAt = {};
      placementWhere.placementDate = {};
      if (startDate) {
        appWhere.appliedAt.gte = new Date(startDate as string);
        placementWhere.placementDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        appWhere.appliedAt.lte = new Date(endDate as string);
        placementWhere.placementDate.lte = new Date(endDate as string);
      }
    }

    const [
      allApplications,
      allPlacements,
      departments,
      allCompanies,
      allOffers,
    ] = await Promise.all([
      prisma.application.findMany({
        where: appWhere,
        select: { status: true, appliedAt: true },
      }),
      prisma.placement.findMany({
        where: placementWhere,
        select: {
          packageAmount: true,
          placementType: true,
          status: true,
          placementDate: true,
          company: { select: { id: true, name: true } },
          student: {
            select: {
              department: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
      }),
      prisma.company.findMany({
        select: { id: true, name: true },
      }),
      prisma.offer.findMany({
        select: { status: true, salary: true },
      }),
    ]);

    // 1. Application Funnel Breakdown
    const statusCounts: Record<string, number> = {};
    for (const app of allApplications) {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    }

    // 2. Placements by Department
    const deptPlacementMap = new Map<string, { code: string; name: string; count: number; totalPackage: number }>();
    for (const d of departments) {
      deptPlacementMap.set(d.code, { code: d.code, name: d.name, count: 0, totalPackage: 0 });
    }
    for (const p of allPlacements) {
      const code = p.student.department?.code || 'OTHER';
      const name = p.student.department?.name || 'Other Department';
      const existing = deptPlacementMap.get(code) || { code, name, count: 0, totalPackage: 0 };
      existing.count += 1;
      existing.totalPackage += Number(p.packageAmount || 0);
      deptPlacementMap.set(code, existing);
    }
    const placementsByDepartment = Array.from(deptPlacementMap.values()).map((d) => ({
      ...d,
      avgPackage: d.count > 0 ? Math.round(d.totalPackage / d.count) : 0,
    }));

    // 3. Top Hiring Companies
    const companyHiresMap = new Map<number, { id: number; name: string; hires: number }>();
    for (const p of allPlacements) {
      const cId = p.company.id;
      const cName = p.company.name;
      const existing = companyHiresMap.get(cId) || { id: cId, name: cName, hires: 0 };
      existing.hires += 1;
      companyHiresMap.set(cId, existing);
    }
    const topHiringCompanies = Array.from(companyHiresMap.values())
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 7);

    // 4. CTC Package Distribution Ranges
    const salaryDistribution = {
      under6LPA: 0,
      between6and10LPA: 0,
      between10and15LPA: 0,
      above15LPA: 0,
    };
    for (const p of allPlacements) {
      const pkg = Number(p.packageAmount || 0);
      if (pkg < 600000) salaryDistribution.under6LPA += 1;
      else if (pkg <= 1000000) salaryDistribution.between6and10LPA += 1;
      else if (pkg <= 1500000) salaryDistribution.between10and15LPA += 1;
      else salaryDistribution.above15LPA += 1;
    }

    // 5. Offer Outcomes
    const offerStats = {
      total: allOffers.length,
      accepted: allOffers.filter((o) => o.status === 'ACCEPTED').length,
      rejected: allOffers.filter((o) => o.status === 'REJECTED').length,
      pending: allOffers.filter((o) => o.status === 'OFFERED').length,
    };

    res.status(200).json({
      success: true,
      data: {
        totalApplications: allApplications.length,
        applicationStatusBreakdown: statusCounts,
        totalPlacements: allPlacements.length,
        placementsByDepartment,
        topHiringCompanies,
        salaryDistribution,
        offerStats,
      },
    });
  } catch (error: any) {
    console.error('Error getting analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compute analytics summary.',
      error: error.message,
    });
  }
}

// ==========================================
// 2. REPORT GENERATOR
// ==========================================

export async function getReportData(req: Request, res: Response): Promise<void> {
  try {
    const reportType = (req.query.reportType as string) || 'placements';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    if (reportType === 'placements') {
      const where: Prisma.PlacementWhereInput = {};
      if (req.query.status) where.status = req.query.status as any;
      if (req.query.placementType) where.placementType = req.query.placementType as any;
      if (search) {
        where.OR = [
          { designation: { contains: search } },
          { company: { name: { contains: search } } },
          { student: { fullName: { contains: search } } },
          { student: { studentId: { contains: search } } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.placement.count({ where }),
        prisma.placement.findMany({
          where,
          skip,
          take: limit,
          orderBy: { placementDate: 'desc' },
          include: {
            student: { include: { department: true } },
            company: true,
            job: true,
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          reportType: 'placements',
          items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        },
      });
      return;
    }

    if (reportType === 'applications') {
      const where: Prisma.ApplicationWhereInput = {};
      if (req.query.status) where.status = req.query.status as any;
      if (search) {
        where.OR = [
          { student: { fullName: { contains: search } } },
          { student: { studentId: { contains: search } } },
          { job: { title: { contains: search } } },
          { internship: { title: { contains: search } } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
          where,
          skip,
          take: limit,
          orderBy: { appliedAt: 'desc' },
          include: {
            student: { include: { department: true } },
            job: { include: { company: true } },
            internship: { include: { company: true } },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          reportType: 'applications',
          items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        },
      });
      return;
    }

    if (reportType === 'interviews') {
      const where: Prisma.InterviewWhereInput = {};
      if (req.query.status) where.status = req.query.status as any;
      if (req.query.result) where.result = req.query.result as any;
      if (search) {
        where.OR = [
          { roundName: { contains: search } },
          { student: { fullName: { contains: search } } },
          { company: { name: { contains: search } } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.interview.count({ where }),
        prisma.interview.findMany({
          where,
          skip,
          take: limit,
          orderBy: { interviewDate: 'desc' },
          include: {
            student: { include: { department: true } },
            company: true,
            job: true,
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          reportType: 'interviews',
          items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        },
      });
      return;
    }

    if (reportType === 'offers') {
      const where: Prisma.OfferWhereInput = {};
      if (req.query.status) where.status = req.query.status as any;
      if (search) {
        where.OR = [
          { designation: { contains: search } },
          { student: { fullName: { contains: search } } },
          { company: { name: { contains: search } } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.offer.count({ where }),
        prisma.offer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { offerDate: 'desc' },
          include: {
            student: { include: { department: true } },
            company: true,
            job: true,
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          reportType: 'offers',
          items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: `Unsupported report type '${reportType}'. Supported: placements, applications, interviews, offers.`,
    });
  } catch (error: any) {
    console.error('Error generating report data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report data.',
      error: error.message,
    });
  }
}

// ==========================================
// 3. CSV EXPORT ENGINE
// ==========================================

export async function exportReportCsv(req: Request, res: Response): Promise<void> {
  try {
    const reportType = (req.query.reportType as string) || 'placements';
    const timestamp = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="NexHire_${reportType}_Report_${timestamp}.csv"`
    );

    if (reportType === 'placements') {
      const placements = await prisma.placement.findMany({
        orderBy: { placementDate: 'desc' },
        include: {
          student: { include: { department: true } },
          company: true,
          job: true,
        },
      });

      let csv = 'Placement ID,Student Name,Roll Number,Department,Company,Designation,Package (INR),Joining Date,Type,Status\n';
      for (const p of placements) {
        const row = [
          p.id,
          `"${p.student.fullName.replace(/"/g, '""')}"`,
          p.student.studentId,
          `"${p.student.department?.code || ''}"`,
          `"${p.company.name.replace(/"/g, '""')}"`,
          `"${p.designation.replace(/"/g, '""')}"`,
          p.packageAmount,
          p.joiningDate ? new Date(p.joiningDate).toISOString().split('T')[0] : 'TBD',
          p.placementType,
          p.status,
        ];
        csv += row.join(',') + '\n';
      }

      res.status(200).send(csv);
      return;
    }

    if (reportType === 'applications') {
      const applications = await prisma.application.findMany({
        orderBy: { appliedAt: 'desc' },
        include: {
          student: { include: { department: true } },
          job: { include: { company: true } },
          internship: { include: { company: true } },
        },
      });

      let csv = 'Application ID,Student Name,Roll Number,Department,Company,Opportunity Role,Type,Status,Applied Date\n';
      for (const a of applications) {
        const companyName = a.job?.company.name || a.internship?.company.name || 'N/A';
        const roleTitle = a.job?.title || a.internship?.title || 'N/A';
        const row = [
          a.id,
          `"${a.student.fullName.replace(/"/g, '""')}"`,
          a.student.studentId,
          `"${a.student.department?.code || ''}"`,
          `"${companyName.replace(/"/g, '""')}"`,
          `"${roleTitle.replace(/"/g, '""')}"`,
          a.opportunityType,
          a.status,
          new Date(a.appliedAt).toISOString().split('T')[0],
        ];
        csv += row.join(',') + '\n';
      }

      res.status(200).send(csv);
      return;
    }

    res.status(400).send('Unsupported report type for CSV export.');
  } catch (error: any) {
    console.error('Error generating CSV export:', error);
    res.status(500).send('Failed to generate export file.');
  }
}
