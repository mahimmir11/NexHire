import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';

interface EndpointTestState {
  status?: number;
  message?: string;
  loading?: boolean;
}

export const DashboardLandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, EndpointTestState>>({});

  const testEndpoints = [
    { id: 'protected', label: 'Any Authenticated User', endpoint: 'protected', required: 'All Roles' },
    { id: 'super-admin', label: 'Super Admin Endpoint', endpoint: 'super-admin', required: 'SUPER_ADMIN' },
    { id: 'placement-admin', label: 'Placement Admin Endpoint', endpoint: 'placement-admin', required: 'PLACEMENT_ADMIN / SUPER_ADMIN' },
    { id: 'student', label: 'Student Endpoint', endpoint: 'student', required: 'STUDENT' },
    { id: 'recruiter', label: 'Recruiter Endpoint', endpoint: 'recruiter', required: 'RECRUITER' },
  ];

  const handleTest = async (testId: string, endpoint: string) => {
    setTestResults((prev) => ({ ...prev, [testId]: { loading: true } }));
    try {
      const res = await authService.testEndpoint(endpoint);
      setTestResults((prev) => ({
        ...prev,
        [testId]: {
          status: res.status,
          message: res.message,
          loading: false,
        },
      }));
    } catch (err: unknown) {
      setTestResults((prev) => ({
        ...prev,
        [testId]: {
          status: 500,
          message: err instanceof Error ? err.message : 'Request failed',
          loading: false,
        },
      }));
    }
  };

  const testAll = async () => {
    for (const t of testEndpoints) {
      await handleTest(t.id, t.endpoint);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF6F0] text-[#143026] flex flex-col justify-between p-4 sm:p-8">
      {/* Background ambient decorative glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#A7D6C0]/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#61B795]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#2E9D74]/15 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full pt-2 pb-6 flex items-center justify-between border-b border-[#A7D6C0]/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center shadow-md shadow-[#2E9D74]/25 ring-2 ring-white">
            <span className="font-extrabold text-xl text-white">N</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#143026]">NexHire Portal</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2E9D74]/15 text-[#2E9D74] border border-[#2E9D74]/30 font-bold">
                {user?.role}
              </span>
            </div>
            <p className="text-[11px] text-[#4d7565]">
              Authenticated as <span className="font-semibold text-[#1a2e26]">{user?.email}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full py-6 flex-1 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 border border-[#A7D6C0] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E9D74] bg-[#2E9D74]/10 px-2.5 py-1 rounded-md">
                Session Active &bull; Role-Based Authorization
              </span>
              <h2 className="text-2xl font-black text-[#143026] mt-2 tracking-tight">
                Welcome, {user?.profile?.fullName || user?.email}
              </h2>
              <p className="text-xs text-[#4b7161] mt-1 max-w-2xl leading-relaxed">
                Your authentication credentials have been verified by the backend. You are currently authorized under the{' '}
                <strong className="text-[#2E9D74]">{user?.role}</strong> role.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-[#EAF6F0] p-3 rounded-xl border border-[#A7D6C0]">
              <div className="h-3 w-3 rounded-full bg-[#2E9D74] animate-ping"></div>
              <div className="text-xs">
                <span className="text-[#5b8071] block font-medium">Session Status</span>
                <span className="font-bold text-[#143026]">Cryptographically Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Identity Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0] p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4d7565] mb-3">
              User Credentials
            </h3>
            <div className="space-y-2 text-xs font-mono bg-[#EAF6F0]/80 rounded-xl p-3 border border-[#A7D6C0]/70">
              <div className="flex justify-between">
                <span className="text-[#5b8071]">User ID:</span>
                <span className="font-bold text-[#143026]">#{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5b8071]">Email:</span>
                <span className="font-bold text-[#143026]">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5b8071]">System Role:</span>
                <span className="font-bold text-[#2E9D74]">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5b8071]">Account Status:</span>
                <span className="font-bold text-[#2E9D74]">
                  {user?.isActive ? 'Active & Validated' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0] p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4d7565] mb-3">
              Role Profile Association
            </h3>
            <div className="space-y-2 text-xs font-mono bg-[#EAF6F0]/80 rounded-xl p-3 border border-[#A7D6C0]/70">
              <div className="flex justify-between">
                <span className="text-[#5b8071]">Name:</span>
                <span className="font-bold text-[#143026]">{user?.profile?.fullName || 'N/A'}</span>
              </div>
              {user?.profile?.studentId && (
                <div className="flex justify-between">
                  <span className="text-[#5b8071]">Student ID:</span>
                  <span className="font-bold text-[#143026]">{user.profile.studentId}</span>
                </div>
              )}
              {user?.profile?.department && (
                <div className="flex justify-between">
                  <span className="text-[#5b8071]">Department:</span>
                  <span className="font-bold text-[#143026]">{user.profile.department}</span>
                </div>
              )}
              {user?.profile?.companyName && (
                <div className="flex justify-between">
                  <span className="text-[#5b8071]">Company:</span>
                  <span className="font-bold text-[#143026]">{user.profile.companyName}</span>
                </div>
              )}
              {user?.profile?.designation && (
                <div className="flex justify-between">
                  <span className="text-[#5b8071]">Designation:</span>
                  <span className="font-bold text-[#143026]">{user.profile.designation}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#5b8071]">Last Login:</span>
                <span className="font-bold text-[#143026]">Just now</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0] p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4d7565] mb-3">
              Security Specifications
            </h3>
            <ul className="text-xs text-[#3b6051] space-y-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E9D74]"></span>
                <span>Bcrypt Salt Rounds: <strong>10</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E9D74]"></span>
                <span>Token: <strong>HMAC-SHA256 JWT</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E9D74]"></span>
                <span>Storage: <strong>HTTP-Only + Bearer</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E9D74]"></span>
                <span>Auditing: <strong>Non-sensitive action logs</strong></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Backend RBAC Tester */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 border border-[#A7D6C0] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#143026]">
                Live Backend RBAC Authorization Tester
              </h3>
              <p className="text-xs text-[#4b7161]">
                Execute live requests against Express endpoints to test real-time backend role enforcement
              </p>
            </div>
            <button
              onClick={testAll}
              className="px-3.5 py-1.5 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              Test All Endpoints
            </button>
          </div>

          <div className="space-y-2.5">
            {testEndpoints.map((t) => {
              const res = testResults[t.id];
              const isAllowed = res?.status === 200;
              const isForbidden = res?.status === 403;

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-[#EAF6F0]/70 border border-[#A7D6C0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded text-[#2E9D74] border border-[#A7D6C0]/70">
                      GET /api/auth/test/{t.endpoint}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#143026] block">{t.label}</span>
                      <span className="text-[11px] text-[#5b8071]">Allowed: {t.required}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {res && !res.loading && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          isAllowed
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isForbidden
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isAllowed ? '200 OK (Allowed)' : isForbidden ? '403 Forbidden (Blocked)' : `HTTP ${res.status}`}
                      </span>
                    )}

                    <button
                      onClick={() => handleTest(t.id, t.endpoint)}
                      disabled={res?.loading}
                      className="px-3 py-1 rounded-lg bg-white hover:bg-[#A7D6C0]/30 text-[#143026] border border-[#A7D6C0] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {res?.loading ? 'Pinging...' : 'Test Route'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-6 pb-2 text-center text-xs text-[#4b7161] border-t border-[#A7D6C0]/60">
        <p>NexHire &bull; Campus Internship &amp; Placement Management System &bull; Step 3 Auth Verified</p>
      </footer>
    </div>
  );
};
