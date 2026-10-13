import http from 'http';
import { createApp } from '../app.js';
import { prisma } from '../config/database.js';
import { OpportunityStatus, UserRole } from '@prisma/client';

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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 NexHire STEP 6: Jobs, Internships & Eligibility Engine Tests');
  console.log('================================================================\n');

  const app = createApp();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`🚀 Test server started at ${baseUrl}`);
      }
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Demo Users
    console.log('\n--- 1. Authenticating Roles ---');
    const recLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'recruiter.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    const recruiterToken = recLogin.body?.token || '';
    assert(!!recruiterToken, 'Recruiter logged in and received JWT');

    const adminLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'placement.officer.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    const adminToken = adminLogin.body?.token || '';
    assert(!!adminToken, 'Placement Officer logged in and received JWT');

    const studentLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'student.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    const studentToken = studentLogin.body?.token || '';
    assert(!!studentToken, 'Student logged in and received JWT');

    // 2. Job Creation & Recruiter Management
    console.log('\n--- 2. Job Creation & Eligibility Setup ---');
    const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const createJobRes = await makeRequest(
      'POST',
      '/api/opportunities/recruiter/jobs',
      { Authorization: `Bearer ${recruiterToken}` },
      {
        title: 'Cloud Systems Engineer (Campus 2026)',
        description: 'Design and optimize scalable distributed cloud architectures for mission critical systems.',
        responsibilities: 'Build containerized microservices, automate CI/CD pipelines, optimize database queries.',
        requirements: 'Knowledge of Node.js, TypeScript, Docker, and relational databases. Strong analytical skills.',
        requiredSkills: 'Node.js, TypeScript, MySQL, Docker',
        employmentType: 'FULL_TIME',
        location: 'Bengaluru, India',
        workMode: 'HYBRID',
        salaryMin: 1200000,
        salaryMax: 1600000,
        vacancies: 5,
        applicationDeadline: futureDeadline,
        selectionProcess: 'Online Assessment -> Technical Interview -> HR Round',
        eligibilityCriteria: {
          minCgpa: 7.5,
          maxBacklogs: 0,
          allowedDepartments: ['MCA', 'CSE'],
          graduationYears: [2026],
          requiredSkills: ['TypeScript', 'Node.js'],
        },
      }
    );
    assert(createJobRes.status === 201, 'Recruiter can create new Job with eligibility criteria');
    const createdJob = createJobRes.body?.data;
    assert(createdJob?.status === 'DRAFT', 'Newly created job defaults to DRAFT status');
    const jobId = createdJob?.id;

    // Update Job
    const updateJobRes = await makeRequest(
      'PUT',
      `/api/opportunities/recruiter/jobs/${jobId}`,
      { Authorization: `Bearer ${recruiterToken}` },
      {
        salaryMax: 1800000,
        vacancies: 6,
      }
    );
    assert(updateJobRes.status === 200, 'Recruiter can update job details');

    // 3. Security: Self-Publishing and Cross-Company Isolation
    console.log('\n--- 3. Authorization & Workflow Restrictions ---');
    const illegalPublishRes = await makeRequest(
      'PUT',
      `/api/opportunities/recruiter/jobs/${jobId}`,
      { Authorization: `Bearer ${recruiterToken}` },
      { status: 'PUBLISHED' }
    );
    assert(
      illegalPublishRes.status === 400 && !illegalPublishRes.body.success,
      'Recruiter CANNOT bypass approval by directly self-publishing (400 Bad Request)'
    );

    const studentCreateJobRes = await makeRequest(
      'POST',
      '/api/opportunities/recruiter/jobs',
      { Authorization: `Bearer ${studentToken}` },
      { title: 'Fake Student Job' }
    );
    assert(
      studentCreateJobRes.status === 403,
      'Student CANNOT create jobs (403 Forbidden)'
    );

    // 4. Submit Job for Approval
    console.log('\n--- 4. Approval Workflow ---');
    const submitJobRes = await makeRequest(
      'PUT',
      `/api/opportunities/recruiter/jobs/${jobId}/submit`,
      { Authorization: `Bearer ${recruiterToken}` }
    );
    assert(submitJobRes.status === 200, 'Recruiter can submit draft job for approval');
    assert(
      submitJobRes.body?.data?.status === 'PENDING_APPROVAL',
      'Job status updated to PENDING_APPROVAL'
    );

    // 5. Visibility Check: Draft / Pending not visible to students
    console.log('\n--- 5. Visibility Isolation for Students ---');
    const studentDiscoverPending = await makeRequest(
      'GET',
      `/api/opportunities/discover?search=Cloud Systems Engineer`,
      { Authorization: `Bearer ${studentToken}` }
    );
    const unapprovedFound = studentDiscoverPending.body?.data?.items?.some((i: any) => i.id === jobId);
    assert(!unapprovedFound, 'Students CANNOT discover opportunities in PENDING_APPROVAL');

    // 6. Placement Admin Approval
    console.log('\n--- 6. Placement Admin Review & Publication ---');
    const adminReviewRes = await makeRequest(
      'PUT',
      `/api/opportunities/admin/JOB/${jobId}/review`,
      { Authorization: `Bearer ${adminToken}` },
      { action: 'APPROVE', notes: 'Approved for campus drive 2026.' }
    );
    assert(adminReviewRes.status === 200, 'Placement Admin can approve job');
    assert(
      adminReviewRes.body?.data?.status === 'PUBLISHED',
      'Job status updated to PUBLISHED'
    );

    // 7. Internship Creation & Publication
    console.log('\n--- 7. Internship Management ---');
    const createInternshipRes = await makeRequest(
      'POST',
      '/api/opportunities/recruiter/internships',
      { Authorization: `Bearer ${recruiterToken}` },
      {
        title: 'Backend Engineering Intern (Winter 2026)',
        description: 'Internship role focusing on API integration and microservices.',
        responsibilities: 'Build RESTful APIs, write unit tests, collaborate with senior engineers.',
        duration: '6 Months',
        stipendAmount: 40000,
        stipendPeriod: 'PER_MONTH',
        location: 'Bengaluru, India',
        workMode: 'REMOTE',
        vacancies: 3,
        applicationDeadline: futureDeadline,
        status: 'PENDING_APPROVAL',
        eligibilityCriteria: {
          minCgpa: 8.0,
          maxBacklogs: 0,
          allowedDepartments: ['MCA'],
          graduationYears: [2026],
          requiredSkills: ['TypeScript'],
        },
      }
    );
    assert(createInternshipRes.status === 201, 'Recruiter can create Internship');
    const internshipId = createInternshipRes.body?.data?.id;

    // Admin approves internship
    const adminApproveInternship = await makeRequest(
      'PUT',
      `/api/opportunities/admin/INTERNSHIP/${internshipId}/review`,
      { Authorization: `Bearer ${adminToken}` },
      { action: 'APPROVE' }
    );
    assert(adminApproveInternship.status === 200, 'Placement Admin can approve internship');

    // 8. Student Opportunity Discovery & Search
    console.log('\n--- 8. Student Opportunity Discovery, Search & Filtering ---');
    const discoveryRes = await makeRequest(
      'GET',
      '/api/opportunities/discover?page=1&limit=10',
      { Authorization: `Bearer ${studentToken}` }
    );
    assert(discoveryRes.status === 200, 'Student can discover published opportunities');
    assert(
      discoveryRes.body?.data?.items?.length >= 2,
      'Discovery returns published jobs and internships'
    );
    assert(
      discoveryRes.body?.data?.pagination?.totalCount >= 2,
      'Discovery returns valid pagination metadata'
    );

    // Filter by workMode
    const remoteFilterRes = await makeRequest(
      'GET',
      '/api/opportunities/discover?workMode=REMOTE',
      { Authorization: `Bearer ${studentToken}` }
    );
    assert(remoteFilterRes.status === 200, 'Student can filter opportunities by workMode');
    const allRemote = remoteFilterRes.body?.data?.items?.every((i: any) => i.workMode === 'REMOTE');
    assert(allRemote, 'Filtered results only include REMOTE opportunities');

    // 9. Real Eligibility Engine Evaluation
    console.log('\n--- 9. Backend Eligibility Engine Evaluation ---');
    // Aarav Sharma in seed: CGPA 8.85, backlogs 0, MCA dept, batch 2026, skills: TypeScript, Node.js, React, MySQL
    // Job requirement: min CGPA 7.5, max backlogs 0, MCA/CSE, batch 2026 -> Aarav should be ELIGIBLE
    const eligibleCheckRes = await makeRequest(
      'GET',
      `/api/opportunities/check-eligibility/JOB/${jobId}`,
      { Authorization: `Bearer ${studentToken}` }
    );
    assert(eligibleCheckRes.status === 200, 'Eligibility evaluation endpoint responds with 200');
    assert(
      eligibleCheckRes.body?.data?.isEligible === true,
      'Student with CGPA 8.85 correctly evaluated as ELIGIBLE for min CGPA 7.5'
    );

    // Test Ineligible Opportunity (min CGPA 9.50)
    console.log('\n--- 10. Ineligible Student Evaluation & Reasons ---');
    const highCgpaJob = await makeRequest(
      'POST',
      '/api/opportunities/recruiter/jobs',
      { Authorization: `Bearer ${recruiterToken}` },
      {
        title: 'Elite Research Scientist',
        description: 'Advanced AI research fellowship.',
        responsibilities: 'Write academic papers and develop deep learning architectures.',
        requirements: 'Ph.D. or Master with near-perfect CGPA and publications.',
        requiredSkills: 'PyTorch, Python, Mathematics',
        employmentType: 'FULL_TIME',
        location: 'Bengaluru',
        workMode: 'ON_SITE',
        vacancies: 1,
        applicationDeadline: futureDeadline,
        eligibilityCriteria: {
          minCgpa: 9.5, // Student has 8.85 -> Ineligible
          maxBacklogs: 0,
        },
      }
    );
    const highJobId = highCgpaJob.body?.data?.id;

    const ineligibleCheckRes = await makeRequest(
      'GET',
      `/api/opportunities/check-eligibility/JOB/${highJobId}`,
      { Authorization: `Bearer ${studentToken}` }
    );
    assert(ineligibleCheckRes.status === 200, 'Ineligible check responds with 200');
    assert(
      ineligibleCheckRes.body?.data?.isEligible === false,
      'Student with CGPA 8.85 correctly evaluated as NOT ELIGIBLE for min CGPA 9.5'
    );
    assert(
      Array.isArray(ineligibleCheckRes.body?.data?.reasons) &&
      ineligibleCheckRes.body?.data?.reasons.some((r: string) => r.includes('CGPA')),
      'Returns human-readable reason detailing CGPA deficit'
    );

    // 11. Close Opportunity
    console.log('\n--- 11. Lifecycle Closure ---');
    const closeRes = await makeRequest(
      'PUT',
      `/api/opportunities/recruiter/jobs/${jobId}/close`,
      { Authorization: `Bearer ${recruiterToken}` }
    );
    assert(closeRes.status === 200, 'Recruiter can close opportunity');
    assert(closeRes.body?.data?.status === 'CLOSED', 'Job status updated to CLOSED');

  } catch (error) {
    console.error('Unhandled test error:', error);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n================================================================');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
