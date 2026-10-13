import http from 'http';
import { createApp } from '../app.js';
import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/security.utils.js';
import { UserRole, AcademicStatus } from '@prisma/client';

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

    req.on('error', reject);
    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runStudentTests() {
  console.log('\n🎓 Starting NexHire Student Module Automated Test Suite...\n');

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
        baseUrl = `http://localhost:${port}`;
      }
      resolve();
    });
  });

  try {
    // 1. Authenticate Student
    console.log('1. Authenticating Demo Student...');
    const studentLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'student.demo@nexhire.local',
      password: process.env.DEMO_USER_PASSWORD || 'NexHire@2026!',
    });
    assert(studentLoginRes.status === 200, 'Student login returns 200 OK');
    const studentToken = studentLoginRes.body.token;
    assert(Boolean(studentToken), 'JWT token returned for student');
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    // 2. Authenticate Recruiter (to test RBAC block on student module)
    console.log('2. Authenticating Demo Recruiter...');
    const recruiterLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'recruiter.demo@nexhire.local',
      password: process.env.DEMO_USER_PASSWORD || 'NexHire@2026!',
    });
    assert(recruiterLoginRes.status === 200, 'Recruiter login returns 200 OK');
    const recruiterToken = recruiterLoginRes.body.token;
    const recruiterHeaders = { Authorization: `Bearer ${recruiterToken}` };

    // 3. RBAC Enforcement: Recruiter cannot access student endpoints
    console.log('3. Testing RBAC Student Isolation...');
    const recruiterAccessProfile = await makeRequest('GET', '/api/student/profile', recruiterHeaders);
    assert(recruiterAccessProfile.status === 403, 'Recruiter blocked from GET /api/student/profile with 403 Forbidden');

    const unauthAccessProfile = await makeRequest('GET', '/api/student/profile');
    assert(unauthAccessProfile.status === 401, 'Unauthenticated user blocked from GET /api/student/profile with 401 Unauthorized');

    // 4. Student Dashboard Summary
    console.log('4. Testing Student Dashboard Summary...');
    const dashboardRes = await makeRequest('GET', '/api/student/dashboard', studentHeaders);
    assert(dashboardRes.status === 200, 'GET /api/student/dashboard returns 200 OK');
    assert(dashboardRes.body.success === true, 'Dashboard response has success: true');
    assert(dashboardRes.body.data.profile.fullName === 'Aarav Sharma', 'Dashboard returns correct student name');
    assert(dashboardRes.body.data.completion.score > 0, 'Profile completion score is calculated from real data');
    assert(dashboardRes.body.data.stats.appliedCount >= 1, 'Applied opportunities accurately reflect real DB records');
    assert(Array.isArray(dashboardRes.body.data.upcomingInterviews), 'Upcoming interviews returned as array');

    // 5. Student Profile Management
    console.log('5. Testing Personal Profile Endpoints...');
    const profileRes = await makeRequest('GET', '/api/student/profile', studentHeaders);
    assert(profileRes.status === 200, 'GET /api/student/profile returns 200 OK');
    assert(profileRes.body.data.studentId === 'MCA2024001', 'Student ID correctly retrieved from MySQL');

    // Test profile update with valid data
    const updateProfileRes = await makeRequest('PUT', '/api/student/profile', studentHeaders, {
      phone: '+91 98765 12345',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      pincode: '560100',
    });
    assert(updateProfileRes.status === 200, 'PUT /api/student/profile returns 200 OK on valid data');
    assert(updateProfileRes.body.data.phone === '+91 98765 12345', 'Updated phone saved to database');

    // Test profile validation error with future DOB
    const invalidDobRes = await makeRequest('PUT', '/api/student/profile', studentHeaders, {
      dateOfBirth: '2099-01-01',
    });
    assert(invalidDobRes.status === 400, 'PUT /api/student/profile rejects future DOB with 400 Bad Request');
    assert(invalidDobRes.body.errors.some((e: any) => e.field === 'dateOfBirth'), 'Error correctly flags dateOfBirth');

    // 6. Academic Information Endpoints
    console.log('6. Testing Academic Information Endpoints...');
    const academicRes = await makeRequest('GET', '/api/student/academic', studentHeaders);
    assert(academicRes.status === 200, 'GET /api/student/academic returns 200 OK');
    assert(academicRes.body.data.course === 'MCA', 'Course retrieved correctly');
    assert(Array.isArray(academicRes.body.data.academicRecords), 'Academic milestones array returned');

    // Test academic update
    const updateAcademicRes = await makeRequest('PUT', '/api/student/academic', studentHeaders, {
      cgpa: 8.92,
      percentage: 85.5,
      backlogs: 0,
      semester: 4,
    });
    assert(updateAcademicRes.status === 200, 'PUT /api/student/academic returns 200 OK on valid data');

    // Test academic validation rejection on negative backlogs
    const invalidBacklogsRes = await makeRequest('PUT', '/api/student/academic', studentHeaders, {
      backlogs: -2,
    });
    assert(invalidBacklogsRes.status === 400, 'PUT /api/student/academic rejects negative backlogs with 400 Bad Request');

    // Test creating an academic record
    const addRecordRes = await makeRequest('POST', '/api/student/academic/records', studentHeaders, {
      level: 'CLASS_12',
      institution: 'St. Paul College',
      passingYear: 2020,
      percentage: 89.4,
    });
    assert(addRecordRes.status === 201, 'POST /api/student/academic/records creates milestone record with 201 Created');
    const createdRecordId = addRecordRes.body.data.id;

    // Delete created academic record
    const deleteRecordRes = await makeRequest('DELETE', `/api/student/academic/records/${createdRecordId}`, studentHeaders);
    assert(deleteRecordRes.status === 200, 'DELETE /api/student/academic/records/:id deletes unverified record with 200 OK');

    // 7. Skills Management Endpoints
    console.log('7. Testing Skills Management Endpoints...');
    const skillsRes = await makeRequest('GET', '/api/student/skills', studentHeaders);
    assert(skillsRes.status === 200, 'GET /api/student/skills returns 200 OK');
    assert(Array.isArray(skillsRes.body.data.skills), 'Student skills returned as array');
    assert(Array.isArray(skillsRes.body.data.catalog), 'Catalog skills returned as array');

    // Add skill
    const addSkillRes = await makeRequest('POST', '/api/student/skills', studentHeaders, {
      name: 'Docker & Containerization',
      category: 'TOOL',
      proficiency: 'INTERMEDIATE',
      yearsOfExperience: 1.5,
    });
    assert(addSkillRes.status === 201, 'POST /api/student/skills adds skill with 201 Created');
    const addedSkillId = addSkillRes.body.data.skillId;

    // Remove skill
    const removeSkillRes = await makeRequest('DELETE', `/api/student/skills/${addedSkillId}`, studentHeaders);
    assert(removeSkillRes.status === 200, 'DELETE /api/student/skills/:skillId removes skill with 200 OK');

    // 8. Certifications Management Endpoints
    console.log('8. Testing Certifications CRUD Endpoints...');
    const certCreateRes = await makeRequest('POST', '/api/student/certifications', studentHeaders, {
      name: 'AWS Certified Cloud Practitioner',
      issuingOrganization: 'Amazon Web Services',
      issueDate: '2024-05-15',
      expiryDate: '2027-05-15',
      credentialId: 'AWS-CCP-98765432',
      credentialUrl: 'https://aws.amazon.com/verification/AWS-CCP-98765432',
    });
    assert(certCreateRes.status === 201, 'POST /api/student/certifications creates certification with 201 Created');
    const certId = certCreateRes.body.data.id;

    // Get certifications
    const certListRes = await makeRequest('GET', '/api/student/certifications', studentHeaders);
    assert(certListRes.status === 200, 'GET /api/student/certifications returns 200 OK');
    assert(certListRes.body.data.some((c: any) => c.id === certId), 'Created certification listed in student certifications');

    // Update certification
    const certUpdateRes = await makeRequest('PUT', `/api/student/certifications/${certId}`, studentHeaders, {
      name: 'AWS Certified Cloud Practitioner (CLF-C02)',
      issuingOrganization: 'Amazon Web Services',
      issueDate: '2024-05-15',
      expiryDate: '2027-05-15',
      credentialId: 'AWS-CCP-98765432',
    });
    assert(certUpdateRes.status === 200, 'PUT /api/student/certifications/:id updates certification with 200 OK');
    assert(certUpdateRes.body.data.name.includes('CLF-C02'), 'Certification title updated in database');

    // Delete certification
    const certDeleteRes = await makeRequest('DELETE', `/api/student/certifications/${certId}`, studentHeaders);
    assert(certDeleteRes.status === 200, 'DELETE /api/student/certifications/:id removes certification with 200 OK');

    // 9. Career Information Endpoints
    console.log('9. Testing Career Information Endpoints...');
    const careerRes = await makeRequest('GET', '/api/student/career', studentHeaders);
    assert(careerRes.status === 200, 'GET /api/student/career returns 200 OK');

    const updateCareerRes = await makeRequest('PUT', '/api/student/career', studentHeaders, {
      portfolioUrl: 'https://aaravsharma-dev.example.com',
      githubUrl: 'https://github.com/aarav-sharma-dev',
      linkedinUrl: 'https://linkedin.com/in/aarav-sharma-dev',
      careerInterests: 'Cloud Architecture, Microservices, High Performance Computing',
      preferredRoles: 'Backend Developer, Platform Engineer',
      preferredLocations: 'Bengaluru, Hyderabad, Remote',
    });
    assert(updateCareerRes.status === 200, 'PUT /api/student/career returns 200 OK on valid data');
    assert(updateCareerRes.body.data.preferredRoles === 'Backend Developer, Platform Engineer', 'Career preferences saved');

    // Test career validation: invalid URL
    const invalidUrlRes = await makeRequest('PUT', '/api/student/career', studentHeaders, {
      githubUrl: 'not-a-valid-url-format',
    });
    assert(invalidUrlRes.status === 400, 'PUT /api/student/career rejects invalid URL with 400 Bad Request');

    // 10. Documents List Endpoint
    console.log('10. Testing Document Retrieval Endpoint...');
    const docsRes = await makeRequest('GET', '/api/student/documents', studentHeaders);
    assert(docsRes.status === 200, 'GET /api/student/documents returns 200 OK');
    assert(Array.isArray(docsRes.body.data), 'Student documents returned as array');

    // 11. Multi-Tenant Protection Verification
    console.log('11. Testing Multi-Tenant Protection & Identity Derivation...');
    // Create temporary student B to test isolation
    await prisma.certification.deleteMany({ where: { student: { studentId: 'MCA2024999' } } });
    await prisma.student.deleteMany({ where: { studentId: 'MCA2024999' } });
    await prisma.user.deleteMany({ where: { email: 'student.b.test@nexhire.local' } });

    const demoPasswordHash = await hashPassword('StudentB@2026!');
    const studentBUser = await prisma.user.create({
      data: {
        email: 'student.b.test@nexhire.local',
        passwordHash: demoPasswordHash,
        role: UserRole.STUDENT,
        isActive: true,
        emailVerified: true,
      },
    });

    const mcaDept = await prisma.department.findUnique({ where: { code: 'MCA' } });
    const studentB = await prisma.student.create({
      data: {
        userId: studentBUser.id,
        departmentId: mcaDept!.id,
        fullName: 'Student B Demo',
        studentId: 'MCA2024999',
        enrollmentNumber: 'EN2024MCA0999',
        course: 'MCA',
        program: 'Master of Computer Applications',
        semester: 1,
        graduationYear: 2026,
      },
    });

    // Student B creates a certification
    const studentBCert = await prisma.certification.create({
      data: {
        studentId: studentB.id,
        name: 'Student B Private Cert',
        issuingOrganization: 'Org B',
        issueDate: new Date('2024-01-01'),
      },
    });

    // Student A tries to update Student B's certification -> MUST FAIL with 404 or 403!
    const crossStudentUpdate = await makeRequest('PUT', `/api/student/certifications/${studentBCert.id}`, studentHeaders, {
      name: 'Hacked Cert Name',
      issuingOrganization: 'Hacker Org',
      issueDate: '2024-01-01',
    });
    assert(
      crossStudentUpdate.status === 404 || crossStudentUpdate.status === 403,
      'Student A cannot update Student B certification (Access Denied / Not Found)'
    );

    // Clean up test Student B
    await prisma.certification.deleteMany({ where: { studentId: studentB.id } });
    await prisma.student.delete({ where: { id: studentB.id } });
    await prisma.user.delete({ where: { id: studentBUser.id } });

    console.log('\n======================================================');
    console.log('🎉 STUDENT MODULE BACKEND TEST: ALL TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runStudentTests().catch((err) => {
  console.error('\n❌ Student Module Tests Failed:', err);
  process.exit(1);
});
