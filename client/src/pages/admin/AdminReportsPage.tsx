import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { reportService } from '../../services/report.service';
import type { AnalyticsSummary, ReportType } from '../../types/report.types';
import {
  BarChart3,
  Download,
  Search,
  Award,
  FileCheck2,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
} from 'lucide-react';


export const AdminReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'reports'>('analytics');

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);

  // Tabular Reports State
  const [reportType, setReportType] = useState<ReportType>('placements');
  const [reportItems, setReportItems] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [exporting, setExporting] = useState<boolean>(false);

  // Fetch Analytics Summary
  useEffect(() => {
    async function loadAnalytics() {
      try {
        setAnalyticsLoading(true);
        const data = await reportService.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  // Fetch Tabular Report Data
  const fetchReportData = useCallback(async () => {
    try {
      setReportLoading(true);
      const res = await reportService.getReportData({
        reportType,
        page,
        limit: 12,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setReportItems(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setReportLoading(false);
    }
  }, [reportType, page, search, statusFilter]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportData();
    }
  }, [activeTab, fetchReportData]);

  const handleDownloadCsv = async () => {
    try {
      setExporting(true);
      await reportService.downloadCsv(reportType);
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const formatLPA = (amt: number | string) => {
    const num = Number(amt);
    if (!num || isNaN(num)) return '₹0';
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} LPA`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <AdminLayout
      pageTitle="Reports & Placement Analytics"
      pageSubtitle="Data-backed institutional reporting, salary bracket distributions, and CSV data exports"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#2E9D74]" />
              <h1 className="text-xl font-black text-[#143026]">Reports &amp; Placement Analytics</h1>
            </div>
            <p className="text-xs text-[#4d7565] mt-1">
              Data-backed institutional reporting, salary bracket distributions, and CSV data exports
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-[#EAF6F0] p-1.5 rounded-2xl border border-[#A7D6C0]">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#2E9D74] text-white shadow-xs'
                  : 'text-[#2a4d3e] hover:bg-white/60'
              }`}
            >
              Analytics Charts
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#2E9D74] text-white shadow-xs'
                  : 'text-[#2a4d3e] hover:bg-white/60'
              }`}
            >
              Detailed Reports
            </button>
          </div>
        </div>

        {/* Tab 1: Analytics Charts */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="p-16 text-center text-xs font-semibold text-[#4d7565]">
                Computing real-time analytics aggregations...
              </div>
            ) : !analytics ? (
              <div className="p-16 text-center text-xs font-semibold text-[#4d7565]">
                No data available for analytics computation.
              </div>
            ) : (
              <>
                {/* CTC Package Distribution Grid */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-[#143026]">CTC Package Distribution (INR)</h2>
                      <p className="text-xs text-[#4d7565]">Placement compensation bands across active offers</p>
                    </div>
                    <span className="text-xs font-bold text-[#2E9D74] px-3 py-1 bg-[#2E9D74]/15 rounded-full border border-[#2E9D74]/30">
                      {analytics.totalPlacements} Placements
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/50 space-y-1">
                      <span className="text-[11px] font-bold text-[#4d7565]">Tier 1 (&lt; 6 LPA)</span>
                      <p className="text-2xl font-black text-[#143026]">{analytics.salaryDistribution.under6LPA}</p>
                      <p className="text-[10px] text-[#4d7565]">Entry-level packages</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/50 space-y-1">
                      <span className="text-[11px] font-bold text-blue-700">Tier 2 (6 - 10 LPA)</span>
                      <p className="text-2xl font-black text-blue-900">{analytics.salaryDistribution.between6and10LPA}</p>
                      <p className="text-[10px] text-blue-600">Standard engineering packages</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/50 space-y-1">
                      <span className="text-[11px] font-bold text-indigo-700">Tier 3 (10 - 15 LPA)</span>
                      <p className="text-2xl font-black text-indigo-900">{analytics.salaryDistribution.between10and15LPA}</p>
                      <p className="text-[10px] text-indigo-600">High-growth packages</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/50 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-700">Tier 4 (&gt; 15 LPA)</span>
                      <p className="text-2xl font-black text-emerald-900">{analytics.salaryDistribution.above15LPA}</p>
                      <p className="text-[10px] text-emerald-600">Dream &amp; Super-dream offers</p>
                    </div>
                  </div>
                </div>

                {/* Placements by Department & Top Hiring Companies */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Breakdown */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#2E9D74]" />
                      <h2 className="text-base font-black text-[#143026]">Placements by Department</h2>
                    </div>

                    <div className="divide-y divide-[#A7D6C0]/30 max-h-72 overflow-y-auto">
                      {analytics.placementsByDepartment.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">No department placements recorded yet.</p>
                      ) : (
                        analytics.placementsByDepartment.map((dept) => (
                          <div key={dept.code} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-extrabold text-[#143026]">{dept.name}</span>
                              <span className="font-mono text-[10px] text-[#4d7565] block">{dept.code}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-[#2E9D74] text-sm">{dept.count} Placed</span>
                              <span className="text-[10px] text-gray-500 block">
                                Avg: {formatLPA(dept.avgPackage)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Top Hiring Companies */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#2E9D74]" />
                      <h2 className="text-base font-black text-[#143026]">Top Hiring Partner Companies</h2>
                    </div>

                    <div className="divide-y divide-[#A7D6C0]/30 max-h-72 overflow-y-auto">
                      {analytics.topHiringCompanies.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">No recruitment hires recorded yet.</p>
                      ) : (
                        analytics.topHiringCompanies.map((c, idx) => (
                          <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#EAF6F0] text-[#2E9D74] flex items-center justify-center font-extrabold text-xs">
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-[#143026]">{c.name}</span>
                            </div>
                            <span className="font-black text-[#143026] px-3 py-1 bg-[#2E9D74]/10 rounded-full text-xs text-[#2E9D74]">
                              {c.hires} Hired
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Tabular Reports & CSV Export */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Selector & Export Bar */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Report Category Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setReportType('placements');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    reportType === 'placements'
                      ? 'bg-[#2E9D74] text-white shadow-xs'
                      : 'bg-[#EAF6F0] text-[#2a4d3e] hover:bg-[#A7D6C0]/30'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Placements Report</span>
                </button>

                <button
                  onClick={() => {
                    setReportType('applications');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    reportType === 'applications'
                      ? 'bg-[#2E9D74] text-white shadow-xs'
                      : 'bg-[#EAF6F0] text-[#2a4d3e] hover:bg-[#A7D6C0]/30'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Applications Report</span>
                </button>

                <button
                  onClick={() => {
                    setReportType('interviews');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    reportType === 'interviews'
                      ? 'bg-[#2E9D74] text-white shadow-xs'
                      : 'bg-[#EAF6F0] text-[#2a4d3e] hover:bg-[#A7D6C0]/30'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Interviews Report</span>
                </button>

                <button
                  onClick={() => {
                    setReportType('offers');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    reportType === 'offers'
                      ? 'bg-[#2E9D74] text-white shadow-xs'
                      : 'bg-[#EAF6F0] text-[#2a4d3e] hover:bg-[#A7D6C0]/30'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Offers Report</span>
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={handleDownloadCsv}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition disabled:opacity-50 cursor-pointer self-start md:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Generating CSV...' : `Export ${reportType.toUpperCase()} CSV`}</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0] shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${reportType} by candidate name, company, or role...`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0] text-xs text-[#143026] placeholder-[#4d7565] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter Status / Result..."
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#EAF6F0]/40 border border-[#A7D6C0] text-xs text-[#143026] placeholder-[#4d7565] focus:outline-none focus:ring-2 focus:ring-[#2E9D74]"
                />

                <div className="text-xs font-bold text-[#2a4d3e] whitespace-nowrap">
                  {totalCount} Total Record{totalCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Tabular Data View */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0] shadow-sm overflow-hidden">
              {reportLoading ? (
                <div className="p-16 text-center text-xs font-semibold text-[#4d7565]">
                  Fetching report data records...
                </div>
              ) : reportItems.length === 0 ? (
                <div className="p-16 text-center space-y-2">
                  <BarChart3 className="w-10 h-10 text-[#A7D6C0] mx-auto opacity-70" />
                  <p className="font-bold text-sm text-[#143026]">No records found for this report</p>
                  <p className="text-xs text-[#4d7565]">Try removing search filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#EAF6F0]/80 border-b border-[#A7D6C0] text-[#143026] font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Opportunity Role</th>
                        <th className="py-3 px-4">Status / Result</th>
                        <th className="py-3 px-4 text-right">Compensation / Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#A7D6C0]/30">
                      {reportItems.map((item) => {
                        const studentName = item.student?.fullName || 'N/A';
                        const studentId = item.student?.studentId || '';
                        const deptCode = item.student?.department?.code || 'N/A';
                        const companyName = item.company?.name || item.job?.company?.name || item.internship?.company?.name || 'N/A';
                        const designation = item.designation || item.job?.title || item.internship?.title || item.roundName || 'N/A';
                        const status = item.status || item.result || 'RECORDED';
                        const packageAmt = item.packageAmount || item.salary;
                        const date = item.placementDate || item.appliedAt || item.interviewDate || item.offerDate;

                        return (
                          <tr key={item.id} className="hover:bg-[#EAF6F0]/40 transition">
                            <td className="py-3 px-4">
                              <span className="font-bold text-[#143026] block">{studentName}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{studentId}</span>
                            </td>

                            <td className="py-3 px-4 font-semibold text-[#4d7565]">{deptCode}</td>

                            <td className="py-3 px-4 font-bold text-[#143026]">{companyName}</td>

                            <td className="py-3 px-4 text-[#2a4d3e] font-medium">{designation}</td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-[#2E9D74]/15 text-[#2E9D74] border border-[#2E9D74]/30">
                                {status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              {packageAmt && (
                                <span className="font-extrabold text-[#143026] block">{formatLPA(packageAmt)}</span>
                              )}
                              {date && (
                                <span className="text-[10px] text-gray-400">
                                  {new Date(date).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-[#EAF6F0]/40 border-t border-[#A7D6C0]">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#2a4d3e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF6F0] transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-xs font-semibold text-[#4d7565]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#2a4d3e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF6F0] transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
