import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminService } from '../../services/admin.service';
import type { AdminOverviewStats } from '../../types/admin.types';
import {
  Users,
  Building2,
  Briefcase,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await adminService.getOverviewStats();
        setStats(data);
      } catch (err: any) {
        console.error('Error fetching admin stats:', err);
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatLPA = (amt: number) => {
    if (!amt || isNaN(amt)) return '₹0 LPA';
    if (amt >= 100000) {
      return `₹${(amt / 100000).toFixed(2)} LPA`;
    }
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  return (
    <AdminLayout
      pageTitle="Administrative Command Center"
      pageSubtitle="Real-time institutional recruitment overview across students, companies, and placements"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-xs transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </Link>
          <Link
            to="/admin/placements"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0] text-xs font-bold transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E9D74]" />
            <span>Placements</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-white via-white/95 to-[#EAF6F0] p-6 sm:p-8 rounded-3xl border border-[#A7D6C0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E9D74]/15 border border-[#2E9D74]/30 text-xs font-bold text-[#2E9D74]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Recruitment Management System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#143026] tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-xs sm:text-sm text-[#4d7565]">
              Real-time insights across students, companies, interviews, offers, and verified placements.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Generate Reports</span>
            </Link>
            <Link
              to="/admin/placements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0] text-xs font-bold transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#2E9D74]" />
              <span>Manage Placements</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center text-sm font-semibold text-[#4d7565]">
            Loading real-time institutional statistics...
          </div>
        ) : stats ? (
          <>
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Placements Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0] shadow-sm relative overflow-hidden group hover:border-[#2E9D74] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#4d7565]">
                    Total Placements
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-[#143026]">{stats.placements.total}</span>
                  <span className="text-xs text-[#4d7565] ml-2">({stats.placements.joined} joined)</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#A7D6C0]/30 flex items-center justify-between text-xs text-[#2a4d3e]">
                  <span>Avg: <strong className="text-[#143026]">{formatLPA(stats.placements.averagePackage)}</strong></span>
                  <span>Highest: <strong className="text-[#2E9D74]">{formatLPA(stats.placements.highestPackage)}</strong></span>
                </div>
              </div>

              {/* Applications Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0] shadow-sm relative overflow-hidden group hover:border-[#2E9D74] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#4d7565]">
                    Applications
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-[#143026]">{stats.applications.total}</span>
                  <span className="text-xs text-[#4d7565] ml-2">({stats.applications.shortlisted} shortlisted)</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#A7D6C0]/30 flex items-center justify-between text-xs text-[#2a4d3e]">
                  <span>Hired / Placed:</span>
                  <strong className="text-[#2E9D74] font-bold">{stats.applications.hired} candidates</strong>
                </div>
              </div>

              {/* Opportunities Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0] shadow-sm relative overflow-hidden group hover:border-[#2E9D74] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#4d7565]">
                    Active Drives
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-[#143026]">
                    {stats.opportunities.activeJobs + stats.opportunities.activeInternships}
                  </span>
                  <span className="text-xs text-[#4d7565] ml-2">/ {stats.opportunities.total} total</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#A7D6C0]/30 flex items-center justify-between text-xs text-[#2a4d3e]">
                  <span>Jobs: <strong>{stats.opportunities.activeJobs}</strong></span>
                  <span>Internships: <strong>{stats.opportunities.activeInternships}</strong></span>
                </div>
              </div>

              {/* Companies Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0] shadow-sm relative overflow-hidden group hover:border-[#2E9D74] transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#4d7565]">
                    Partner Companies
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-[#143026]">{stats.companies.total}</span>
                  <span className="text-xs text-[#4d7565] ml-2">({stats.companies.verified} verified)</span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#A7D6C0]/30 flex items-center justify-between text-xs text-[#2a4d3e]">
                  <span>Pending verification:</span>
                  <strong className={stats.companies.pending > 0 ? 'text-amber-600 font-bold' : 'text-gray-500'}>
                    {stats.companies.pending}
                  </strong>
                </div>
              </div>
            </div>

            {/* Funnel & Conversion Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Funnel Progress */}
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-[#143026]">Recruitment Pipeline Conversion</h2>
                    <p className="text-xs text-[#4d7565]">Step-by-step funnel from application to confirmed placement</p>
                  </div>
                  <Link
                    to="/admin/reports"
                    className="text-xs font-bold text-[#2E9D74] hover:text-[#258260] flex items-center gap-1"
                  >
                    View detailed breakdown &rarr;
                  </Link>
                </div>

                <div className="space-y-4">
                  {/* Step 1: Applications */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#143026] mb-1">
                      <span>1. Applications Submitted</span>
                      <span>{stats.applications.total}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-full"></div>
                    </div>
                  </div>

                  {/* Step 2: Shortlisted */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#143026] mb-1">
                      <span>2. Shortlisted Candidates</span>
                      <span>{stats.applications.shortlisted} ({stats.applications.total > 0 ? Math.round((stats.applications.shortlisted / stats.applications.total) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${stats.applications.total > 0 ? Math.min(100, Math.round((stats.applications.shortlisted / stats.applications.total) * 100)) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 3: Interviews Conducted */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#143026] mb-1">
                      <span>3. Interviews Scheduled</span>
                      <span>{stats.recruitment.interviews}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${stats.applications.total > 0 ? Math.min(100, Math.round((stats.recruitment.interviews / stats.applications.total) * 100)) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 4: Offers Issued */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#143026] mb-1">
                      <span>4. Offers Extended</span>
                      <span>{stats.recruitment.offers} ({stats.recruitment.acceptedOffers} accepted)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#61B795] rounded-full"
                        style={{ width: `${stats.applications.total > 0 ? Math.min(100, Math.round((stats.recruitment.offers / stats.applications.total) * 100)) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 5: Confirmed Placements */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#143026] mb-1">
                      <span>5. Official Placements</span>
                      <span className="text-[#2E9D74]">{stats.placements.total}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2E9D74] rounded-full"
                        style={{ width: `${stats.applications.total > 0 ? Math.min(100, Math.round((stats.placements.total / stats.applications.total) * 100)) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-[#4d7565] border-t border-[#A7D6C0]/30">
                  <span>Cumulative package value created:</span>
                  <span className="font-extrabold text-[#143026] text-sm">
                    {formatLPA(stats.placements.totalValue)}
                  </span>
                </div>
              </div>

              {/* User Community Breakdown */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-black text-[#143026]">Platform Community</h2>
                  <p className="text-xs text-[#4d7565]">Registered accounts by portal role</p>

                  <div className="mt-6 space-y-3">
                    <div className="p-3.5 rounded-2xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#2E9D74] text-white flex items-center justify-center font-bold text-xs">
                          ST
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#143026]">Students</p>
                          <p className="text-[10px] text-[#4d7565]">Job seekers &amp; candidates</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-[#143026]">{stats.users.students}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                          RC
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#143026]">Recruiters</p>
                          <p className="text-[10px] text-[#4d7565]">Company hiring reps</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-purple-900">{stats.users.recruiters}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                          AD
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#143026]">Administrators</p>
                          <p className="text-[10px] text-[#4d7565]">Placement Cell &amp; Super</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-amber-900">{stats.users.administrators}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to="/admin/users"
                  className="w-full py-2.5 rounded-xl border border-[#A7D6C0] text-center text-xs font-bold text-[#2a4d3e] hover:bg-[#EAF6F0] transition flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>Manage Platform Users &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Recent Institutional Audit Log Activity */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2E9D74]" />
                  <h2 className="text-base font-black text-[#143026]">Recent Administrative Activity</h2>
                </div>
                <Link
                  to="/admin/audit-logs"
                  className="text-xs font-bold text-[#2E9D74] hover:text-[#258260] flex items-center gap-1"
                >
                  View complete audit trail &rarr;
                </Link>
              </div>

              <div className="divide-y divide-[#A7D6C0]/30">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-xs text-[#4d7565] py-4 text-center">No recent actions recorded.</p>
                ) : (
                  stats.recentActivity.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#2E9D74]/10 text-[#2E9D74] font-extrabold text-[10px] border border-[#2E9D74]/20">
                          {log.action}
                        </span>
                        <span className="font-semibold text-[#143026]">
                          {log.entity} #{log.entityId}
                        </span>
                        <span className="text-gray-400 hidden sm:inline">&bull;</span>
                        <span className="text-[#4d7565] hidden sm:inline">{log.user?.email || 'System'}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};
