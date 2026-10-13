import { prisma } from '../config/database.js';

async function verifyDatabase() {
  console.log('🔍 Starting comprehensive NexHire Database Architecture Verification...\n');

  // 1. Table Counts & Presence
  const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`
    SELECT table_name as tableName 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE()
    ORDER BY table_name ASC
  `;

  console.log(`📦 Database Engine: MySQL | Total Tables Found: ${tables.length}`);
  const tableNames = tables.map((t) => t.tableName);

  // 2. Count Records Across Major Entities
  console.log('\n📊 Record Counts Across Major Entities:');
  const counts = {
    users: await prisma.user.count(),
    departments: await prisma.department.count(),
    students: await prisma.student.count(),
    academicRecords: await prisma.studentAcademicRecord.count(),
    skills: await prisma.skill.count(),
    studentSkills: await prisma.studentSkill.count(),
    companies: await prisma.company.count(),
    recruiters: await prisma.recruiter.count(),
    jobs: await prisma.job.count(),
    internships: await prisma.internship.count(),
    eligibilityCriteria: await prisma.eligibilityCriteria.count(),
    applications: await prisma.application.count(),
    applicationStatusHistories: await prisma.applicationStatusHistory.count(),
    interviewRounds: await prisma.interviewRound.count(),
    interviews: await prisma.interview.count(),
    documents: await prisma.document.count(),
    notifications: await prisma.notification.count(),
    savedOpportunities: await prisma.savedOpportunity.count(),
    auditLogs: await prisma.auditLog.count(),
    systemSettings: await prisma.systemSetting.count(),
  };

  console.table(counts);

  // 3. Test Deep Relational Traversal
  console.log('\n🔗 Testing Deep Relational Query (Student -> Department -> Applications -> Job -> Company -> Interviews -> Status History):');
  const sampleStudent = await prisma.student.findFirst({
    include: {
      user: { select: { email: true, role: true } },
      department: { select: { code: true, name: true } },
      academicRecords: true,
      skills: {
        include: {
          skill: true,
        },
      },
      applications: {
        include: {
          job: {
            include: {
              company: true,
              eligibilityCriteria: true,
              interviewRounds: true,
            },
          },
          internship: {
            include: {
              company: true,
              eligibilityCriteria: true,
              interviewRounds: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          interviews: true,
        },
      },
      savedOpportunities: {
        include: {
          internship: true,
        },
      },
      documents: true,
    },
  });

  if (!sampleStudent) {
    throw new Error('Verification failed: No sample student found');
  }

  console.log(`  ✅ Student: ${sampleStudent.fullName} (${sampleStudent.studentId})`);
  console.log(`  ✅ Linked User: ${sampleStudent.user.email} [Role: ${sampleStudent.user.role}]`);
  console.log(`  ✅ Department: ${sampleStudent.department.name} (${sampleStudent.department.code})`);
  console.log(`  ✅ Academic Records: ${sampleStudent.academicRecords.length} records`);
  console.log(`  ✅ Verified Skills: ${sampleStudent.skills.map((s) => s.skill.name).join(', ')}`);
  console.log(`  ✅ Applications: ${sampleStudent.applications.length} submitted`);
  if (sampleStudent.applications.length > 0) {
    const app = sampleStudent.applications[0];
    const targetTitle = app.job?.title || app.internship?.title || 'Unknown Opportunity';
    const targetCompany = app.job?.company.name || app.internship?.company.name || 'Unknown Company';
    console.log(`     - Applied to: ${targetTitle} at ${targetCompany}`);
    console.log(`     - Current Status: ${app.status}`);
    console.log(`     - Status History Steps: ${app.statusHistory.length} recorded`);
    console.log(`     - Scheduled Interviews: ${app.interviews.length}`);
  }
  console.log(`  ✅ Bookmarked Opportunities: ${sampleStudent.savedOpportunities.length}`);
  console.log(`  ✅ Documents Attached: ${sampleStudent.documents.length}`);

  // 4. Test Unique Constraint Validation (Prevent duplicate application)
  console.log('\n🛡️  Testing Unique Constraint: Duplicate application prevention...');
  if (sampleStudent.applications.length > 0) {
    const existingApp = sampleStudent.applications[0];
    let caughtDuplicate = false;
    try {
      await prisma.application.create({
        data: {
          studentId: sampleStudent.id,
          opportunityType: existingApp.opportunityType,
          jobId: existingApp.jobId,
          internshipId: existingApp.internshipId,
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
        caughtDuplicate = true;
        console.log('  ✅ Unique constraint successfully prevented duplicate application (Prisma P2002).');
      } else {
        throw err;
      }
    }

    if (!caughtDuplicate) {
      throw new Error('Verification failed: Duplicate application was NOT blocked by unique constraint!');
    }
  }

  console.log('\n🎉 ALL DATABASE ARCHITECTURE VERIFICATIONS PASSED SUCCESSFULLY!');
}

verifyDatabase()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
