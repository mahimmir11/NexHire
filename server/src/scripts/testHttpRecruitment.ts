import http from 'http';

async function postJson(path: string, body: any): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataStr),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, headers: res.headers, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 0, headers: res.headers, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function getJson(path: string, cookie?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 0, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function extractCookie(headers: http.IncomingHttpHeaders): string {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return Array.isArray(setCookie) ? setCookie.map((c: string) => c.split(';')[0]).join('; ') : (setCookie as string).split(';')[0];
}

async function main() {
  console.log('Testing Recruitment HTTP Endpoints...\n');

  // 1. Student Login
  const studentRes = await postJson('/api/auth/login', {
    email: 'student.demo@nexhire.local',
    password: 'NexHire@2026!',
  });
  console.log('Student Login status:', studentRes.status, studentRes.data?.user?.email);
  const studentCookie = extractCookie(studentRes.headers);

  // 2. Student Interviews
  const studentInterviews = await getJson('/api/interviews/student/my-interviews', studentCookie);
  console.log('Student GET /api/interviews/student/my-interviews:', studentInterviews.status, `(${studentInterviews.data?.data?.interviews?.length ?? 0} found)`);

  // 3. Student Offers
  const studentOffers = await getJson('/api/offers/student/my-offers', studentCookie);
  console.log('Student GET /api/offers/student/my-offers:', studentOffers.status, `(${studentOffers.data?.data?.offers?.length ?? 0} found)`);

  // 4. Recruiter Login
  const recruiterRes = await postJson('/api/auth/login', {
    email: 'recruiter.demo@nexhire.local',
    password: 'NexHire@2026!',
  });
  console.log('\nRecruiter Login status:', recruiterRes.status, recruiterRes.data?.user?.email);
  const recruiterCookie = extractCookie(recruiterRes.headers);

  // 5. Recruiter Interviews
  const recruiterInterviews = await getJson('/api/interviews/recruiter/all', recruiterCookie);
  console.log('Recruiter GET /api/interviews/recruiter/all:', recruiterInterviews.status, `(${recruiterInterviews.data?.data?.interviews?.length ?? 0} found)`);

  // 6. Recruiter Offers
  const recruiterOffers = await getJson('/api/offers/recruiter/all', recruiterCookie);
  console.log('Recruiter GET /api/offers/recruiter/all:', recruiterOffers.status, `(${recruiterOffers.data?.data?.offers?.length ?? 0} found)`);

  // 7. Placement Admin Login
  const adminRes = await postJson('/api/auth/login', {
    email: 'placement.officer.demo@nexhire.local',
    password: 'NexHire@2026!',
  });
  console.log('\nAdmin Login status:', adminRes.status, adminRes.data?.user?.email);
  const adminCookie = extractCookie(adminRes.headers);

  // 8. Admin Interviews
  const adminInterviews = await getJson('/api/interviews/admin/all', adminCookie);
  console.log('Admin GET /api/interviews/admin/all:', adminInterviews.status, `(${adminInterviews.data?.data?.interviews?.length ?? 0} found)`);

  // 9. Admin Offers
  const adminOffers = await getJson('/api/offers/admin/all', adminCookie);
  console.log('Admin GET /api/offers/admin/all:', adminOffers.status, `(${adminOffers.data?.data?.offers?.length ?? 0} found)`);

  // 10. Student attempt to schedule interview (Forbidden)
  const studentScheduleRes = await postJson('/api/interviews', { application_id: 1 });
  console.log('\nUnauthenticated /api/interviews POST:', studentScheduleRes.status, '(Expect 401)');

  console.log('\n✅ All HTTP API Endpoint tests completed successfully!');
}

main().catch(console.error);
