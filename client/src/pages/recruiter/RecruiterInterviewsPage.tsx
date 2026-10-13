import React, { useEffect, useState } from 'react';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { interviewService } from '../../services/interview.service';
import { applicationService } from '../../services/application.service';
import type {
  Interview,
  InterviewStatus,
  InterviewMode,
  InterviewResult,
  InterviewPagination,
  ScheduleInterviewPayload,
} from '../../types/interview.types';
import type { Application } from '../../types/application.types';
import {
  Calendar,
  Video,
  MapPin,
  Phone,
  Search,
  Filter,
  Plus,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
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

export const RecruiterInterviewsPage: React.FC = () => {
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
  const [resultFilter, setResultFilter] = useState('');

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [resultModalInterview, setResultModalInterview] = useState<Interview | null>(null);
  const [rescheduleModalInterview, setRescheduleModalInterview] = useState<Interview | null>(null);
  const [cancelModalInterview, setCancelModalInterview] = useState<Interview | null>(null);
  const [inspectInterview, setInspectInterview] = useState<Interview | null>(null);

  // Eligible Applications for Scheduling
  const [shortlistedCandidates, setShortlistedCandidates] = useState<Application[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Scheduling Form State
  const [schedulePayload, setSchedulePayload] = useState<ScheduleInterviewPayload>({
    applicationId: 0,
    roundName: 'Round 1: Technical Interview',
    interviewDate: '',
    startTime: '',
    endTime: '',
    mode: 'ONLINE',
    meetingLink: '',
    location: '',
    interviewerName: '',
    notes: '',
  });
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Result Form State
  const [resultPayload, setResultPayload] = useState<{
    result: InterviewResult;
    feedback: string;
    notes: string;
    action: 'NONE' | 'SELECT' | 'REJECT';
  }>({
    result: 'QUALIFIED',
    feedback: '',
    notes: '',
    action: 'NONE',
  });

  // Reschedule Form State
  const [reschedulePayload, setReschedulePayload] = useState({
    interviewDate: '',
    startTime: '',
    endTime: '',
    mode: 'ONLINE' as InterviewMode,
    meetingLink: '',
    location: '',
    notes: '',
  });

  // Cancel reason
  const [cancelReason, setCancelReason] = useState('');

  // Debounce search
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
      const res = await interviewService.getRecruiterInterviews({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter ? (statusFilter as InterviewStatus) : undefined,
        mode: modeFilter ? (modeFilter as InterviewMode) : undefined,
        result: resultFilter ? (resultFilter as InterviewResult) : undefined,
      });
      setInterviews(res.interviews);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load recruiter interviews:', err);
      setErrorMessage(err.message || 'Unable to retrieve company interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [pagination.page, debouncedSearch, statusFilter, modeFilter, resultFilter]);

  // Load candidates that are SHORTLISTED or in INTERVIEW_SCHEDULED
  const loadEligibleCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const res = await applicationService.getCompanyApplications({
        page: 1,
        limit: 100,
      });
      // Filter candidates in eligible interview states
      const eligible = res.applications.filter(
        (app: Application) => app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED'
      );
      setShortlistedCandidates(eligible);
      if (eligible.length > 0 && schedulePayload.applicationId === 0) {
        setSchedulePayload((prev) => ({ ...prev, applicationId: eligible[0].id }));
      }
    } catch (err) {
      console.error('Failed to load eligible candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const openScheduleModal = () => {
    loadEligibleCandidates();
    const today = new Date().toISOString().split('T')[0];
    setSchedulePayload({
      applicationId: 0,
      roundName: 'Round 1: Technical Interview',
      interviewDate: today,
      startTime: `${today}T10:00`,
      endTime: `${today}T11:00`,
      mode: 'ONLINE',
      meetingLink: 'https://meet.google.com/nex-hire-interview',
      location: '',
      interviewerName: '',
      notes: '',
    });
    setScheduleErrors([]);
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleErrors([]);

    const errors: string[] = [];
    if (!schedulePayload.applicationId) errors.push('Please select a candidate.');
    if (!schedulePayload.roundName.trim()) errors.push('Round name is required.');
    if (!schedulePayload.interviewDate) errors.push('Interview date is required.');
    if (!schedulePayload.startTime) errors.push('Start time is required.');
    if (!schedulePayload.endTime) errors.push('End time is required.');
    if (new Date(schedulePayload.endTime) <= new Date(schedulePayload.startTime)) {
      errors.push('End time must be strictly after start time.');
    }
    if (schedulePayload.mode === 'ONLINE' && !schedulePayload.meetingLink?.trim()) {
      errors.push('Meeting link is required for Online interviews.');
    }
    if (schedulePayload.mode === 'IN_PERSON' && !schedulePayload.location?.trim()) {
      errors.push('Physical location is required for In-Person interviews.');
    }

    if (errors.length > 0) {
      setScheduleErrors(errors);
      return;
    }

    try {
      setFormSubmitting(true);
      await interviewService.scheduleInterview({
        ...schedulePayload,
        startTime: new Date(schedulePayload.startTime).toISOString(),
        endTime: new Date(schedulePayload.endTime).toISOString(),
      });
      setScheduleModalOpen(false);
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to schedule interview:', err);
      setScheduleErrors([err.message || 'Failed to schedule interview.']);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRecordResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultModalInterview) return;

    try {
      setFormSubmitting(true);
      await interviewService.recordResult(resultModalInterview.id, resultPayload);
      setResultModalInterview(null);
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to record result:', err);
      alert(err.message || 'Failed to record result.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalInterview) return;

    if (new Date(reschedulePayload.endTime) <= new Date(reschedulePayload.startTime)) {
      alert('End time must be after start time.');
      return;
    }

    try {
      setFormSubmitting(true);
      await interviewService.rescheduleInterview(rescheduleModalInterview.id, {
        interviewDate: reschedulePayload.interviewDate,
        startTime: new Date(reschedulePayload.startTime).toISOString(),
        endTime: new Date(reschedulePayload.endTime).toISOString(),
        mode: reschedulePayload.mode,
        meetingLink: reschedulePayload.meetingLink,
        location: reschedulePayload.location,
        notes: reschedulePayload.notes,
      });
      setRescheduleModalInterview(null);
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to reschedule:', err);
      alert(err.message || 'Failed to reschedule.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalInterview) return;

    try {
      setFormSubmitting(true);
      await interviewService.cancelInterview(cancelModalInterview.id, cancelReason);
      setCancelModalInterview(null);
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to cancel:', err);
      alert(err.message || 'Failed to cancel.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
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
    <RecruiterLayout
      pageTitle="Recruitment Interviews &amp; Assessments"
      pageSubtitle="Schedule multi-round interviews, record technical evaluations, and advance qualified talent"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white shadow-md shadow-[#2E9D74]/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#143026]">Recruitment &amp; Interview Management</h1>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Manage candidate rounds, live evaluations, and selection decisions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openScheduleModal}
              className="text-xs font-bold px-4 py-2.5 bg-gradient-to-r from-[#2E9D74] to-[#34a87e] text-white rounded-xl shadow-sm hover:shadow hover:from-[#25825f] hover:to-[#2b8c68] flex items-center gap-2 transition"
            >
              <Plus className="h-4 w-4" />
              Schedule Interview
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b8071]" />
            <input
              type="text"
              placeholder="Search candidate name, roll number, or round..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/80 focus:outline-none focus:ring-2 focus:ring-[#2E9D74] text-[#143026] placeholder-[#5b8071]/70"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
            {/* Status Filter */}
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

            {/* Mode Filter */}
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

            {/* Result Filter */}
            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/80 px-2.5 py-1 rounded-xl border border-[#A7D6C0]">
              <select
                value={resultFilter}
                onChange={(e) => {
                  setResultFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="bg-transparent text-xs font-semibold text-[#143026] focus:outline-none cursor-pointer"
              >
                <option value="">All Results</option>
                <option value="PENDING">Pending</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="NOT_QUALIFIED">Not Qualified</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interviews Table */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2E9D74] border-t-transparent mb-3"></div>
              <p className="text-sm font-semibold text-[#2E9D74]">Loading interviews...</p>
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
              <h3 className="text-base font-bold text-[#143026]">No Interviews Scheduled</h3>
              <p className="text-xs text-[#4d7565] max-w-md mx-auto mt-1 leading-relaxed">
                Click "Schedule Interview" above to invite shortlisted candidates to a technical or HR round.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF6F0]/80 text-[#143026] font-bold border-b border-[#A7D6C0]/70 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Opportunity</th>
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Mode / Link</th>
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
                        {/* Candidate */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#143026]">{interview.student?.fullName}</div>
                          <div className="text-[11px] text-[#4d7565]">
                            {interview.student?.studentId} • {interview.student?.course} (CGPA: {interview.student?.cgpa || 'N/A'})
                          </div>
                        </td>

                        {/* Opportunity */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#143026]">
                            {interview.job?.title || interview.internship?.title || 'Campus Drive'}
                          </div>
                          <div className="text-[10px] text-[#4d7565]">
                            App Status: <span className="font-bold text-[#2E9D74]">{interview.application?.status}</span>
                          </div>
                        </td>

                        {/* Round */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-[#2E9D74]">R{interview.roundNumber}:</span>{' '}
                          <span className="font-semibold text-[#143026]">{interview.roundName}</span>
                          {interview.interviewerName && (
                            <div className="text-[10px] text-[#4d7565]">By: {interview.interviewerName}</div>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#143026]">{formatDate(interview.interviewDate)}</div>
                          <div className="text-[10px] text-[#4d7565]">
                            {formatTimeSlot(interview.startTime, interview.endTime)}
                          </div>
                        </td>

                        {/* Mode */}
                        <td className="py-3 px-4">
                          {interview.mode === 'ONLINE' ? (
                            interview.meetingLink ? (
                              <a
                                href={
                                  interview.meetingLink.startsWith('http')
                                    ? interview.meetingLink
                                    : `https://${interview.meetingLink}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline"
                              >
                                <Video className="h-3 w-3" />
                                Meeting Link
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-indigo-700 font-semibold">Online Video</span>
                            )
                          ) : interview.mode === 'IN_PERSON' ? (
                            <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-amber-600" />
                              {interview.location || 'In-Person'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                              <Phone className="h-3 w-3 text-emerald-600" />
                              Telephonic
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Result */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${resultCfg.bg}`}>
                            {resultCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect */}
                            <button
                              onClick={() => setInspectInterview(interview)}
                              title="View Details"
                              className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] hover:bg-[#EAF6F0] transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Record Result */}
                            {interview.status !== 'CANCELLED' && (
                              <button
                                onClick={() => {
                                  setResultPayload({
                                    result: interview.result === 'PENDING' ? 'QUALIFIED' : interview.result,
                                    feedback: interview.feedback || '',
                                    notes: interview.notes || '',
                                    action: 'NONE',
                                  });
                                  setResultModalInterview(interview);
                                }}
                                title="Record Evaluation Result"
                                className="px-2.5 py-1 text-[11px] font-bold bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/30 rounded-lg hover:bg-[#A7D6C0]/40 transition"
                              >
                                Record Result
                              </button>
                            )}

                            {/* Reschedule */}
                            {interview.status !== 'COMPLETED' && interview.status !== 'CANCELLED' && (
                              <button
                                onClick={() => {
                                  const dateStr = new Date(interview.interviewDate).toISOString().split('T')[0];
                                  setReschedulePayload({
                                    interviewDate: dateStr,
                                    startTime: new Date(interview.startTime).toISOString().slice(0, 16),
                                    endTime: new Date(interview.endTime).toISOString().slice(0, 16),
                                    mode: interview.mode,
                                    meetingLink: interview.meetingLink || '',
                                    location: interview.location || '',
                                    notes: '',
                                  });
                                  setRescheduleModalInterview(interview);
                                }}
                                title="Reschedule"
                                className="p-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Cancel */}
                            {interview.status !== 'COMPLETED' && interview.status !== 'CANCELLED' && (
                              <button
                                onClick={() => {
                                  setCancelReason('');
                                  setCancelModalInterview(interview);
                                }}
                                title="Cancel Interview"
                                className="p-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 transition"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
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
                Showing page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: SCHEDULE INTERVIEW                                   */}
      {/* ------------------------------------------------------------- */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Schedule Candidate Interview</h3>
                <p className="text-xs text-[#4d7565]">
                  Select a shortlisted candidate and configure round details
                </p>
              </div>
              <button onClick={() => setScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            {scheduleErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs space-y-1">
                {scheduleErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {/* Select Candidate */}
              <div>
                <label className="text-xs font-bold text-[#143026] block mb-1">
                  Candidate (Shortlisted or in Recruitment Rounds) *
                </label>
                {loadingCandidates ? (
                  <p className="text-xs text-[#4d7565]">Loading shortlisted candidates...</p>
                ) : shortlistedCandidates.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    No candidates are currently in SHORTLISTED status for your company. Please shortlist candidates from the
                    Applicants tab first.
                  </div>
                ) : (
                  <select
                    value={schedulePayload.applicationId}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, applicationId: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  >
                    <option value={0}>-- Select Candidate --</option>
                    {shortlistedCandidates.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.student?.fullName} ({app.student?.studentId}) — {app.job?.title || app.internship?.title} [
                        {app.status}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Round Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">Round Title *</label>
                  <input
                    type="text"
                    value={schedulePayload.roundName}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, roundName: e.target.value })}
                    placeholder="e.g. Technical Round 1 (Data Structures)"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">Interview Mode *</label>
                  <select
                    value={schedulePayload.mode}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, mode: e.target.value as InterviewMode })}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  >
                    <option value="ONLINE">Online Video</option>
                    <option value="IN_PERSON">In-Person Campus</option>
                    <option value="TELEPHONIC">Telephonic</option>
                  </select>
                </div>
              </div>

              {/* Mode Specific Field */}
              {schedulePayload.mode === 'ONLINE' ? (
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">Meeting Link (Google Meet / Zoom / Teams) *</label>
                  <input
                    type="text"
                    value={schedulePayload.meetingLink || ''}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
              ) : schedulePayload.mode === 'IN_PERSON' ? (
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">Physical Location / Interview Room *</label>
                  <input
                    type="text"
                    value={schedulePayload.location || ''}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, location: e.target.value })}
                    placeholder="e.g. Room 402, Placement Cell Building"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
              ) : null}

              {/* Date & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">Date *</label>
                  <input
                    type="date"
                    value={schedulePayload.interviewDate}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, interviewDate: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={schedulePayload.startTime}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, startTime: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={schedulePayload.endTime}
                    onChange={(e) => setSchedulePayload({ ...schedulePayload, endTime: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Interviewer & Notes */}
              <div>
                <label className="text-xs font-bold text-[#143026] block mb-1">Interviewer Name / Panel (Optional)</label>
                <input
                  type="text"
                  value={schedulePayload.interviewerName || ''}
                  onChange={(e) => setSchedulePayload({ ...schedulePayload, interviewerName: e.target.value })}
                  placeholder="e.g. Vikram Malhotra (Talent Lead)"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#143026] block mb-1">Preparation Instructions for Candidate (Optional)</label>
                <textarea
                  value={schedulePayload.notes || ''}
                  onChange={(e) => setSchedulePayload({ ...schedulePayload, notes: e.target.value })}
                  placeholder="Please have your IDE ready and review distributed systems fundamentals..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || shortlistedCandidates.length === 0}
                  className="px-5 py-2 text-xs font-bold bg-[#2E9D74] text-white rounded-xl shadow-sm hover:bg-[#25825f] transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Scheduling...' : 'Confirm & Schedule Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: RECORD RESULT                                        */}
      {/* ------------------------------------------------------------- */}
      {resultModalInterview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Record Assessment Outcome</h3>
                <p className="text-xs text-[#4d7565]">
                  {resultModalInterview.student?.fullName} — {resultModalInterview.roundName}
                </p>
              </div>
              <button
                onClick={() => setResultModalInterview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRecordResultSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#143026] block mb-1">Round Result *</label>
                <select
                  value={resultPayload.result}
                  onChange={(e) => setResultPayload({ ...resultPayload, result: e.target.value as InterviewResult })}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none font-bold"
                >
                  <option value="QUALIFIED">Qualified / Passed Round</option>
                  <option value="NOT_QUALIFIED">Not Qualified / Cleared</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="ABSENT">Candidate Absent</option>
                </select>
              </div>

              {/* Action: Advance candidate */}
              <div className="p-3.5 bg-[#EAF6F0] rounded-xl border border-[#A7D6C0]/70 space-y-2">
                <label className="text-xs font-bold text-[#143026] block">
                  Next Step in Recruitment Lifecycle:
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      checked={resultPayload.action === 'NONE'}
                      onChange={() => setResultPayload({ ...resultPayload, action: 'NONE' })}
                      className="text-[#2E9D74] focus:ring-[#2E9D74]"
                    />
                    <span>Keep in Process (Schedule next round later)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      checked={resultPayload.action === 'SELECT'}
                      onChange={() => setResultPayload({ ...resultPayload, action: 'SELECT' })}
                      className="text-[#2E9D74] focus:ring-[#2E9D74]"
                    />
                    <span className="font-bold text-[#2E9D74]">
                      Mark Candidate as SELECTED (Ready for Official Offer)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      checked={resultPayload.action === 'REJECT'}
                      onChange={() => setResultPayload({ ...resultPayload, action: 'REJECT' })}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-700">Reject Application (Conclude Hiring Process)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#143026] block mb-1">Evaluator Feedback (Visible to Candidate)</label>
                <textarea
                  value={resultPayload.feedback}
                  onChange={(e) => setResultPayload({ ...resultPayload, feedback: e.target.value })}
                  placeholder="Strong architectural problem solving, good grasp on TypeScript and Node.js..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#143026] block mb-1">Internal Recruiter Notes (Confidential)</label>
                <textarea
                  value={resultPayload.notes}
                  onChange={(e) => setResultPayload({ ...resultPayload, notes: e.target.value })}
                  placeholder="Candidate requested Bengaluru hybrid preference, recommended CTC 14 LPA..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResultModalInterview(null)}
                  className="px-4 py-2 text-xs font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-[#2E9D74] text-white rounded-xl shadow-sm hover:bg-[#25825f] transition"
                >
                  {formSubmitting ? 'Recording...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: RESCHEDULE                                           */}
      {/* ------------------------------------------------------------- */}
      {rescheduleModalInterview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Reschedule Interview</h3>
                <p className="text-xs text-[#4d7565]">{rescheduleModalInterview.roundName}</p>
              </div>
              <button
                onClick={() => setRescheduleModalInterview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#143026] block mb-1">New Date *</label>
                <input
                  type="date"
                  value={reschedulePayload.interviewDate}
                  onChange={(e) => setReschedulePayload({ ...reschedulePayload, interviewDate: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={reschedulePayload.startTime}
                    onChange={(e) => setReschedulePayload({ ...reschedulePayload, startTime: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#143026] block mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={reschedulePayload.endTime}
                    onChange={(e) => setReschedulePayload({ ...reschedulePayload, endTime: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {reschedulePayload.mode === 'ONLINE' ? (
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Meeting Link</label>
                  <input
                    type="text"
                    value={reschedulePayload.meetingLink}
                    onChange={(e) => setReschedulePayload({ ...reschedulePayload, meetingLink: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Location</label>
                  <input
                    type="text"
                    value={reschedulePayload.location}
                    onChange={(e) => setReschedulePayload({ ...reschedulePayload, location: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-[#143026] block mb-1">Reason for Rescheduling</label>
                <input
                  type="text"
                  value={reschedulePayload.notes}
                  onChange={(e) => setReschedulePayload({ ...reschedulePayload, notes: e.target.value })}
                  placeholder="e.g. Recruiter panel scheduling conflict"
                  className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleModalInterview(null)}
                  className="px-3 py-1.5 font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 font-bold bg-[#2E9D74] text-white rounded-xl shadow-sm hover:bg-[#25825f] transition"
                >
                  {formSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: CANCEL INTERVIEW                                     */}
      {/* ------------------------------------------------------------- */}
      {cancelModalInterview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-300 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#143026]">Cancel Interview?</h3>
                <p className="text-xs text-[#4d7565]">{cancelModalInterview.student?.fullName}</p>
              </div>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#143026] block mb-1">Cancellation Reason</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Position filled / candidate withdrew"
                  className="w-full p-2.5 rounded-xl border border-gray-300 bg-white text-[#143026] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelModalInterview(null)}
                  className="px-3 py-1.5 font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 font-bold bg-rose-600 text-white rounded-xl shadow-sm hover:bg-rose-700 transition"
                >
                  {formSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER/MODAL 5: INSPECT CANDIDATE TIMELINE                   */}
      {/* ------------------------------------------------------------- */}
      {inspectInterview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Candidate Recruitment Dossier</h3>
                <p className="text-xs text-[#4d7565]">
                  {inspectInterview.student?.fullName} ({inspectInterview.student?.studentId})
                </p>
              </div>
              <button onClick={() => setInspectInterview(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="bg-[#EAF6F0] p-4 rounded-xl border border-[#A7D6C0]/70 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#4d7565]">Course &amp; Department:</span>
                  <p className="font-bold text-[#143026]">
                    {inspectInterview.student?.course} — {inspectInterview.student?.department.name}
                  </p>
                </div>
                <div>
                  <span className="text-[#4d7565]">Academic Score:</span>
                  <p className="font-bold text-[#143026]">CGPA: {inspectInterview.student?.cgpa || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[#4d7565]">Email Address:</span>
                  <p className="font-bold text-[#143026]">{inspectInterview.student?.user.email}</p>
                </div>
                <div>
                  <span className="text-[#4d7565]">Application Status:</span>
                  <p className="font-bold text-[#2E9D74]">{inspectInterview.application?.status}</p>
                </div>
              </div>
            </div>

            {/* Assessment Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#143026]">Round Details</h4>
              <div className="border border-gray-200 rounded-xl p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#4d7565]">Round:</span>
                  <span className="font-bold text-[#143026]">
                    Round {inspectInterview.roundNumber}: {inspectInterview.roundName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4d7565]">Date:</span>
                  <span className="font-bold text-[#143026]">{formatDate(inspectInterview.interviewDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4d7565]">Time:</span>
                  <span className="font-bold text-[#143026]">
                    {formatTimeSlot(inspectInterview.startTime, inspectInterview.endTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4d7565]">Interviewer:</span>
                  <span className="font-bold text-[#143026]">{inspectInterview.interviewerName || 'Assigned Recruiter'}</span>
                </div>
                {inspectInterview.feedback && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[#4d7565] font-semibold block mb-0.5">Feedback:</span>
                    <p className="italic text-[#143026] bg-[#EAF6F0]/50 p-2 rounded-lg">"{inspectInterview.feedback}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setInspectInterview(null)}
                className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#25825f] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </RecruiterLayout>
  );
};
