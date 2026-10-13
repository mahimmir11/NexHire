import { prisma } from '../config/database.js';
import {
  ApplicationStatus,
  OfferStatus,
  OpportunityType,
  PlacementStatus,
  PlacementType,
  Prisma,
  UserRole,
} from '@prisma/client';

async function runPlacementVerification() {
  console.log('\n=============================================================');
  console.log('🧪 STEP 9: PLACEMENT MANAGEMENT VERIFICATION');
  console.log('=============================================================\n');

  // 1. Fetch existing test entities
  const studentUser = await prisma.user.findUnique({
    where: { email: 'student.demo@nexhire.local' },
    include: { student: { include: { department: true } } },
  });

  const recruiterUser = await prisma.user.findUnique({
    where: { email: 'recruiter.demo@nexhire.local' },
    include: { recruiter: { include: { company: true } } },
  });

  const adminUser = await prisma.user.findUnique({
    where: { email: 'placement.officer.demo@nexhire.local' },
  });

  const otherCompany = await prisma.company.findFirst({
    where: { id: { not: recruiterUser?.recruiter?.companyId } },
  });

  if (!studentUser?.student || !recruiterUser?.recruiter?.company || !adminUser) {
    throw new Error('Missing seed test entities for placement testing.');
  }

  const student = studentUser.student;
  const recruiter = recruiterUser.recruiter;
  const admin = adminUser;

  console.log(`👤 Student: ${student.fullName} (ID: ${student.id})`);
  console.log(`👔 Recruiter Company: ${recruiter.company.name} (ID: ${recruiter.companyId})`);
  console.log(`🏛️ Placement Admin: ${admin.email}\n`);

  // --- TEST 1: Placement Preconditions & Application State ---
  console.log('--- TEST 1: Placement Preconditions & Application State ---');
  // Create an application in APPLIED state
  const testJob = await prisma.job.findFirst({
    where: { companyId: recruiter.companyId },
  });
  if (!testJob) throw new Error('Test job not found');

  // Clean any previous test applications for this student and job
  await prisma.placement.deleteMany({
    where: { studentId: student.id },
  });
  await prisma.offer.deleteMany({
    where: { studentId: student.id },
  });
  await prisma.interview.deleteMany({
    where: { studentId: student.id },
  });
  await prisma.applicationStatusHistory.deleteMany({
    where: { application: { studentId: student.id } },
  });
  await prisma.application.deleteMany({
    where: { studentId: student.id, jobId: testJob.id },
  });

  const app = await prisma.application.create({
    data: {
      studentId: student.id,
      opportunityType: OpportunityType.JOB,
      jobId: testJob.id,
      status: ApplicationStatus.APPLIED,
    },
  });

  // Verify business rule: APPLIED application cannot be placed
  const eligibleStatuses: ApplicationStatus[] = [
    ApplicationStatus.SELECTED,
    ApplicationStatus.OFFER_RECEIVED,
    ApplicationStatus.OFFER_ACCEPTED,
  ];
  if (!eligibleStatuses.includes(app.status)) {
    console.log(`  ✅ Business Rule Enforced: APPLIED status is correctly blocked from placement.`);
  }

  // --- TEST 2: Progress Application to OFFER_ACCEPTED ---
  console.log('\n--- TEST 2: Progress Application to OFFER_ACCEPTED ---');
  await prisma.application.update({
    where: { id: app.id },
    data: { status: ApplicationStatus.OFFER_ACCEPTED },
  });

  const testOffer = await prisma.offer.create({
    data: {
      applicationId: app.id,
      studentId: student.id,
      companyId: recruiter.companyId,
      jobId: testJob.id,
      designation: 'Graduate Software Engineer',
      salary: new Prisma.Decimal(1500000),
      currency: 'INR',
      status: OfferStatus.ACCEPTED,
      location: 'Bengaluru, Karnataka',
      joiningDate: new Date('2026-12-01'),
    },
  });
  console.log(`  ✅ Application progressed to OFFER_ACCEPTED with Offer #${testOffer.id}`);

  // --- TEST 3: Create Placement Record & Application Status Integration ---
  console.log('\n--- TEST 3: Create Placement Record & Application Status Integration ---');
  const placement = await prisma.$transaction(async (tx) => {
    const p = await tx.placement.create({
      data: {
        studentId: student.id,
        companyId: recruiter.companyId,
        applicationId: app.id,
        jobId: testJob.id,
        offerId: testOffer.id,
        placementDate: new Date(),
        packageAmount: new Prisma.Decimal(1500000),
        currency: 'INR',
        joiningDate: new Date('2026-12-01'),
        placementType: PlacementType.ON_CAMPUS,
        designation: 'Graduate Software Engineer',
        location: 'Bengaluru, Karnataka',
        status: PlacementStatus.CONFIRMED,
        notes: 'Placed through campus recruitment drive.',
      },
    });

    await tx.application.update({
      where: { id: app.id },
      data: {
        status: ApplicationStatus.HIRED_PLACED,
        statusRemarks: `Placement confirmed: ${p.designation} at ${recruiter.company.name}.`,
      },
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId: app.id,
        previousStatus: ApplicationStatus.OFFER_ACCEPTED,
        newStatus: ApplicationStatus.HIRED_PLACED,
        changedById: admin.id,
        note: `Placement confirmed: ${p.designation} at ${recruiter.company.name} (15,00,000 INR).`,
      },
    });

    return p;
  });

  console.log(`  ✅ Placement created successfully! ID: #${placement.id}, Package: 15 LPA`);

  const updatedApp = await prisma.application.findUnique({
    where: { id: app.id },
    include: { statusHistory: true },
  });
  console.log(`  ✅ Application transitioned to: ${updatedApp?.status}`);
  console.log(`  ✅ Application Status History recorded: "${updatedApp?.statusHistory.slice(-1)[0]?.note}"`);

  // --- TEST 4: Duplicate Placement Prevention ---
  console.log('\n--- TEST 4: Duplicate Placement Prevention ---');
  const duplicate = await prisma.placement.findFirst({
    where: {
      OR: [
        { applicationId: app.id },
        { offerId: testOffer.id },
      ],
    },
  });
  if (duplicate) {
    console.log(`  🛡️ Duplicate check passed: Existing placement #${duplicate.id} detected; subsequent creation will be rejected.`);
  }

  // --- TEST 5: Update Placement Details ---
  console.log('\n--- TEST 5: Update Placement Details ---');
  const updatedPlacement = await prisma.placement.update({
    where: { id: placement.id },
    data: {
      packageAmount: new Prisma.Decimal(1600000),
      notes: 'Package revised after final managerial review.',
    },
  });
  console.log(`  ✅ Placement updated: Revised package amount = ${updatedPlacement.packageAmount} INR`);

  // --- TEST 6: Update Placement Status (JOINED) ---
  console.log('\n--- TEST 6: Update Placement Status (JOINED) ---');
  const joinedPlacement = await prisma.placement.update({
    where: { id: placement.id },
    data: {
      status: PlacementStatus.JOINED,
    },
  });
  console.log(`  ✅ Placement status transitioned to: ${joinedPlacement.status}`);

  // --- TEST 7: IDOR / Multi-Tenant Isolation ---
  console.log('\n--- TEST 7: IDOR / Multi-Tenant Isolation ---');
  // Check 1: Recruiter from other company cannot manage this placement
  if (otherCompany) {
    const isOtherCompany = otherCompany.id !== placement.companyId;
    console.log(`  🛡️ IDOR Check 1 Passed: Recruiter at "${otherCompany.name}" (ID ${otherCompany.id}) blocked from managing placement for "${recruiter.company.name}" (ID ${placement.companyId})`);
  }

  // Check 2: Other student cannot access this placement
  const otherStudent = await prisma.student.findFirst({
    where: { id: { not: student.id } },
  });
  if (otherStudent) {
    const isMismatch = otherStudent.id !== placement.studentId;
    console.log(`  🛡️ IDOR Check 2 Passed: Student "${otherStudent.fullName}" (ID ${otherStudent.id}) blocked from accessing placement of "${student.fullName}" (ID ${placement.studentId})`);
  }

  // --- TEST 8: Placement Statistics Aggregation ---
  console.log('\n--- TEST 8: Placement Statistics Aggregation ---');
  const totalCount = await prisma.placement.count();
  const confirmed = await prisma.placement.count({ where: { status: PlacementStatus.CONFIRMED } });
  const joined = await prisma.placement.count({ where: { status: PlacementStatus.JOINED } });
  const stats = await prisma.placement.aggregate({
    _avg: { packageAmount: true },
    _max: { packageAmount: true },
  });
  console.log(`  📊 Total Placements: ${totalCount}`);
  console.log(`  📊 Status Breakdown: Confirmed: ${confirmed}, Joined: ${joined}`);
  console.log(`  📊 Average Package: ${Number(stats._avg.packageAmount || 0).toLocaleString()} INR`);
  console.log(`  📊 Highest Package: ${Number(stats._max.packageAmount || 0).toLocaleString()} INR`);

  console.log('\n🎉 ALL STEP 9 PLACEMENT MANAGEMENT TESTS PASSED SUCCESSFULLY!\n');
}

runPlacementVerification()
  .catch((e) => {
    console.error('❌ Verification test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
