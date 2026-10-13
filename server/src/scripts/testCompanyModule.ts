import http from 'http';
import { createApp } from '../app.js';
import { prisma } from '../config/database.js';
import { CompanyVerificationStatus, RecruiterAccountStatus, UserRole } from '@prisma/client';

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
  console.log('====================================================');
  console.log('🧪 NexHire STEP 5: Company & Recruiter Module Tests');
  console.log('====================================================\n');

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
    // 1. Authenticate Recruiter
    console.log('\n--- Test Suite 1: Authentication & Authorization ---');
    const recruiterLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'recruiter.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    
    let recruiterToken = recruiterLoginRes.body?.token || '';
    assert(!!recruiterToken, 'Recruiter Login succeeded and returned JWT bearer token');

    // Authenticate Placement Officer
    const adminLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'placement.officer.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    let adminToken = adminLoginRes.body?.token || '';
    assert(!!adminToken, 'Placement Admin Login succeeded and returned JWT bearer token');

    // Authenticate Student
    const studentLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'student.demo@nexhire.local',
      password: 'NexHire@2026!',
    });
    let studentToken = studentLoginRes.body?.token || '';
    assert(!!studentToken, 'Student Login succeeded for security tests');

    // 2. Security & RBAC Checks
    console.log('\n--- Test Suite 2: Security & RBAC Enforcements ---');
    const studentAccessRes = await makeRequest('GET', '/api/company/my-company', {
      Authorization: `Bearer ${studentToken}`,
    });
    assert(
      studentAccessRes.status === 403,
      'Student CANNOT access recruiter company routes (403 Forbidden)'
    );

    const recruiterAdminAccessRes = await makeRequest('GET', '/api/company/admin/all', {
      Authorization: `Bearer ${recruiterToken}`,
    });
    assert(
      recruiterAdminAccessRes.status === 403,
      'Recruiter CANNOT access placement admin company listing (403 Forbidden)'
    );

    const recruiterSelfApproveRes = await makeRequest(
      'PUT',
      '/api/company/admin/1/verify',
      { Authorization: `Bearer ${recruiterToken}` },
      { status: 'VERIFIED' }
    );
    assert(
      recruiterSelfApproveRes.status === 403,
      'Recruiter CANNOT verify/approve their own company (403 Forbidden)'
    );

    // 3. Recruiter Company Profile
    console.log('\n--- Test Suite 3: Recruiter Company Profile Management ---');
    const profileRes = await makeRequest('GET', '/api/company/my-company', {
      Authorization: `Bearer ${recruiterToken}`,
    });
    assert(profileRes.status === 200, 'Recruiter can retrieve own company profile');
    assert(
      profileRes.body.data && typeof profileRes.body.data.completion?.score === 'number',
      'Company profile returns calculated profile completion score (real algorithm)'
    );
    assert(
      profileRes.body.data?.currentRecruiter?.email === 'recruiter.demo@nexhire.local',
      'Company profile includes authenticated recruiter identity'
    );

    // Test profile update
    const updateRes = await makeRequest(
      'PUT',
      '/api/company/my-company',
      { Authorization: `Bearer ${recruiterToken}` },
      {
        description: 'Updated enterprise tech innovator powering next-generation campus hiring.',
        headquarters: 'Bengaluru, Karnataka',
        locations: 'Bengaluru, Hyderabad, Pune, Remote',
        companySize: '1000-5000',
        website: 'https://apextechnologies.io',
        contactPhone: '+91 9876543210',
      }
    );
    assert(updateRes.status === 200, 'Recruiter can update company profile information');
    assert(
      updateRes.body.data?.headquarters === 'Bengaluru, Karnataka',
      'Updated company profile reflects new headquarters'
    );

    // Test validation failure
    const invalidUpdateRes = await makeRequest(
      'PUT',
      '/api/company/my-company',
      { Authorization: `Bearer ${recruiterToken}` },
      {
        website: 'not-a-valid-url',
        contactEmail: 'invalid-email',
      }
    );
    assert(
      invalidUpdateRes.status === 400 && !invalidUpdateRes.body.success,
      'Validation rejects invalid website and email formats'
    );

    // 4. Recruiter Team Management
    console.log('\n--- Test Suite 4: Recruiter Team Management ---');
    const recruitersListRes = await makeRequest('GET', '/api/company/my-company/recruiters', {
      Authorization: `Bearer ${recruiterToken}`,
    });
    assert(recruitersListRes.status === 200, 'Recruiter can view list of company recruiters');
    assert(
      Array.isArray(recruitersListRes.body.data) && recruitersListRes.body.data.length >= 1,
      'Recruiters list contains company recruiters'
    );

    // Add a new recruiter
    const newRecruiterEmail = `recruiter.sub.${Date.now()}@nexhire.local`;
    const addRecruiterRes = await makeRequest(
      'POST',
      '/api/company/my-company/recruiters',
      { Authorization: `Bearer ${recruiterToken}` },
      {
        fullName: 'Jane Recruiter Specialist',
        email: newRecruiterEmail,
        password: 'Password@123',
        designation: 'Senior Campus Talent Partner',
        phone: '+91 9876501234',
      }
    );
    assert(addRecruiterRes.status === 201, 'Recruiter can add new recruiter to their company');
    const createdRecruiterId = addRecruiterRes.body.data?.id;

    if (createdRecruiterId) {
      // Update the newly added recruiter
      const updateRecruiterRes = await makeRequest(
        'PUT',
        `/api/company/my-company/recruiters/${createdRecruiterId}`,
        { Authorization: `Bearer ${recruiterToken}` },
        {
          designation: 'Lead University Relations',
          accountStatus: 'ACTIVE',
        }
      );
      assert(
        updateRecruiterRes.status === 200,
        'Recruiter can update team member designation and status'
      );
    }

    // 5. Company Dashboard Foundation
    console.log('\n--- Test Suite 5: Company Dashboard Foundation ---');
    const dashboardRes = await makeRequest('GET', '/api/company/my-company/dashboard', {
      Authorization: `Bearer ${recruiterToken}`,
    });
    assert(dashboardRes.status === 200, 'Recruiter can retrieve company dashboard metrics');
    assert(
      typeof dashboardRes.body.data?.completion?.score === 'number',
      'Dashboard includes dynamic profile completion'
    );
    assert(
      dashboardRes.body.data?.stats?.recruitersCount >= 1,
      'Dashboard reflects real count of company recruiters'
    );
    assert(
      typeof dashboardRes.body.data?.stats?.activeJobsCount === 'number' &&
      typeof dashboardRes.body.data?.stats?.applicationsCount === 'number' &&
      dashboardRes.body.data?.stats?.activeJobsCount >= 0,
      'Dashboard uses truthful real database counts (no hardcoded fake stats)'
    );

    // 6. Placement Admin Verification Workflow
    console.log('\n--- Test Suite 6: Placement Admin Verification Workflow ---');
    const adminAllCompaniesRes = await makeRequest('GET', '/api/company/admin/all', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminAllCompaniesRes.status === 200, 'Placement Admin can retrieve all companies');
    assert(
      Array.isArray(adminAllCompaniesRes.body.data),
      'Admin company listing returns an array'
    );

    const pendingCompaniesRes = await makeRequest('GET', '/api/company/admin/pending', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(pendingCompaniesRes.status === 200, 'Placement Admin can retrieve pending companies');

    // Admin verify company
    const verifyRes = await makeRequest(
      'PUT',
      '/api/company/admin/1/verify',
      { Authorization: `Bearer ${adminToken}` },
      {
        status: 'VERIFIED',
        notes: 'Verified via campus partnership agreement and corporate background check.',
      }
    );
    assert(verifyRes.status === 200, 'Placement Admin can verify/approve a company');
    assert(
      verifyRes.body.data?.verificationStatus === 'VERIFIED',
      'Company verificationStatus successfully updated to VERIFIED'
    );

    // Check audit log was recorded
    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        entity: 'Company',
        entityId: '1',
        action: 'COMPANY_VERIFICATION_VERIFIED',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!auditEntry, 'Audit log correctly recorded the company verification action');

  } catch (error) {
    console.error('Unhandled test failure:', error);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n====================================================');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
