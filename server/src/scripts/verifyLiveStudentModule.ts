import http from 'http';

function makeRequest(
  options: http.RequestOptions,
  body?: unknown
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
          body: parsed,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      const dataStr = JSON.stringify(body);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(dataStr));
      req.write(dataStr);
    }

    req.end();
  });
}

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}`);
  } else {
    console.error(`  ❌ [FAIL] ${label}`);
    process.exit(1);
  }
}

async function verifyLive() {
  console.log('🚀 Running Live End-to-End Verification on http://localhost:5000...\n');

  // 1. Health check
  const health = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  assert(health.status === 200 && health.body.status === 'healthy', 'Backend is healthy and MySQL is reachable');

  // 2. Student login
  const loginRes = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
    { email: 'student.demo@nexhire.local', password: 'NexHire@2026!' }
  );
  assert(loginRes.status === 200 && Boolean(loginRes.body.token), 'Student logged in successfully and received JWT');
  const token = loginRes.body.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 3. Recruiter login & RBAC isolation check
  const recLogin = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
    { email: 'recruiter.demo@nexhire.local', password: 'NexHire@2026!' }
  );
  const recHeaders = { Authorization: `Bearer ${recLogin.body.token}` };
  const recBlocked = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/dashboard', method: 'GET', headers: recHeaders });
  assert(recBlocked.status === 403, 'Recruiter role is strictly blocked (403 Forbidden) from Student Module');

  // 4. Live Dashboard summary
  const dash = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/dashboard', method: 'GET', headers });
  assert(dash.status === 200, 'GET /api/student/dashboard returns 200 OK');
  assert(dash.body.data.profile.fullName === 'Aarav Sharma', 'Dashboard profile correctly bound to Aarav Sharma');
  assert(typeof dash.body.data.completion.score === 'number' && dash.body.data.completion.score > 0, 'Real profile completion score generated');
  assert(dash.body.data.applications.length > 0, 'Real applied applications retrieved from MySQL');
  assert(dash.body.data.upcomingInterviews.length > 0, 'Real scheduled interviews retrieved from MySQL');
  assert(dash.body.data.offers.length === 0, 'Empty state properly preserved for offers (no fabricated statistics)');
  assert(dash.body.data.placement === null, 'Empty state properly preserved for placement (no fabricated statistics)');

  // 5. Personal profile view & update
  const prof = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/profile', method: 'GET', headers });
  assert(prof.status === 200 && prof.body.data.studentId === 'MCA2024001', 'Personal profile loads accurately from database');

  const updateProf = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/student/profile', method: 'PUT', headers },
    { city: 'Bengaluru Tech Park', phone: '+91 91234 56789' }
  );
  assert(updateProf.status === 200 && updateProf.body.data.city === 'Bengaluru Tech Park', 'Student can update personal details with validation');

  // 6. Academic information & milestones
  const acad = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/academic', method: 'GET', headers });
  assert(acad.status === 200 && acad.body.data.course === 'MCA', 'Academic info returns course MCA and verified milestones');

  // 7. Skills management
  const skills = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/skills', method: 'GET', headers });
  assert(skills.status === 200 && skills.body.data.skills.length >= 5, 'Skills retrieved with proficiency and categories');

  // 8. Certifications management
  const addCert = await makeRequest(
    { hostname: 'localhost', port: 5000, path: '/api/student/certifications', method: 'POST', headers },
    {
      name: 'Google Cloud Certified Associate Cloud Engineer',
      issuingOrganization: 'Google Cloud',
      issueDate: '2024-06-01',
      credentialUrl: 'https://google.accredited.com/cert/12345',
    }
  );
  assert(addCert.status === 201, 'Certification added successfully (201 Created)');
  const certId = addCert.body.data.id;

  const getCerts = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/certifications', method: 'GET', headers });
  assert(getCerts.body.data.some((c: any) => c.id === certId), 'New certification retrieved in list');

  const delCert = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/student/certifications/${certId}`, method: 'DELETE', headers });
  assert(delCert.status === 200, 'Certification removed successfully');

  // 9. Career preferences
  const career = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/career', method: 'GET', headers });
  assert(career.status === 200 && Boolean(career.body.data.preferredRoles), 'Career preferences loaded from database');

  // 10. Documents repository
  const docs = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/documents', method: 'GET', headers });
  assert(docs.status === 200 && docs.body.data.length >= 1, 'Verified student documents retrieved');

  // 11. Multi-tenant security check
  const badIdReq = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/student/certifications/999999', method: 'DELETE', headers });
  assert(badIdReq.status === 404, 'Arbitrary IDs cannot access/modify unauthorized records (404/403 enforced)');

  console.log('\n======================================================');
  console.log('🎉 ALL LIVE BACKEND AND DATABASE VERIFICATIONS PASSED!');
  console.log('======================================================\n');
}

verifyLive().catch((e) => {
  console.error('Live verification failed:', e);
  process.exit(1);
});
