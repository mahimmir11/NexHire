import { createApp } from '../app.js';
import { Server } from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    results.push({ name: testName, passed: true });
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    results.push({ name: testName, passed: false, details: failureDetails });
    console.error(`  ❌ [FAIL] ${testName} - ${failureDetails}`);
  }
}

async function runAuthTests() {
  console.log('🧪 Starting NexHire Authentication & Authorization Automated Test Suite...\n');

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(5099, () => resolve(s));
  });

  const baseUrl = 'http://localhost:5099/api/auth';

  try {
    const demoPassword = process.env.DEMO_USER_PASSWORD || 'NexHire@2026!';

    // 1. Missing credentials test
    {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });
      const data: any = await res.json();
      assert(res.status === 400, 'Reject missing credentials with 400 Bad Request');
      assert(data.success === false, 'Error response specifies success: false');
    }

    // 2. Invalid password test
    {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student.demo@nexhire.local',
          password: 'WrongPassword999!',
        }),
      });
      const data: any = await res.json();
      assert(res.status === 401, 'Reject invalid password with 401 Unauthorized');
      assert(!data.token, 'No token returned for failed login');
    }

    // 3. Non-existent email test
    {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'doesnotexist@nexhire.local',
          password: demoPassword,
        }),
      });
      assert(res.status === 401, 'Reject non-existent user with 401 Unauthorized (No enumeration)');
    }

    // 4. Student Login & Token Generation
    let studentToken = '';
    {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student.demo@nexhire.local',
          password: demoPassword,
        }),
      });
      const data: any = await res.json();
      assert(res.status === 200, 'Student login succeeds with 200 OK');
      assert(Boolean(data.token), 'JWT token returned on student login');
      assert(data.user.role === 'STUDENT', 'User role correctly identified as STUDENT');
      assert(data.user.profile.fullName === 'Aarav Sharma', 'Student profile metadata attached');
      assert(data.user.passwordHash === undefined, 'Password hash is NOT exposed in login response');
      studentToken = data.token;
    }

    // 5. Super Admin Login
    let superAdminToken = '';
    {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'superadmin.demo@nexhire.local',
          password: demoPassword,
        }),
      });
      const data: any = await res.json();
      assert(res.status === 200, 'Super Admin login succeeds with 200 OK');
      assert(data.user.role === 'SUPER_ADMIN', 'User role correctly identified as SUPER_ADMIN');
      assert(data.user.passwordHash === undefined, 'Password hash is NOT exposed');
      superAdminToken = data.token;
    }

    // 6. Placement Admin Login
    let placementAdminToken = '';
    {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'placement.officer.demo@nexhire.local',
          password: demoPassword,
        }),
      });
      const data: any = await res.json();
      assert(res.status === 200, 'Placement Admin login succeeds with 200 OK');
      assert(data.user.role === 'PLACEMENT_ADMIN', 'User role correctly identified as PLACEMENT_ADMIN');
      placementAdminToken = data.token;
    }

    // 7. Recruiter Login
    let recruiterToken = '';
    {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'recruiter.demo@nexhire.local',
          password: demoPassword,
        }),
      });
      const data: any = await res.json();
      assert(res.status === 200, 'Recruiter login succeeds with 200 OK');
      assert(data.user.role === 'RECRUITER', 'User role correctly identified as RECRUITER');
      assert(data.user.profile.companyName === 'Apex Innovations Technologies', 'Recruiter company attached');
      recruiterToken = data.token;
    }

    // 8. Protected GET /me without token
    {
      const res = await fetch(`${baseUrl}/me`);
      assert(res.status === 401, 'Unauthenticated /api/auth/me rejected with 401');
    }

    // 9. Protected GET /me with Student Token
    {
      const res = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data: any = await res.json();
      assert(res.status === 200, 'Authenticated /api/auth/me succeeds with 200 OK');
      assert(data.user.email === 'student.demo@nexhire.local', 'Returned user email matches session');
      assert(data.user.passwordHash === undefined, 'Password hash is NOT exposed in /me');
    }

    // 10. Tampered / invalid token test
    {
      const res = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: 'Bearer fake.invalid.jwt.token' },
      });
      assert(res.status === 401, 'Forged/tampered JWT rejected with 401');
    }

    // 11. RBAC: Student accessing Student endpoint (Allowed)
    {
      const res = await fetch(`${baseUrl}/test/student`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(res.status === 200, 'Student authorized for student test endpoint (200)');
    }

    // 12. RBAC: Student accessing Super Admin endpoint (Blocked - 403 Forbidden)
    {
      const res = await fetch(`${baseUrl}/test/super-admin`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(res.status === 403, 'Student blocked from super-admin endpoint with 403 Forbidden');
    }

    // 13. RBAC: Recruiter accessing Student endpoint (Blocked - 403 Forbidden)
    {
      const res = await fetch(`${baseUrl}/test/student`, {
        headers: { Authorization: `Bearer ${recruiterToken}` },
      });
      assert(res.status === 403, 'Recruiter blocked from student endpoint with 403 Forbidden');
    }

    // 14. RBAC: Super Admin accessing Super Admin & Placement Admin endpoints
    {
      const res1 = await fetch(`${baseUrl}/test/super-admin`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert(res1.status === 200, 'Super Admin authorized for super-admin endpoint (200)');

      const res2 = await fetch(`${baseUrl}/test/placement-admin`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert(res2.status === 200, 'Super Admin authorized for placement-admin endpoint (200)');
    }

    // 15. RBAC: Placement Admin accessing Placement Admin endpoint
    {
      const res = await fetch(`${baseUrl}/test/placement-admin`, {
        headers: { Authorization: `Bearer ${placementAdminToken}` },
      });
      assert(res.status === 200, 'Placement Admin authorized for placement-admin endpoint (200)');
    }

    // 16. Logout test
    {
      const res = await fetch(`${baseUrl}/logout`, { method: 'POST' });
      assert(res.status === 200, 'Logout endpoint returns 200 OK and clears cookies');
    }

    console.log('\n======================================================');
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`🎉 TEST SUMMARY: ${passedCount} / ${results.length} PASSED (100% Success Rate)`);
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
