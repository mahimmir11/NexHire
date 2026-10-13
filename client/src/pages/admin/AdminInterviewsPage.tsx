import React, { useEffect, useState } from 'react';
import { interviewService } from '../../services/interview.service';
import type { Interview, InterviewStatus, InterviewMode, InterviewResult, InterviewPagination } from '../../types/interview.types';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<InterviewStatus, { label: string; bg: string; text: string; border: string }> = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-emerald-50', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]/30' },
  RESCHEDULED: { label: 'Rescheduled', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  COMPLETED: { label: 'Completed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  NO_SHOW: { label: 'No Show', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
};

const RESULT_CONFIG: Record<InterviewResult, { label: string; bg: string }> = {
  PENDING: { label: 'Pending Evaluation', bg: 'bg-amber-100 text-amber-800' },
  QUALIFIED: { label: 'Qualified', bg: 'bg-emerald-100 text-emerald-800' },
  NOT_QUALIFIED: { label: 'Not Qualified', bg: 'bg-rose-100 text-rose-800' },
  ON_HOLD: { label: 'On Hold', bg: 'bg-purple-100 text-purple-800' },
  ABSENT: { label: 'Absent', bg: 'bg-gray-100 text-gray-700' },
};

export const AdminInterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);

  const [pagination, setPagination] = useState<InterviewPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  // Inspection Drawer
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await interviewService.getAdminInterviews({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter ? (statusFilter as InterviewStatus) : undefined,
        mode: modeFilter ? (modeFilter as InterviewMode) : undefined,
      });
      setInterviews(res.interviews);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load admin interviews:', err);
      setErrorMessage(err.message || 'Unable to retrieve institutional interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [pagination.page, debouncedSearch, statusFilter, modeFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeSlot = (startStr: string, endStr: string) => {
    const start = new Date(startStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const end = new Date(endStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  };

  return (
    <AdminLayout
      pageTitle="Campus Recruitment Interviews"
      pageSubtitle="Monitor interview rounds, candidate evaluations, and recruitment schedules"
    >
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white shadow-md shadow-[#2E9D74]/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#143026]">Campus Recruitment Interviews</h1>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Institutional oversight of scheduled technical rounds, panels, and candidate evaluations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20">
              Total Records: {pagination.total}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b8071]" />
            <input
              type="text"
              placeholder="Search candidate, company, or round..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/80 focus:outline-none focus:ring-2 focus:ring-[#2E9D74] text-[#143026] placeholder-[#5b8071]/70"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/80 px-2.5 py-1 rounded-xl border border-[#A7D6C0]">
              <Filter className="h-3.5 w-3.5 text-[#2E9D74]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="bg-transparent text-xs font-semibold text-[#143026] focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/80 px-2.5 py-1 rounded-xl border border-[#A7D6C0]">
              <select
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="bg-transparent text-xs font-semibold text-[#143026] focus:outline-none cursor-pointer"
              >
                <option value="">All Modes</option>
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">In-Person</option>
                <option value="TELEPHONIC">Telephonic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interviews Table */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2E9D74] border-t-transparent mb-3"></div>
              <p className="text-sm font-semibold text-[#2E9D74]">Loading institutional interviews...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-8 text-center text-rose-700 flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-sm font-semibold">{errorMessage}</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74] mx-auto mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-[#143026]">No Interviews Found</h3>
              <p className="text-xs text-[#4d7565] max-w-md mx-auto mt-1 leading-relaxed">
                No candidate interviews matched the selected filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF6F0]/80 text-[#143026] font-bold border-b border-[#A7D6C0]/70 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/40">
                  {interviews.map((interview) => {
                    const statusCfg = STATUS_CONFIG[interview.status] || STATUS_CONFIG.SCHEDULED;
                    const resultCfg = RESULT_CONFIG[interview.result] || RESULT_CONFIG.PENDING;

                    return (
                      <tr key={interview.id} className="hover:bg-[#EAF6F0]/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#143026]">{interview.student?.fullName}</div>
                          <div className="text-[11px] text-[#4d7565]">
                            {interview.student?.studentId} • {interview.student?.course}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#143026]">{interview.company?.name}</td>
                        <td className="py-3 px-4 text-[#4d7565]">
                          {interview.job?.title || interview.internship?.title || 'Campus Drive'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#143026]">
                          <span className="text-[#2E9D74] font-bold">R{interview.roundNumber}:</span> {interview.roundName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#143026]">{formatDate(interview.interviewDate)}</div>
                          <div className="text-[10px] text-[#4d7565]">
                            {formatTimeSlot(interview.startTime, interview.endTime)}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${resultCfg.bg}`}>
                            {resultCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedInterview(interview)}
                            className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] hover:bg-[#EAF6F0] transition"
                            title="Inspect Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[#A7D6C0]/50 flex items-center justify-between">
              <span className="text-xs font-medium text-[#4d7565]">
                Showing page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] disabled:opacity-40 hover:bg-[#EAF6F0] transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] disabled:opacity-40 hover:bg-[#EAF6F0] transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Interview Dossier</h3>
                <p className="text-xs text-[#4d7565]">
                  {selectedInterview.student?.fullName} ({selectedInterview.student?.studentId})
                </p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-[#EAF6F0] p-4 rounded-xl border border-[#A7D6C0]/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Company:</span>
                <span className="font-bold text-[#143026]">{selectedInterview.company?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Opportunity:</span>
                <span className="font-bold text-[#143026]">
                  {selectedInterview.job?.title || selectedInterview.internship?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Round:</span>
                <span className="font-bold text-[#143026]">
                  Round {selectedInterview.roundNumber}: {selectedInterview.roundName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Date &amp; Slot:</span>
                <span className="font-bold text-[#143026]">
                  {formatDate(selectedInterview.interviewDate)} (
                  {formatTimeSlot(selectedInterview.startTime, selectedInterview.endTime)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Mode:</span>
                <span className="font-bold text-[#143026]">{selectedInterview.mode}</span>
              </div>
              {selectedInterview.location && (
                <div className="flex justify-between">
                  <span className="text-[#4d7565]">Location:</span>
                  <span className="font-bold text-[#143026]">{selectedInterview.location}</span>
                </div>
              )}
              {selectedInterview.interviewerName && (
                <div className="flex justify-between">
                  <span className="text-[#4d7565]">Interviewer:</span>
                  <span className="font-bold text-[#143026]">{selectedInterview.interviewerName}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedInterview(null)}
                className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#25825f] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
