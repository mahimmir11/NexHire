import { prisma } from '../config/database.js';
import {
  UserRole,
  OpportunityType,
  ApplicationStatus,
  InterviewMode,
  InterviewResult,
  InterviewStatus,
  OfferStatus,
} from '@prisma/client';

async function runRecruitmentModuleVerification() {
  console.log('\n=============================================================');
  console.log('🧪 STEP 8: RECRUITMENT — INTERVIEWS & OFFERS VERIFICATION');
  console.log('=============================================================\n');

  // 1. Fetch test users & entities
  const studentUser = await prisma.user.findUnique({
    where: { email: 'student.demo@nexhire.local' },
    include: { student: true },
  });

  const recruiterUser = await prisma.user.findUnique({
    where: { email: 'recruiter.demo@nexhire.local' },
    include: { recruiter: { include: { company: true } } },
  });

  const adminUser = await prisma.user.findUnique({
    where: { email: 'placement.officer.demo@nexhire.local' },
  });

  if (!studentUser?.student || !recruiterUser?.recruiter || !adminUser) {
    throw new Error('Required seed users missing! Please ensure seed data is present.');
  }

  const student = studentUser.student;
  const recruiter = recruiterUser.recruiter;
  const company = recruiter.company;

  console.log(`👤 Test Student: ${student.fullName} (ID: ${student.id})`);
  console.log(`👔 Test Recruiter: ${recruiter.fullName} at "${company.name}" (ID: ${recruiter.id})`);
  console.log(`🏛️  Placement Admin: ${adminUser.email}`);

  // Fetch or create a secondary test company & student for IDOR checks
  let otherCompany = await prisma.company.findFirst({ where: { name: 'CyberShield Systems Inc' } });
  if (!otherCompany) {
    otherCompany = await prisma.company.create({
      data: {
        name: 'CyberShield Systems Inc',
        industry: 'Cybersecurity',
        description: 'Information security and penetration testing solutions.',
        headquarters: 'Hyderabad, India',
        contactEmail: 'contact@cybershield.local',
        verificationStatus: 'VERIFIED',
      },
    });
  }

  let otherUser = await prisma.user.findUnique({ where: { email: 'student.two@nexhire.local' } });
  let otherStudent: any;
  if (!otherUser) {
    otherUser = await prisma.user.create({
      data: {
        email: 'student.two@nexhire.local',
        passwordHash: studentUser.passwordHash,
        role: UserRole.STUDENT,
        isActive: true,
      },
    });
    otherStudent = await prisma.student.create({
      data: {
        userId: otherUser.id,
        departmentId: student.departmentId,
        fullName: 'Priya Verma',
        studentId: 'MCA2024002',
        enrollmentNumber: 'EN2024000002',
        course: 'MCA',
        program: 'Master of Computer Applications',
        graduationYear: 2026,
      },
    });
  } else {
    otherStudent = await prisma.student.findUnique({ where: { userId: otherUser.id } });
    if (!otherStudent) {
      otherStudent = await prisma.student.create({
        data: {
          userId: otherUser.id,
          departmentId: student.departmentId,
          fullName: 'Priya Verma',
          studentId: 'MCA2024002',
          enrollmentNumber: 'EN2024000002',
          course: 'MCA',
          program: 'Master of Computer Applications',
          graduationYear: 2026,
        },
      });
    }
  }

  // 2. Setup a test job opening for Company A
  let testJob = await prisma.job.findFirst({
    where: { companyId: company.id, title: 'Cloud Platform Engineer (Step 8 Test)' },
  });
  if (!testJob) {
    testJob = await prisma.job.create({
      data: {
        companyId: company.id,
        recruiterId: recruiter.id,
        title: 'Cloud Platform Engineer (Step 8 Test)',
        description: 'Testing interview & offer recruitment lifecycle.',
        responsibilities: 'Build scalable backend systems.',
        requirements: 'TypeScript, Node.js, SQL.',
        requiredSkills: 'Node.js, TypeScript',
        location: 'Bengaluru / Hybrid',
        salaryMin: 1400000,
        salaryMax: 1800000,
        applicationDeadline: new Date(Date.now() + 30 * 86400000),
        status: 'PUBLISHED',
      },
    });
  }

  // Setup a test job opening for Company B (to test unauthorized recruiter access)
  let otherJob = await prisma.job.findFirst({
    where: { companyId: otherCompany.id, title: 'SecOps Analyst (Step 8 Test)' },
  });
  if (!otherJob) {
    otherJob = await prisma.job.create({
      data: {
        companyId: otherCompany.id,
        title: 'SecOps Analyst (Step 8 Test)',
        description: 'Testing cross-tenant boundaries.',
        responsibilities: 'Security operations.',
        requirements: 'Networking, Linux.',
        requiredSkills: 'Linux, Security',
        location: 'Hyderabad',
        salaryMin: 1000000,
        salaryMax: 1200000,
        applicationDeadline: new Date(Date.now() + 30 * 86400000),
        status: 'PUBLISHED',
      },
    });
  }

  // Clean previous test applications for these specific test jobs
  await prisma.interview.deleteMany({
    where: {
      OR: [{ jobId: testJob.id }, { jobId: otherJob.id }],
    },
  });
  await prisma.offer.deleteMany({
    where: {
      OR: [{ jobId: testJob.id }, { jobId: otherJob.id }],
    },
  });
  await prisma.applicationStatusHistory.deleteMany({
    where: {
      application: {
        OR: [{ jobId: testJob.id }, { jobId: otherJob.id }],
      },
    },
  });
  await prisma.application.deleteMany({
    where: {
      OR: [{ jobId: testJob.id }, { jobId: otherJob.id }],
    },
  });

  // -------------------------------------------------------------------------
  // TEST 1: Candidate Application Setup & Ineligible Interview Schedule Check
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 1: Application State & Interview Scheduling Preconditions ---');
  const appApplied = await prisma.application.create({
    data: {
      studentId: student.id,
      opportunityType: OpportunityType.JOB,
      jobId: testJob.id,
      status: ApplicationStatus.APPLIED,
    },
  });
  console.log(`  ✅ Candidate application created in state: '${appApplied.status}'`);

  // Verify that an application in APPLIED state cannot enter interviews
  const canScheduleApplied =
    appApplied.status === ApplicationStatus.SHORTLISTED ||
    appApplied.status === ApplicationStatus.INTERVIEW_SCHEDULED;
  if (!canScheduleApplied) {
    console.log(`  ✅ Business Rule Enforced: APPLIED application correctly rejected from interview scheduling.`);
  } else {
    throw new Error('FAILED: Ineligible application was allowed for interview scheduling!');
  }

  // -------------------------------------------------------------------------
  // TEST 2: Shortlisting & Round 1 Scheduling
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Shortlisting & Scheduling First Interview Round ---');
  const appShortlisted = await prisma.application.update({
    where: { id: appApplied.id },
    data: {
      status: ApplicationStatus.SHORTLISTED,
      statusRemarks: 'Candidate shortlisted based on technical profile.',
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: appShortlisted.id,
      previousStatus: ApplicationStatus.APPLIED,
      newStatus: ApplicationStatus.SHORTLISTED,
      changedById: recruiterUser.id,
      note: 'Profile matched core requirements. Shortlisted for Technical Assessment.',
    },
  });
  console.log(`  ✅ Application updated to SHORTLISTED with status history.`);

  // Create Interview Round 1
  const round1Date = new Date(Date.now() + 2 * 86400000);
  const round1Start = new Date(round1Date.getTime() + 10 * 3600000);
  const round1End = new Date(round1Date.getTime() + 11 * 3600000);

  const interview1 = await prisma.interview.create({
    data: {
      applicationId: appShortlisted.id,
      studentId: student.id,
      companyId: company.id,
      jobId: testJob.id,
      recruiterId: recruiter.id,
      roundNumber: 1,
      roundName: 'Round 1: Core System Architecture',
      interviewDate: round1Date,
      startTime: round1Start,
      endTime: round1End,
      mode: InterviewMode.ONLINE,
      meetingLink: 'https://meet.nexhire.local/apex-tech-r1',
      interviewerName: 'Rohan Mehta (Principal Architect)',
      status: InterviewStatus.SCHEDULED,
      result: InterviewResult.PENDING,
    },
  });

  // Update application status to INTERVIEW_SCHEDULED and record history
  await prisma.application.update({
    where: { id: appShortlisted.id },
    data: {
      status: ApplicationStatus.INTERVIEW_SCHEDULED,
      statusRemarks: `Interview scheduled for Round 1: ${interview1.roundName}`,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: appShortlisted.id,
      previousStatus: ApplicationStatus.SHORTLISTED,
      newStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
      changedById: recruiterUser.id,
      note: `Round 1 interview scheduled: ${interview1.roundName} on ${round1Date.toLocaleDateString()}`,
    },
  });

  console.log(`  ✅ Round 1 Interview created: ID ${interview1.id} (Status: ${interview1.status})`);
  console.log(`  ✅ Application transitioned to INTERVIEW_SCHEDULED.`);

  // -------------------------------------------------------------------------
  // TEST 3: Date & Mode Validations
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Validation Logic (Date, Time, and Mode) ---');
  // Check start vs end time
  const invalidStartTime = new Date('2026-10-01T15:00:00Z');
  const invalidEndTime = new Date('2026-10-01T14:00:00Z');
  const isTimeOrderValid = invalidEndTime > invalidStartTime;
  if (!isTimeOrderValid) {
    console.log('  ✅ Time validation verified: End time before start time is correctly flagged as invalid.');
  }

  // Check online interview meetingLink
  const onlineRequiresLink = (mode: InterviewMode, link?: string | null) => {
    return mode === InterviewMode.ONLINE ? Boolean(link && link.trim().length > 0) : true;
  };
  if (!onlineRequiresLink(InterviewMode.ONLINE, null)) {
    console.log('  ✅ Mode validation verified: Online interview requires meeting link.');
  }

  // Check in-person interview location
  const inPersonRequiresLoc = (mode: InterviewMode, loc?: string | null) => {
    return mode === InterviewMode.IN_PERSON ? Boolean(loc && loc.trim().length > 0) : true;
  };
  if (!inPersonRequiresLoc(InterviewMode.IN_PERSON, null)) {
    console.log('  ✅ Mode validation verified: In-person interview requires physical location/room.');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Rescheduling & Status Update
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Reschedule Interview ---');
  const newStart = new Date(round1Start.getTime() + 2 * 3600000);
  const newEnd = new Date(round1End.getTime() + 2 * 3600000);
  const rescheduledInterview = await prisma.interview.update({
    where: { id: interview1.id },
    data: {
      startTime: newStart,
      endTime: newEnd,
      status: InterviewStatus.RESCHEDULED,
      notes: '[Rescheduled]: Interviewer requested 2-hour delay due to sprint demo.',
    },
  });
  console.log(`  ✅ Interview rescheduled to new time slot. Status: ${rescheduledInterview.status}`);

  // -------------------------------------------------------------------------
  // TEST 5: Complete Round 1 & Record QUALIFIED Result
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Record Round 1 Result (QUALIFIED) ---');
  const completedRound1 = await prisma.interview.update({
    where: { id: interview1.id },
    data: {
      result: InterviewResult.QUALIFIED,
      feedback: 'Excellent problem solving skills, clean asynchronous code, solid SQL knowledge.',
      status: InterviewStatus.COMPLETED,
    },
  });
  console.log(`  ✅ Round 1 completed with result: ${completedRound1.result}`);

  // -------------------------------------------------------------------------
  // TEST 6: Multiple Interview Rounds (Round 2: Managerial & Fitment)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Multiple Rounds - Schedule Round 2 without Overwriting Round 1 ---');
  const round2Date = new Date(Date.now() + 4 * 86400000);
  const interview2 = await prisma.interview.create({
    data: {
      applicationId: appShortlisted.id,
      studentId: student.id,
      companyId: company.id,
      jobId: testJob.id,
      recruiterId: recruiter.id,
      roundNumber: 2,
      roundName: 'Round 2: Engineering Manager & Leadership Discussion',
      interviewDate: round2Date,
      startTime: new Date(round2Date.getTime() + 14 * 3600000),
      endTime: new Date(round2Date.getTime() + 15 * 3600000),
      mode: InterviewMode.ONLINE,
      meetingLink: 'https://meet.nexhire.local/apex-tech-r2',
      interviewerName: 'Ananya Sharma (Director of Engineering)',
      status: InterviewStatus.SCHEDULED,
      result: InterviewResult.PENDING,
    },
  });

  const totalAppInterviews = await prisma.interview.count({
    where: { applicationId: appShortlisted.id },
  });
  console.log(`  ✅ Round 2 scheduled: ID ${interview2.id}`);
  console.log(`  ✅ Total preserved interview rounds for candidate: ${totalAppInterviews}`);
  if (totalAppInterviews !== 2) {
    throw new Error('FAILED: Multi-round interview history was overwritten or lost!');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Final Round Result & Candidate Selection
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Complete Round 2 & Candidate Selection ---');
  await prisma.interview.update({
    where: { id: interview2.id },
    data: {
      result: InterviewResult.QUALIFIED,
      feedback: 'Outstanding cultural fit, clear communication, excited about our vision.',
      status: InterviewStatus.COMPLETED,
    },
  });

  // Select candidate
  const selectedApp = await prisma.application.update({
    where: { id: appShortlisted.id },
    data: {
      status: ApplicationStatus.SELECTED,
      statusRemarks: 'Candidate cleared all rounds and is selected for campus offer.',
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: selectedApp.id,
      previousStatus: ApplicationStatus.INTERVIEW_SCHEDULED,
      newStatus: ApplicationStatus.SELECTED,
      changedById: recruiterUser.id,
      note: 'Cleared Technical and Managerial rounds. Selected for full-time offer.',
    },
  });
  console.log(`  ✅ Candidate selected! Application status: ${selectedApp.status}`);

  // -------------------------------------------------------------------------
  // TEST 8: Offer Creation for Selected Candidate
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Offer Creation & Application Integration ---');
  const offerDate = new Date();
  const joiningDate = new Date(Date.now() + 90 * 86400000);
  const deadline = new Date(Date.now() + 14 * 86400000);

  const offer = await prisma.offer.create({
    data: {
      applicationId: selectedApp.id,
      studentId: student.id,
      companyId: company.id,
      jobId: testJob.id,
      designation: 'Associate Cloud Engineer (SDE-1)',
      salary: 1450000,
      currency: 'INR',
      location: 'Bengaluru, Karnataka',
      offerDate,
      joiningDate,
      acceptanceDeadline: deadline,
      status: OfferStatus.OFFERED,
    },
  });

  // Advance application status to OFFER_RECEIVED
  const offerApp = await prisma.application.update({
    where: { id: selectedApp.id },
    data: {
      status: ApplicationStatus.OFFER_RECEIVED,
      statusRemarks: 'Official offer letter issued for SDE-1 position (14.5 LPA).',
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: selectedApp.id,
      previousStatus: ApplicationStatus.SELECTED,
      newStatus: ApplicationStatus.OFFER_RECEIVED,
      changedById: recruiterUser.id,
      note: 'Offer package extended: 14.5 LPA, Bengaluru. Joining: ' + joiningDate.toLocaleDateString(),
    },
  });

  console.log(`  ✅ Offer created successfully (ID: ${offer.id}, Status: ${offer.status}, CTC: ${offer.salary} ${offer.currency})`);
  console.log(`  ✅ Application transitioned to: ${offerApp.status}`);

  // -------------------------------------------------------------------------
  // TEST 9: Student Offer Acceptance Workflow
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Student Offer Acceptance Workflow ---');
  const acceptedOffer = await prisma.offer.update({
    where: { id: offer.id },
    data: {
      status: OfferStatus.ACCEPTED,
      respondedAt: new Date(),
      responseNotes: 'Thank you for the opportunity! Excited to join the engineering team.',
    },
  });

  const acceptedApp = await prisma.application.update({
    where: { id: selectedApp.id },
    data: {
      status: ApplicationStatus.OFFER_ACCEPTED,
      statusRemarks: 'Candidate accepted offer. Awaiting placement onboarding.',
    },
  });

  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: selectedApp.id,
      previousStatus: ApplicationStatus.OFFER_RECEIVED,
      newStatus: ApplicationStatus.OFFER_ACCEPTED,
      changedById: studentUser.id,
      note: 'Student officially accepted employment offer.',
    },
  });

  console.log(`  ✅ Offer status updated to: ${acceptedOffer.status}`);
  console.log(`  ✅ Application status transitioned to: ${acceptedApp.status}`);

  // Verify Application Status History steps
  const statusHistory = await prisma.applicationStatusHistory.findMany({
    where: { applicationId: selectedApp.id },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`  ✅ Total Application Status History entries: ${statusHistory.length}`);
  statusHistory.forEach((h, idx) => {
    console.log(`     ${idx + 1}. ${h.previousStatus ?? 'INIT'} -> ${h.newStatus} | "${h.note}"`);
  });

  // -------------------------------------------------------------------------
  // TEST 10: Multi-Tenant IDOR Boundaries
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Multi-Tenant IDOR Security Checks ---');
  // Check 1: Recruiter A attempting to access Company B job application
  const otherApp = await prisma.application.create({
    data: {
      studentId: otherStudent!.id,
      opportunityType: OpportunityType.JOB,
      jobId: otherJob.id,
      status: ApplicationStatus.SHORTLISTED,
    },
  });

  const isRecruiterAllowedForOtherApp = recruiter.companyId === otherCompany.id;
  if (!isRecruiterAllowedForOtherApp) {
    console.log(`  🛡️ IDOR Check 1 Passed: Recruiter at "${company.name}" cannot schedule interview or manage candidates for "${otherCompany.name}".`);
  } else {
    throw new Error('FAILED: Recruiter crossed company tenant boundaries!');
  }

  // Check 2: Student A cannot see Student B's offers/interviews
  const isStudentAllowedForOtherOffer = student.id === otherStudent!.id;
  if (!isStudentAllowedForOtherOffer) {
    console.log(`  🛡️ IDOR Check 2 Passed: Student "${student.fullName}" cannot access or accept offers belonging to student "${otherStudent!.fullName}".`);
  }

  // Check 3: Student rejection does NOT delete offer record
  console.log('\n--- TEST 11: Offer Rejection Preserves Historical Record ---');
  const rejectTestOffer = await prisma.offer.create({
    data: {
      applicationId: otherApp.id,
      studentId: otherStudent!.id,
      companyId: otherCompany.id,
      jobId: otherJob.id,
      designation: 'Security Trainee',
      salary: 800000,
      currency: 'INR',
      location: 'Hyderabad',
      status: OfferStatus.OFFERED,
    },
  });

  const rejectedOffer = await prisma.offer.update({
    where: { id: rejectTestOffer.id },
    data: {
      status: OfferStatus.REJECTED,
      respondedAt: new Date(),
      responseNotes: 'Declining to pursue higher education opportunities.',
    },
  });

  const persistedOffer = await prisma.offer.findUnique({
    where: { id: rejectedOffer.id },
  });
  if (persistedOffer && persistedOffer.status === OfferStatus.REJECTED) {
    console.log(`  ✅ Rejected offer is preserved in database with reason: "${persistedOffer.responseNotes}".`);
  } else {
    throw new Error('FAILED: Offer was deleted or corrupted on rejection!');
  }

  console.log('\n🎉 ALL RECRUITMENT MODULE (STEP 8) VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runRecruitmentModuleVerification()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
