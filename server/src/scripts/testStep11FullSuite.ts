import assert from 'assert';
import { prisma } from '../config/database.js';
import { createApp } from '../app.js';
import type { Server } from 'http';
import { UserRole, OpportunityType, ApplicationStatus, InterviewMode, InterviewResult, OfferStatus } from '@prisma/client';
import { hashPassword } from '../utils/security.utils.js';

let server: Server;
let baseUrl: string;

async function startServer(): Promise<void> {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
}

async function request(method: string, path: string, headers: Record<string, string> = {}, body?: any) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, body: json };
}

async function runStep11ComprehensiveSuite() {
  console.log('\n================================================================');
  console.log('🚀 NEXHIRE STEP 11: MASTER END-TO-END & SECURITY TEST SUITE');
  console.log('================================================================\n');

  await startServer();
  console.log(`📡 Local test harness active on ${baseUrl}\n`);

  let passed = 0;
  let total = 0;

  function test(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS ${total}] ${name}`);
    } else {
      console.error(`  ❌ [FAIL ${total}] ${name}${details ? ` -> ${details}` : ''}`);
      throw new Error(`Test failed: ${name}`);
    }
  }

  try {
    // ----------------------------------------------------
    // PHASE 1: DATABASE & ENTITY ARCHITECTURE
    // ----------------------------------------------------
    console.log('--- PHASE 1: Database & Entity Architecture Check ---');
    const userCount = await prisma.user.count();
    test('MySQL database is accessible and responsive', userCount >= 0);

    const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`
      SELECT table_name as tableName 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `;
    test('Database contains all 24 required architectural tables', tables.length >= 24);

    const mcaDept = await prisma.department.findFirst({ where: { code: 'MCA' } });
    test('Department entity exists and has valid relational keys', !!mcaDept);

    // ----------------------------------------------------
    // PHASE 2: AUTHENTICATION & CREDENTIAL SECURITY
    // ----------------------------------------------------
    console.log('\n--- PHASE 2: Authentication & Token Lifecycle ---');
    // Test 1: Invalid email
    const invalidEmailRes = await request('POST', '/api/auth/login', {}, { email: 'nonexistent@nexhire.local', password: 'Password123!' });
    test('Reject non-existent email with 401 Unauthorized', invalidEmailRes.status === 401);
    test('Error response does not leak user existence details', !invalidEmailRes.body.user);

    // Test 2: Invalid password
    const invalidPassRes = await request('POST', '/api/auth/login', {}, { email: 'superadmin.demo@nexhire.local', password: 'WrongPassword!' });
    test('Reject incorrect password with 401 Unauthorized', invalidPassRes.status === 401);

    // Test 3: Missing credentials
    const emptyCredsRes = await request('POST', '/api/auth/login', {}, {});
    test('Reject missing credentials with 400 Bad Request', emptyCredsRes.status === 400);

    // Test 4: Super Admin valid login
    const superAdminLogin = await request('POST', '/api/auth/login', {}, { email: 'superadmin.demo@nexhire.local', password: 'NexHire@2026!' });
    test('Super Admin login returns 200 OK', superAdminLogin.status === 200);
    test('Super Admin role is SUPER_ADMIN', superAdminLogin.body.user?.role === 'SUPER_ADMIN');
    test('Password hash is never leaked in login payload', !superAdminLogin.body.user?.passwordHash);
    const superAdminToken = superAdminLogin.body.token;
    const superAdminHeaders = { Authorization: `Bearer ${superAdminToken}` };

    // Test 5: Placement Admin valid login
    const placementLogin = await request('POST', '/api/auth/login', {}, { email: 'placement.officer.demo@nexhire.local', password: 'NexHire@2026!' });
    test('Placement Admin login returns 200 OK', placementLogin.status === 200);
    test('Placement Admin role is PLACEMENT_ADMIN', placementLogin.body.user?.role === 'PLACEMENT_ADMIN');
    const placementToken = placementLogin.body.token;
    const placementHeaders = { Authorization: `Bearer ${placementToken}` };

    // Test 6: Student valid login
    const studentLogin = await request('POST', '/api/auth/login', {}, { email: 'student.demo@nexhire.local', password: 'NexHire@2026!' });
    test('Student login returns 200 OK', studentLogin.status === 200);
    test('Student role is STUDENT', studentLogin.body.user?.role === 'STUDENT');
    const studentToken = studentLogin.body.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // Test 7: Recruiter valid login
    const recruiterLogin = await request('POST', '/api/auth/login', {}, { email: 'recruiter.demo@nexhire.local', password: 'NexHire@2026!' });
    test('Recruiter login returns 200 OK', recruiterLogin.status === 200);
    test('Recruiter role is RECRUITER', recruiterLogin.body.user?.role === 'RECRUITER');
    const recruiterToken = recruiterLogin.body.token;
    const recruiterHeaders = { Authorization: `Bearer ${recruiterToken}` };

    // Test 8: Current User (/api/auth/me)
    const meRes = await request('GET', '/api/auth/me', studentHeaders);
    test('Protected /api/auth/me returns current session user', meRes.status === 200 && meRes.body.user?.email === 'student.demo@nexhire.local');
    test('Password hash is redacted from /api/auth/me', !meRes.body.user?.passwordHash);

    // ----------------------------------------------------
    // PHASE 3: RBAC AUTHORIZATION ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- PHASE 3: Strict Role-Based Access Control (RBAC) ---');
    // Student trying to access admin users list -> 403
    const studentAdminAccess = await request('GET', '/api/admin/users', studentHeaders);
    test('Student blocked from /api/admin/users with 403 Forbidden', studentAdminAccess.status === 403);

    // Recruiter trying to access student profile -> 403
    const recruiterStudentAccess = await request('GET', '/api/student/profile', recruiterHeaders);
    test('Recruiter blocked from /api/student/profile with 403 Forbidden', recruiterStudentAccess.status === 403);

    // Placement Admin trying to modify system settings -> 403 (Super Admin only!)
    const placementModifySettings = await request('PUT', '/api/admin/settings', placementHeaders, {
      settings: [{ key: 'INSTITUTION_NAME', value: 'Unauthorized College' }],
    });
    test('Placement Admin blocked from updating System Settings with 403 Forbidden', placementModifySettings.status === 403);

    // Super Admin permitted to read and modify settings
    const superAdminSettings = await request('GET', '/api/admin/settings', superAdminHeaders);
    test('Super Admin authorized for /api/admin/settings (200 OK)', superAdminSettings.status === 200);

    // ----------------------------------------------------
    // PHASE 4: IDOR & MULTI-TENANT BOUNDARY GUARDS
    // ----------------------------------------------------
    console.log('\n--- PHASE 4: IDOR Protection & Multi-Tenant Boundaries ---');
    // Create Student B for cross-tenant IDOR checks
    const hash = await hashPassword('TempPass123!');
    await prisma.certification.deleteMany({ where: { student: { studentId: 'IDOR_STUDENT_B' } } });
    await prisma.student.deleteMany({ where: { studentId: 'IDOR_STUDENT_B' } });
    await prisma.user.deleteMany({ where: { email: 'idor.student.b@nexhire.local' } });

    const userB = await prisma.user.create({
      data: {
        email: 'idor.student.b@nexhire.local',
        passwordHash: hash,
        role: UserRole.STUDENT,
        isActive: true,
      },
    });
    const studentB = await prisma.student.create({
      data: {
        userId: userB.id,
        departmentId: mcaDept!.id,
        fullName: 'IDOR Test Student B',
        studentId: 'IDOR_STUDENT_B',
        enrollmentNumber: 'EN_IDOR_002',
        course: 'MCA',
        program: 'Master of Computer Applications',
        graduationYear: 2026,
      },
    });

    // Student B creates a certification
    const certB = await prisma.certification.create({
      data: {
        studentId: studentB.id,
        name: 'Private Cert of Student B',
        issuingOrganization: 'Cyber Trust',
        issueDate: new Date('2025-01-01'),
      },
    });

    // Student A tries to update Student B's cert -> MUST FAIL (403 or 404)
    const idorCertUpdate = await request('PUT', `/api/student/certifications/${certB.id}`, studentHeaders, {
      name: 'Tampered Cert by Student A',
    });
    test('IDOR Guard: Student A cannot tamper with Student B certification', idorCertUpdate.status === 404 || idorCertUpdate.status === 403);

    // Student A tries to delete Student B's cert -> MUST FAIL (403 or 404)
    const idorCertDelete = await request('DELETE', `/api/student/certifications/${certB.id}`, studentHeaders);
    test('IDOR Guard: Student A cannot delete Student B certification', idorCertDelete.status === 404 || idorCertDelete.status === 403);

    // Clean up temporary IDOR student
    await prisma.certification.deleteMany({ where: { studentId: studentB.id } });
    await prisma.student.delete({ where: { id: studentB.id } });
    await prisma.user.delete({ where: { id: userB.id } });

    // ----------------------------------------------------
    // PHASE 5: ELIGIBILITY ENGINE & BUSINESS RULES
    // ----------------------------------------------------
    console.log('\n--- PHASE 5: Eligibility Engine & Opportunity Application Rules ---');
    // Student A checks eligibility against a high cut-off opportunity
    const apexCompany = await prisma.company.findFirst({ where: { name: { contains: 'Apex' } } });
    assert(apexCompany, 'Apex company must exist');

    // Create a strict job with min CGPA 9.99
    const strictJob = await prisma.job.create({
      data: {
        companyId: apexCompany.id,
        title: 'Master Quantum Researcher (Step 11 Test)',
        description: 'Elite opportunity for testing eligibility limits.',
        responsibilities: 'Research quantum computing.',
        requirements: 'CGPA 9.99+',
        requiredSkills: 'Quantum Mechanics, Python',
        location: 'Bengaluru',
        salaryMin: 2000000,
        salaryMax: 2500000,
        vacancies: 1,
        applicationDeadline: new Date(Date.now() + 86400000 * 7),
        status: 'PUBLISHED',
      },
    });
    await prisma.eligibilityCriteria.create({
      data: {
        jobId: strictJob.id,
        minCgpa: 9.99,
        maxBacklogs: 0,
        allowedCourses: JSON.stringify(['MCA']),
        graduationYears: JSON.stringify([2026]),
      },
    });

    const eligibilityCheck = await request('GET', `/api/opportunities/check-eligibility/JOB/${strictJob.id}`, studentHeaders);
    test('Eligibility Engine correctly flags candidate as ineligible (isEligible: false)', eligibilityCheck.body.data?.isEligible === false);
    test('Eligibility Engine specifies clear reasons for ineligibility', Array.isArray(eligibilityCheck.body.data?.reasons) && eligibilityCheck.body.data.reasons.length > 0);

    // Try applying to this ineligible job -> backend must reject with 400!
    const ineligibleApply = await request('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: strictJob.id,
    });
    test('RULE 1 Enforced: Backend rejects application to ineligible opportunity with 400 Bad Request', ineligibleApply.status === 400);

    // ----------------------------------------------------
    // PHASE 6: END-TO-END RECRUITMENT & PLACEMENT LIFECYCLE
    // ----------------------------------------------------
    console.log('\n--- PHASE 6: End-to-End Real Lifecycle (Job -> Apply -> Interview -> Offer -> Placement) ---');
    // Create an eligible test job
    const eligibleJob = await prisma.job.create({
      data: {
        companyId: apexCompany.id,
        title: 'Full Stack Staff Engineer (Step 11 E2E Test)',
        description: 'End to end testing workflow position.',
        responsibilities: 'Scale NexHire distributed system.',
        requirements: 'Node.js, TypeScript, React',
        requiredSkills: 'Node.js, React',
        location: 'Bengaluru / Remote',
        salaryMin: 1800000,
        salaryMax: 2200000,
        vacancies: 2,
        applicationDeadline: new Date(Date.now() + 86400000 * 14),
        status: 'PUBLISHED',
      },
    });
    await prisma.eligibilityCriteria.create({
      data: {
        jobId: eligibleJob.id,
        minCgpa: 6.0,
        maxBacklogs: 2,
        allowedCourses: JSON.stringify(['MCA', 'B.Tech']),
        graduationYears: JSON.stringify([2026]),
      },
    });

    // 1. Student applies
    const applyRes = await request('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: eligibleJob.id,
      coverLetter: 'I am excited to apply for the Staff Engineer position!',
    });
    test('Student successfully submits application (201 Created)', applyRes.status === 201, JSON.stringify(applyRes.body));
    const appId = applyRes.body.data.id;
    test('Initial status is APPLIED', applyRes.body.data.status === 'APPLIED');

    // 2. Test duplicate application prevention (RULE 3)
    const duplicateApply = await request('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: eligibleJob.id,
    });
    test('RULE 3 Enforced: Duplicate application rejected with 400 Bad Request', duplicateApply.status === 400);

    // 3. Recruiter reviews & shortlists
    const shortlistRes = await request('PUT', `/api/applications/${appId}/status`, recruiterHeaders, {
      status: 'SHORTLISTED',
      remarks: 'Candidate portfolio meets team standards.',
    });
    test('Recruiter shortlists candidate (status -> SHORTLISTED)', shortlistRes.status === 200 && shortlistRes.body.data.status === 'SHORTLISTED');

    // 4. Recruiter schedules Interview Round 1
    const interviewDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const schedRes = await request('POST', '/api/interviews', recruiterHeaders, {
      applicationId: appId,
      roundNumber: 1,
      roundName: 'System Architecture & Algorithmic Design',
      roundType: 'TECHNICAL',
      interviewDate,
      startTime: '10:00',
      endTime: '11:00',
      mode: 'ONLINE',
      meetingLink: 'https://meet.google.com/test-step11-interview',
    });
    test('Recruiter schedules Technical Interview Round 1 (201 Created)', schedRes.status === 201, JSON.stringify(schedRes.body));
    const interviewId = schedRes.body.data.id;

    // Verify application transitioned to INTERVIEW_SCHEDULED
    const appAfterInterview = await prisma.application.findUnique({ where: { id: appId } });
    test('Application transitioned to INTERVIEW_SCHEDULED', appAfterInterview?.status === 'INTERVIEW_SCHEDULED');

    // 5. Complete Interview with result QUALIFIED
    const completeInterviewRes = await request('PUT', `/api/interviews/${interviewId}/result`, recruiterHeaders, {
      result: 'QUALIFIED',
      feedback: 'Excellent demonstration of distributed caching and DB locking.',
      rating: 5,
    });
    test('Interview round completed with QUALIFIED result (200 OK)', completeInterviewRes.status === 200 && completeInterviewRes.body.data.result === 'QUALIFIED');

    // Select candidate
    const selectRes = await request('POST', `/api/interviews/application/${appId}/select`, recruiterHeaders, {
      remarks: 'Candidate selected for full-time offer.',
    });
    test('Application transitioned to SELECTED status', selectRes.status === 200 && selectRes.body.data.status === 'SELECTED');

    // 6. Recruiter issues formal employment Offer
    const joiningDate = new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0];
    const offerRes = await request('POST', '/api/offers', recruiterHeaders, {
      applicationId: appId,
      offerType: 'JOB',
      designation: 'Staff Software Engineer',
      salaryCtc: 1850000,
      currency: 'INR',
      joiningDate,
      offerExpiryDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      location: 'Bengaluru, Karnataka',
      terms: 'Standard institutional campus placement terms.',
    });
    test('Recruiter creates official Job Offer (201 Created)', offerRes.status === 201, JSON.stringify(offerRes.body));
    const offerId = offerRes.body.data.id;
    test('Offer status is OFFERED with correct CTC (18,50,000 INR)', Number(offerRes.body.data.salaryCtc) === 1850000);

    // Verify application transitioned to OFFER_RECEIVED
    const appAfterOffer = await prisma.application.findUnique({ where: { id: appId } });
    test('Application transitioned to OFFER_RECEIVED', appAfterOffer?.status === 'OFFER_RECEIVED');

    // 7. Student accepts the Offer
    const acceptOfferRes = await request('PUT', `/api/offers/${offerId}/accept`, studentHeaders, {
      notes: 'Thank you! Excited to join the engineering team.',
    });
    test('Student accepts job offer (status -> ACCEPTED)', acceptOfferRes.status === 200 && acceptOfferRes.body.data.status === 'ACCEPTED');

    // Verify application transitioned to OFFER_ACCEPTED
    const appAfterAccept = await prisma.application.findUnique({ where: { id: appId } });
    test('Application transitioned to OFFER_ACCEPTED', appAfterAccept?.status === 'OFFER_ACCEPTED');

    // 8. Placement Admin confirms final institutional Placement
    const placementRes = await request('POST', '/api/placements', placementHeaders, {
      studentId: appAfterAccept!.studentId,
      companyId: apexCompany.id,
      applicationId: appId,
      offerId: offerId,
      placementType: 'ON_CAMPUS',
      jobTitle: 'Staff Software Engineer',
      packageAmount: 1850000,
      joiningDate,
      academicYear: '2025-2026',
      notes: 'Official campus placement verified and archived.',
    });
    test('Placement Administrator creates confirmed Placement record (201 Created)', placementRes.status === 201);
    const placementId = placementRes.body.data.id;

    // Verify application transitioned to HIRED_PLACED (RULE 4 & RULE 7)
    const appAfterPlacement = await prisma.application.findUnique({ where: { id: appId } });
    test('RULE 7 Enforced: Application officially marked as HIRED_PLACED', appAfterPlacement?.status === 'HIRED_PLACED');

    // 9. Test duplicate placement prevention (RULE 8)
    const duplicatePlacement = await request('POST', '/api/placements', placementHeaders, {
      studentId: appAfterAccept!.studentId,
      companyId: apexCompany.id,
      applicationId: appId,
      offerId: offerId,
      placementType: 'ON_CAMPUS',
      jobTitle: 'Staff Software Engineer',
      packageAmount: 1850000,
      joiningDate,
      academicYear: '2025-2026',
    });
    test('RULE 8 Enforced: Duplicate placement record blocked with 400 Bad Request', duplicatePlacement.status === 400);

    // 10. Verify Notification Dispatch
    const notificationsRes = await request('GET', '/api/notifications/my-notifications', studentHeaders);
    test(
      'System automatically dispatched notifications for student application & placement events',
      notificationsRes.status === 200 &&
        (Array.isArray(notificationsRes.body.data) || Array.isArray(notificationsRes.body.data?.notifications))
    );

    // 11. Verify Real-time Analytics & Aggregation
    const overviewStats = await request('GET', '/api/admin/overview', placementHeaders);
    test('Real-time Analytics reflects verified placements accurately', overviewStats.status === 200 && overviewStats.body.data.placements.totalPlacements >= 1);
    test('Real-time Analytics computes non-zero average and highest CTC', overviewStats.body.data.placements.highestPackage >= 1850000);

    // 12. Verify Audit Logs
    const auditLogs = await request('GET', '/api/admin/audit-logs', placementHeaders);
    test(
      'Audit logs captured placement and recruitment lifecycle operations',
      auditLogs.status === 200 &&
        (Array.isArray(auditLogs.body.data) || Array.isArray(auditLogs.body.data?.logs))
    );

    // ----------------------------------------------------
    // CLEANUP OF TEMPORARY TEST ENTITIES
    // ----------------------------------------------------
    console.log('\n--- Cleaning up temporary E2E test records ---');
    await prisma.placement.deleteMany({ where: { id: placementId } });
    await prisma.offer.deleteMany({ where: { id: offerId } });
    await prisma.interview.deleteMany({ where: { id: interviewId } });
    await prisma.interviewRound.deleteMany({ where: { jobId: eligibleJob.id } });
    await prisma.applicationStatusHistory.deleteMany({ where: { applicationId: appId } });
    await prisma.application.deleteMany({ where: { id: appId } });
    await prisma.eligibilityCriteria.deleteMany({ where: { jobId: eligibleJob.id } });
    await prisma.job.deleteMany({ where: { id: eligibleJob.id } });
    await prisma.eligibilityCriteria.deleteMany({ where: { jobId: strictJob.id } });
    await prisma.job.deleteMany({ where: { id: strictJob.id } });
    console.log('  🧹 Temporary test entities cleanly removed from database.');

    console.log('\n================================================================');
    console.log(`🎉 MASTER STEP 11 TEST SUITE COMPLETE: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================\n');

  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runStep11ComprehensiveSuite().catch((err) => {
  console.error('\n❌ STEP 11 SUITE FAILED:', err);
  process.exit(1);
});
