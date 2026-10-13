import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { interviewService } from '../../services/interview.service';
import type { Interview, InterviewStatus, InterviewMode, InterviewResult, InterviewPagination } from '../../types/interview.types';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Search,
  Filter,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Building2,
  UserCheck,
  Info,
} from 'lucide-react';

const STATUS_BADGES: Record<InterviewStatus, { label: string; bg: string; text: string; border: string }> = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-emerald-50', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]/30' },
  RESCHEDULED: { label: 'Rescheduled', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  COMPLETED: { label: 'Completed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  NO_SHOW: { label: 'No Show', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
};

const RESULT_BADGES: Record<InterviewResult, { label: string; bg: string }> = {
  PENDING: { label: 'Result Pending', bg: 'bg-amber-100 text-amber-800' },
  QUALIFIED: { label: 'Qualified / Passed', bg: 'bg-emerald-100 text-emerald-800' },
  NOT_QUALIFIED: { label: 'Not Cleared', bg: 'bg-rose-100 text-rose-800' },
  ON_HOLD: { label: 'On Hold', bg: 'bg-purple-100 text-purple-800' },
  ABSENT: { label: 'Absent', bg: 'bg-gray-100 text-gray-700' },
};

export const StudentInterviewsPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [pagination, setPagination] = useState<InterviewPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('');

  // Details Modal
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
      const res = await interviewService.getStudentInterviews({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter ? (statusFilter as InterviewStatus) : undefined,
        mode: modeFilter ? (modeFilter as InterviewMode) : undefined,
      });
      setInterviews(res.interviews);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load student interviews:', err);
      setErrorMessage(err.message || 'Unable to retrieve interview schedules.');
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

  const isUpcoming = (dateStr: string, status: InterviewStatus) => {
    return (
      (status === 'SCHEDULED' || status === 'RESCHEDULED') &&
      new Date(dateStr).getTime() >= new Date().setHours(0, 0, 0, 0)
    );
  };

  return (
    <StudentLayout
      pageTitle="My Interview Schedule"
      pageSubtitle="Track recruitment rounds, live assessment links, evaluator notes, and performance outcomes"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white shadow-md shadow-[#2E9D74]/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#143026]">Recruitment Rounds &amp; Interviews</h1>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Prepare for upcoming technical, managerial, and HR assessments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20">
              Total Scheduled: {pagination.total}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b8071]" />
            <input
              type="text"
              placeholder="Search round, company, or interviewer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/80 focus:outline-none focus:ring-2 focus:ring-[#2E9D74] text-[#143026] placeholder-[#5b8071]/70"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
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
                <option value="ONLINE">Online Video</option>
                <option value="IN_PERSON">In-Person Campus</option>
                <option value="TELEPHONIC">Telephonic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white/80 rounded-2xl border border-[#A7D6C0]/70 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2E9D74] border-t-transparent mb-3"></div>
            <p className="text-sm font-semibold text-[#2E9D74]">Loading your recruitment interviews...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-white/80 rounded-2xl border border-rose-200 p-8 text-center text-rose-700 shadow-sm flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="text-sm font-semibold">{errorMessage}</p>
            <button
              onClick={fetchInterviews}
              className="mt-2 text-xs px-4 py-2 bg-[#2E9D74] text-white rounded-xl font-bold hover:bg-[#25825f] transition"
            >
              Retry
            </button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-white/90 rounded-2xl border border-[#A7D6C0]/70 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74] mx-auto mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-[#143026]">No Interviews Scheduled</h3>
            <p className="text-xs text-[#4d7565] max-w-md mx-auto mt-1 leading-relaxed">
              Once an employer reviews and shortlists your application, scheduled technical rounds and meeting links will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {interviews.map((interview) => {
              const statusCfg = STATUS_BADGES[interview.status] || STATUS_BADGES.SCHEDULED;
              const resultCfg = RESULT_BADGES[interview.result] || RESULT_BADGES.PENDING;
              const upcoming = isUpcoming(interview.interviewDate, interview.status);

              return (
                <div
                  key={interview.id}
                  className={`bg-white/95 rounded-2xl border transition duration-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md ${
                    upcoming ? 'border-[#2E9D74] ring-1 ring-[#2E9D74]/20' : 'border-[#A7D6C0]/70'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header: Company & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EAF6F0] border border-[#A7D6C0] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {interview.company?.logoUrl ? (
                            <img
                              src={interview.company.logoUrl}
                              alt={interview.company.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-[#2E9D74]" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#143026] leading-tight">
                            {interview.company?.name || 'Company'}
                          </h4>
                          <p className="text-[11px] text-[#4d7565] font-medium flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3" />
                            {interview.job?.title || interview.internship?.title || 'Campus Drive'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {statusCfg.label}
                        </span>
                        {upcoming && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Round Title & Number */}
                    <div className="bg-[#EAF6F0]/50 p-3 rounded-xl border border-[#A7D6C0]/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E9D74]">
                          Round {interview.roundNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${resultCfg.bg}`}>
                          {resultCfg.label}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#143026] mt-0.5">{interview.roundName}</p>
                    </div>

                    {/* Date & Time Slot */}
                    <div className="space-y-1.5 text-xs text-[#2a4d3e]">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#2E9D74]" />
                        <span className="font-semibold">{formatDate(interview.interviewDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#2E9D74]" />
                        <span>{formatTimeSlot(interview.startTime, interview.endTime)}</span>
                      </div>

                      {/* Mode Details */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {interview.mode === 'ONLINE' ? (
                          <>
                            <Video className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="font-medium text-indigo-900">Online Meeting</span>
                          </>
                        ) : interview.mode === 'IN_PERSON' ? (
                          <>
                            <MapPin className="h-3.5 w-3.5 text-amber-600" />
                            <span className="font-medium text-amber-900">
                              In-Person: {interview.location || 'Campus Center'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Phone className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-medium text-emerald-900">Telephonic Interview</span>
                          </>
                        )}
                      </div>

                      {/* Interviewer */}
                      {interview.interviewerName && (
                        <div className="flex items-center gap-2 text-[11px] text-[#4d7565]">
                          <UserCheck className="h-3.5 w-3.5 text-[#2E9D74]" />
                          <span>Interviewer: {interview.interviewerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-[#A7D6C0]/50 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedInterview(interview)}
                      className="text-xs font-bold text-[#2E9D74] hover:text-[#1e6a4e] flex items-center gap-1 transition"
                    >
                      <Info className="h-3.5 w-3.5" />
                      View Details &amp; Feedback
                    </button>

                    {interview.mode === 'ONLINE' && interview.meetingLink && interview.status !== 'CANCELLED' && (
                      <a
                        href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold px-3 py-1.5 bg-gradient-to-r from-[#2E9D74] to-[#34a87e] text-white rounded-xl shadow-sm hover:shadow hover:from-[#25825f] hover:to-[#2b8c68] flex items-center gap-1.5 transition"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join Meeting
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white/80 rounded-2xl border border-[#A7D6C0]/70 p-3 shadow-sm flex items-center justify-between">
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

      {/* Details & Evaluator Feedback Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E9D74]">
                  Round {selectedInterview.roundNumber} Assessment
                </span>
                <h3 className="text-base font-bold text-[#143026]">{selectedInterview.roundName}</h3>
                <p className="text-xs text-[#4d7565]">
                  {selectedInterview.company?.name} — {selectedInterview.job?.title || selectedInterview.internship?.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-[#EAF6F0] p-3.5 rounded-xl border border-[#A7D6C0]/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Date:</span>
                <span className="font-bold text-[#143026]">{formatDate(selectedInterview.interviewDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Time Slot:</span>
                <span className="font-bold text-[#143026]">
                  {formatTimeSlot(selectedInterview.startTime, selectedInterview.endTime)}
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
              {selectedInterview.meetingLink && (
                <div className="flex justify-between items-center">
                  <span className="text-[#4d7565]">Meeting Link:</span>
                  <a
                    href={selectedInterview.meetingLink.startsWith('http') ? selectedInterview.meetingLink : `https://${selectedInterview.meetingLink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2E9D74] font-bold underline flex items-center gap-1"
                  >
                    Open Link <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {selectedInterview.interviewerName && (
                <div className="flex justify-between">
                  <span className="text-[#4d7565]">Interviewer:</span>
                  <span className="font-bold text-[#143026]">{selectedInterview.interviewerName}</span>
                </div>
              )}
            </div>

            {/* Preparation Notes */}
            {selectedInterview.notes && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#143026]">Candidate Instructions &amp; Prep Notes</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 whitespace-pre-wrap">
                  {selectedInterview.notes}
                </div>
              </div>
            )}

            {/* Evaluator Result & Feedback */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#143026]">Official Outcome &amp; Performance Feedback</h4>
              <div className="p-3.5 rounded-xl border border-[#A7D6C0]/70 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#4d7565]">Evaluation Result:</span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                      RESULT_BADGES[selectedInterview.result]?.bg || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {RESULT_BADGES[selectedInterview.result]?.label || selectedInterview.result}
                  </span>
                </div>

                {selectedInterview.feedback ? (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-[#4d7565] mb-1">Evaluator Feedback:</p>
                    <p className="text-xs text-[#143026] italic bg-[#EAF6F0]/40 p-2.5 rounded-lg border border-[#A7D6C0]/40">
                      "{selectedInterview.feedback}"
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic pt-1">
                    Feedback will be published once evaluator submits assessment notes.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedInterview(null)}
                className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#25825f] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};
