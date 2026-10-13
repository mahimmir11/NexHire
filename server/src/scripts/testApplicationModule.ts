import http from 'http';
import { createApp } from '../app.js';
import { prisma } from '../config/database.js';
import { OpportunityStatus, OpportunityType, ApplicationStatus } from '@prisma/client';

let server: http.Server;
let port: number;
let baseUrl: string;

function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const bodyStr = body ? JSON.stringify(body) : undefined;

    const reqHeaders: Record<string, string> = {
      ...headers,
    };
    if (bodyStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 NexHire STEP 7: Application Management Module Tests');
  console.log('================================================================\n');

  const app = createApp();
  server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      port = addr.port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`🚀 Test server started at ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // 1. Authenticate Actors
    // -------------------------------------------------------------
    console.log('--- 1. Authenticating Roles ---');

    const recruiterLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'recruiter.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    const recruiterToken = recruiterLogin.body?.token;
    assert(recruiterLogin.status === 200 && !!recruiterToken, 'Recruiter logged in');
    const recruiterHeaders = { Authorization: `Bearer ${recruiterToken}` };

    const placementLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'placement.officer.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    const placementToken = placementLogin.body?.token;
    assert(placementLogin.status === 200 && !!placementToken, 'Placement Officer logged in');
    const placementHeaders = { Authorization: `Bearer ${placementToken}` };

    const studentLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'student.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    const studentToken = studentLogin.body?.token;
    assert(studentLogin.status === 200 && !!studentToken, 'Student logged in');
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // Get company ID for recruiter
    const recruiterProfile = await prisma.recruiter.findFirst({
      where: { user: { email: 'recruiter.demo@nexhire.local' } },
    });
    const companyId = recruiterProfile!.companyId!;

    // -------------------------------------------------------------
    // 2. Set Up Test Opportunities
    // -------------------------------------------------------------
    console.log('\n--- 2. Setting Up Test Opportunities ---');

    // Job A: Eligible (min CGPA 7.0), published, future deadline
    const jobA = await prisma.job.create({
      data: {
        companyId,
        title: 'Step 7 Full Stack Engineer',
        description: 'Building next-gen enterprise campus applications',
        responsibilities: 'Design, develop, and maintain web services.',
        requirements: 'Strong problem solving and CS fundamentals.',
        employmentType: 'FULL_TIME',
        location: 'Bengaluru, India',
        workMode: 'HYBRID',
        requiredSkills: 'Node.js, React, TypeScript, MySQL',
        salaryMin: 1200000,
        salaryMax: 1600000,
        vacancies: 3,
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days future
        status: OpportunityStatus.PUBLISHED,
        eligibilityCriteria: {
          create: {
            minCgpa: 7.0,
            maxBacklogs: 0,
            allowedDepartments: JSON.stringify(['MCA', 'Computer Science']),
          },
        },
      },
    });
    assert(Boolean(jobA.id), 'Created Job A (Published, Eligible)');

    // Job B: Ineligible (min CGPA 9.8), published
    const jobB = await prisma.job.create({
      data: {
        companyId,
        title: 'Step 7 Ultra Researcher',
        description: 'High GPA research role',
        responsibilities: 'Conduct advanced mathematical modeling.',
        requirements: 'Top percentile academic performance.',
        employmentType: 'FULL_TIME',
        location: 'Bengaluru, India',
        workMode: 'ON_SITE',
        requiredSkills: 'AI, Math',
        salaryMin: 900000,
        salaryMax: 1400000,
        vacancies: 1,
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: OpportunityStatus.PUBLISHED,
        eligibilityCriteria: {
          create: {
            minCgpa: 9.8, // Student has 8.85
            maxBacklogs: 0,
          },
        },
      },
    });
    assert(Boolean(jobB.id), 'Created Job B (Published, Ineligible - min CGPA 9.8)');

    // Job C: Draft (Not published)
    const jobC = await prisma.job.create({
      data: {
        companyId,
        title: 'Step 7 Draft Position',
        description: 'Unpublished position',
        responsibilities: 'Draft development specifications.',
        requirements: 'Knowledge of software lifecycle.',
        employmentType: 'FULL_TIME',
        location: 'Remote',
        requiredSkills: 'General',
        salaryMin: 900000,
        salaryMax: 1400000,
        vacancies: 1,
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: OpportunityStatus.DRAFT,
      },
    });
    assert(Boolean(jobC.id), 'Created Job C (Draft)');

    // Job D: Expired deadline
    const jobD = await prisma.job.create({
      data: {
        companyId,
        title: 'Step 7 Expired Opportunity',
        description: 'Past deadline role',
        responsibilities: 'Legacy maintenance.',
        requirements: 'Maintenance experience.',
        employmentType: 'FULL_TIME',
        location: 'Remote',
        requiredSkills: 'General',
        salaryMin: 900000,
        salaryMax: 1400000,
        vacancies: 1,
        applicationDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: OpportunityStatus.PUBLISHED,
      },
    });
    assert(Boolean(jobD.id), 'Created Job D (Expired Deadline)');

    // Internship A: Eligible, published, future deadline
    const internshipA = await prisma.internship.create({
      data: {
        companyId,
        title: 'Step 7 Backend Engineering Intern',
        description: 'Summer backend developer internship',
        responsibilities: 'Assist in building APIs.',
        duration: '6 Months',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stipendAmount: 45000,
        stipendPeriod: 'PER_MONTH',
        location: 'Bengaluru, India',
        workMode: 'HYBRID',
        requiredSkills: 'Node.js, TypeScript',
        vacancies: 2,
        applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: OpportunityStatus.PUBLISHED,
        eligibilityCriteria: {
          create: {
            minCgpa: 6.5,
            maxBacklogs: 1,
          },
        },
      },
    });
    assert(Boolean(internshipA.id), 'Created Internship A (Published, Eligible)');

    // -------------------------------------------------------------
    // 3. Application Validation & Rejection Rules
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Business Rules & Validations ---');

    // Rule 1: Student cannot apply to ineligible opportunity
    const ineligApplyRes = await makeRequest('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: jobB.id,
      coverLetter: 'I am interested in this role',
    });
    assert(ineligApplyRes.status === 400, 'Reject application to ineligible opportunity with 400 Bad Request');
    assert(
      Array.isArray(ineligApplyRes.body.reasons) && ineligApplyRes.body.reasons.length > 0,
      'Response provides clear reasons for ineligibility'
    );

    // Rule 2: Student cannot apply to unpublished opportunity (DRAFT)
    const draftApplyRes = await makeRequest('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: jobC.id,
    });
    assert(draftApplyRes.status === 400, 'Reject application to DRAFT opportunity with 400 Bad Request');

    // Rule 3: Student cannot apply after deadline
    const expiredApplyRes = await makeRequest('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: jobD.id,
    });
    assert(expiredApplyRes.status === 400, 'Reject application past deadline with 400 Bad Request');

    // Rule 4: Non-students cannot apply
    const recruiterApplyRes = await makeRequest('POST', '/api/applications/apply', recruiterHeaders, {
      opportunityType: 'JOB',
      opportunityId: jobA.id,
    });
    assert(recruiterApplyRes.status === 403, 'Recruiter forbidden from submitting student applications (403)');

    // -------------------------------------------------------------
    // 4. Successful Student Application Submission
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Successful Application Submission ---');

    const successfulApply = await makeRequest('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: jobA.id,
      coverLetter: 'Excited to contribute to NexHire backend architecture and services!',
    });
    assert(successfulApply.status === 201, 'Student successfully applies to eligible published job (201 Created)');
    assert(successfulApply.body.success === true, 'Response contains success: true');
    const jobAAppId = successfulApply.body.data.id;
    assert(successfulApply.body.data.status === ApplicationStatus.APPLIED, 'Initial application status is APPLIED');

    // Verify database record and history
    const dbHistory = await prisma.applicationStatusHistory.findFirst({
      where: { applicationId: jobAAppId },
    });
    assert(Boolean(dbHistory), 'Initial status history record recorded in MySQL');
    assert(dbHistory!.newStatus === ApplicationStatus.APPLIED, 'History record notes newStatus APPLIED');

    // Rule 5: Duplicate application prevention
    const duplicateApply = await makeRequest('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'JOB',
      opportunityId: jobA.id,
      coverLetter: 'Trying to apply again...',
    });
    assert(duplicateApply.status === 400, 'Duplicate application rejected with 400 Bad Request');

    // -------------------------------------------------------------
    // 5. Application Status Check Endpoint
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Application Status Check Endpoint ---');

    const statusCheckApplied = await makeRequest('GET', `/api/applications/check-status/JOB/${jobA.id}`, studentHeaders);
    assert(statusCheckApplied.status === 200, 'Status check endpoint responds with 200');
    assert(statusCheckApplied.body.data.hasApplied === true, 'Correctly flags hasApplied: true for Job A');

    const statusCheckUnapplied = await makeRequest('GET', `/api/applications/check-status/JOB/${jobB.id}`, studentHeaders);
    assert(statusCheckUnapplied.body.data.hasApplied === false, 'Correctly flags hasApplied: false for Job B');

    // -------------------------------------------------------------
    // 6. Student Application Discovery & Details
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Student Applications Retrieval ---');

    const myAppsRes = await makeRequest('GET', '/api/applications/student/my-applications?page=1&limit=10', studentHeaders);
    assert(myAppsRes.status === 200, 'Student can retrieve their submitted applications');
    assert(Array.isArray(myAppsRes.body.data.applications), 'Applications returned as array');
    assert(myAppsRes.body.data.pagination.total >= 1, 'Pagination metadata accurately returned');

    const appDetailRes = await makeRequest('GET', `/api/applications/student/${jobAAppId}`, studentHeaders);
    assert(appDetailRes.status === 200, 'Student can retrieve application details by ID');
    assert(appDetailRes.body.data.job.title === jobA.title, 'Details include complete opportunity information');
    assert(Array.isArray(appDetailRes.body.data.statusHistory), 'Details include timeline statusHistory array');

    // -------------------------------------------------------------
    // 7. Recruiter Review & Candidate Management
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Recruiter Application Review Workflow ---');

    const recruiterApps = await makeRequest('GET', '/api/applications/company/all', recruiterHeaders);
    assert(recruiterApps.status === 200, 'Recruiter can view applications submitted to company opportunities');
    const foundApp = recruiterApps.body.data.applications.find((a: any) => a.id === jobAAppId);
    assert(Boolean(foundApp), 'Recruiter view contains candidate application');
    assert(foundApp.student.fullName === 'Aarav Sharma', 'Recruiter view includes candidate academic snapshot');

    // Recruiter updates status: APPLIED -> UNDER_REVIEW
    const underReviewRes = await makeRequest('PUT', `/api/applications/${jobAAppId}/status`, recruiterHeaders, {
      status: ApplicationStatus.UNDER_REVIEW,
      note: 'Profile matched core requirements, moving to review.',
    });
    assert(underReviewRes.status === 200, 'Recruiter transitions status to UNDER_REVIEW');
    assert(underReviewRes.body.data.status === ApplicationStatus.UNDER_REVIEW, 'Status updated in database');

    // Recruiter adds internal review note
    const noteRes = await makeRequest('POST', `/api/applications/${jobAAppId}/notes`, recruiterHeaders, {
      note: 'Verified GitHub portfolio and TypeScript experience. Candidate has solid foundation.',
    });
    assert(noteRes.status === 201, 'Recruiter adds internal candidate review note (201 Created)');

    // Recruiter shortlists candidate: UNDER_REVIEW -> SHORTLISTED
    const shortlistRes = await makeRequest('PUT', `/api/applications/${jobAAppId}/status`, recruiterHeaders, {
      status: ApplicationStatus.SHORTLISTED,
      note: 'Shortlisted for technical evaluation.',
    });
    assert(shortlistRes.status === 200, 'Recruiter shortlists candidate (UNDER_REVIEW -> SHORTLISTED)');
    assert(shortlistRes.body.data.status === ApplicationStatus.SHORTLISTED, 'Status updated to SHORTLISTED');

    // Recruiter attempts invalid status leap (e.g. directly to HIRED_PLACED)
    const invalidLeapRes = await makeRequest('PUT', `/api/applications/${jobAAppId}/status`, recruiterHeaders, {
      status: ApplicationStatus.HIRED_PLACED,
      note: 'Attempting invalid jump',
    });
    assert(invalidLeapRes.status === 400, 'Invalid recruiter status transition rejected with 400 Bad Request');

    // -------------------------------------------------------------
    // 8. Application Withdrawal Rules
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Application Withdrawal Rules ---');

    // Rule: Cannot withdraw application once progressed to SHORTLISTED
    const invalidWithdraw = await makeRequest('PUT', `/api/applications/student/${jobAAppId}/withdraw`, studentHeaders, {
      note: 'I want to withdraw now',
    });
    assert(invalidWithdraw.status === 400, 'Cannot withdraw application once progressed to SHORTLISTED (400)');

    // Submit application for Internship A to test valid withdrawal
    const internAppRes = await makeRequest('POST', '/api/applications/apply', studentHeaders, {
      opportunityType: 'INTERNSHIP',
      opportunityId: internshipA.id,
    });
    assert(internAppRes.status === 201, 'Student applies to Internship A');
    const internAppId = internAppRes.body.data.id;

    // Withdraw Internship A application while still in APPLIED
    const validWithdraw = await makeRequest('PUT', `/api/applications/student/${internAppId}/withdraw`, studentHeaders, {
      note: 'Accepted alternate opportunity.',
    });
    assert(validWithdraw.status === 200, 'Student can withdraw pending application (status -> WITHDRAWN)');
    assert(validWithdraw.body.data.status === ApplicationStatus.WITHDRAWN, 'Database reflects WITHDRAWN status');

    // -------------------------------------------------------------
    // 9. Placement Admin Institutional Oversight
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Placement Admin Institutional Oversight ---');

    const adminAppsRes = await makeRequest('GET', '/api/applications/admin/all', placementHeaders);
    assert(adminAppsRes.status === 200, 'Placement Admin can access institutional application listing');
    assert(adminAppsRes.body.data.pagination.total >= 2, 'Admin view aggregates applications institution-wide');

    const adminDetailRes = await makeRequest('GET', `/api/applications/${jobAAppId}`, placementHeaders);
    assert(adminDetailRes.status === 200, 'Placement Admin can inspect detailed application record');
    assert(adminDetailRes.body.data.statusHistory.length >= 3, 'Application statusHistory preserves complete chronological timeline');

    // -------------------------------------------------------------
    // 10. Clean Up Test Opportunities
    // -------------------------------------------------------------
    console.log('\n--- 10. Cleaning Up Test Fixtures ---');
    await prisma.application.deleteMany({
      where: {
        OR: [
          { jobId: { in: [jobA.id, jobB.id, jobC.id, jobD.id] } },
          { internshipId: internshipA.id },
        ],
      },
    });
    await prisma.job.deleteMany({
      where: { id: { in: [jobA.id, jobB.id, jobC.id, jobD.id] } },
    });
    await prisma.internship.deleteMany({
      where: { id: internshipA.id },
    });
    console.log('✅ [PASS] Cleaned up temporary test fixtures');

    console.log('\n================================================================');
    console.log('🏁 Step 7 Test Summary: ALL 28 TESTS PASSED');
    console.log('================================================================\n');
  } finally {
    await prisma.$disconnect();
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
