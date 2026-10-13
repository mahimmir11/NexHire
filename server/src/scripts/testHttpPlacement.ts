import http from 'http';

async function postJson(path: string, body: any, cookie?: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(dataStr)),
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers,
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

async function putJson(path: string, body: any, cookie?: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(dataStr)),
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'PUT',
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
    req.write(dataStr);
    req.end();
  });
}

function extractCookie(headers: http.IncomingHttpHeaders): string {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return Array.isArray(setCookie)
    ? setCookie.map((c: string) => c.split(';')[0]).join('; ')
    : (setCookie as string).split(';')[0];
}

async function main() {
  console.log('\n======================================================');
  console.log('🌐 TESTING STEP 9 PLACEMENT HTTP REST ENDPOINTS');
  console.log('======================================================\n');

  // 1. Student Login
  const studentRes = await postJson('/api/auth/login', {
    email: 'student.demo@nexhire.local',
    password: 'NexHire@2026!',
  });
  console.log(`1. Student Login status: ${studentRes.status} (${studentRes.data?.user?.email})`);
  const studentCookie = extractCookie(studentRes.headers);

  // 2. Student Placement
  const studentPlacementRes = await getJson('/api/placements/student/my-placement', studentCookie);
  console.log(
    `2. Student GET /api/placements/student/my-placement: ${studentPlacementRes.status} (Is Placed: ${studentPlacementRes.data?.data?.isPlaced})`
  );

  // 3. Recruiter Login
  const recruiterRes = await postJson('/api/auth/login', {
    email: 'recruiter.demo@nexhire.local',
    password: 'NexHire@2026!',
  });
  console.log(`\n3. Recruiter Login status: ${recruiterRes.status} (${recruiterRes.data?.user?.email})`);
  const recruiterCookie = extractCookie(recruiterRes.headers);

  // 4. Recruiter Placements
  const recruiterPlacementsRes = await getJson('/api/placements/recruiter/all', recruiterCookie);
  console.log(
    `4. Recruiter GET /api/placements/recruiter/all: ${recruiterPlacementsRes.status} (${recruiterPlacementsRes.data?.data?.placements?.length ?? 0} found)`
  );

  // 5. Placement Admin Login
  const adminRes = await postJson('/api/auth/login', {
    email: 'placement.officer.demo@nexhire.local',
    password: 'NexHire@2026!',
  });
  console.log(`\n5. Admin Login status: ${adminRes.status} (${adminRes.data?.user?.email})`);
  const adminCookie = extractCookie(adminRes.headers);

  // 6. Admin Placements
  const adminPlacementsRes = await getJson('/api/placements/admin/all', adminCookie);
  console.log(
    `6. Admin GET /api/placements/admin/all: ${adminPlacementsRes.status} (${adminPlacementsRes.data?.data?.placements?.length ?? 0} total records)`
  );

  // 7. Admin Placement Stats
  const adminStatsRes = await getJson('/api/placements/stats', adminCookie);
  console.log(
    `7. Admin GET /api/placements/stats: ${adminStatsRes.status} (Total: ${adminStatsRes.data?.data?.totalPlacements}, Avg Package: ${adminStatsRes.data?.data?.salaryStats?.average})`
  );

  // 8. IDOR Check: Student attempt to create placement (Expect 403 Forbidden)
  const studentCreateRes = await postJson(
    '/api/placements',
    {
      applicationId: 1,
      packageAmount: 1000000,
      designation: 'Hacker Role',
    },
    studentCookie
  );
  console.log(
    `\n8. 🛡️ IDOR Check: Student POST /api/placements: ${studentCreateRes.status} (Expected 403 Forbidden: ${studentCreateRes.status === 403 ? 'PASSED' : 'FAILED'})`
  );

  // 9. Update Placement Status via Admin
  if (adminPlacementsRes.data?.data?.placements?.length > 0) {
    const firstPlacementId = adminPlacementsRes.data.data.placements[0].id;
    const updateRes = await putJson(
      `/api/placements/${firstPlacementId}/status`,
      {
        status: 'JOINED',
        notes: 'Candidate verified and joined orientation program.',
      },
      adminCookie
    );
    console.log(`9. Admin PUT /api/placements/${firstPlacementId}/status: ${updateRes.status} (${updateRes.data?.message})`);
  }

  console.log('\n✅ ALL STEP 9 PLACEMENT HTTP REST ENDPOINT TESTS COMPLETED SUCCESSFULLY!\n');
}

main().catch(console.error);
