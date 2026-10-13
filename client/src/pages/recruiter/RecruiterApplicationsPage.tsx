import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { applicationService } from '../../services/application.service';
import { opportunityService } from '../../services/opportunity.service';
import type { Application, ApplicationStatus, ApplicationPagination } from '../../types/application.types';
import type { OpportunityListItem } from '../../types/opportunity.types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  Award,
} from 'lucide-react';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; border: string }> = {
  APPLIED: { label: 'Applied', bg: 'bg-[#EAF6F0]', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]/30' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  SHORTLISTED: { label: 'Shortlisted', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  SELECTED: { label: 'Selected', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300' },
  OFFER_RECEIVED: { label: 'Offer Received', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  OFFER_ACCEPTED: { label: 'Offer Accepted', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-400' },
  OFFER_REJECTED: { label: 'Offer Declined', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  WITHDRAWN: { label: 'Withdrawn', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
  HIRED_PLACED: { label: 'Hired', bg: 'bg-[#2E9D74]/15', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]' },
};

export const RecruiterApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<ApplicationPagination>({
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
  const [statusFilter, setStatusFilter] = useState('');
  const [opportunityIdFilter, setOpportunityIdFilter] = useState('');

  // Opportunities for dropdown
  const [companyJobs, setCompanyJobs] = useState<OpportunityListItem[]>([]);
  const [companyInternships, setCompanyInternships] = useState<OpportunityListItem[]>([]);

  // Review Drawer / Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load recruiter's company opportunities for filter dropdown
  useEffect(() => {
    const loadCompanyOpps = async () => {
      try {
        const [jobs, internships] = await Promise.all([
          opportunityService.getMyCompanyJobs(),
          opportunityService.getMyCompanyInternships(),
        ]);
        setCompanyJobs(jobs);
        setCompanyInternships(internships);
      } catch (err) {
        console.warn('Could not load company opportunities for filter:', err);
      }
    };
    loadCompanyOpps();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await applicationService.getCompanyApplications({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        opportunityId: opportunityIdFilter || undefined,
      });
      setApplications(res.applications);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load recruiter applications:', err);
      setErrorMessage(err.message || 'Unable to retrieve applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, debouncedSearch, statusFilter, opportunityIdFilter]);

  // Open candidate review modal
  const openReviewModal = async (appId: number) => {
    try {
      setReviewFeedback(null);
      setReviewNote('');
      const fullApp = await applicationService.getApplicationDetails(appId);
      setSelectedApp(fullApp);
    } catch (err: any) {
      console.error('Failed to load full application details:', err);
      alert(err.message || 'Could not load application details.');
    }
  };

  const handleUpdateStatus = async (newStatus: ApplicationStatus, noteText?: string) => {
    if (!selectedApp) return;

    try {
      setReviewActionLoading(true);
      setReviewFeedback(null);

      const updated = await applicationService.updateStatus(
        selectedApp.id,
        newStatus,
        noteText || reviewNote.trim() || undefined
      );

      setReviewFeedback({
        type: 'success',
        message: `Status successfully updated to ${newStatus}.`,
      });

      // Update local detailed application state
      setSelectedApp((prev) => (prev ? { ...prev, status: updated.status, statusHistory: updated.statusHistory } : null));

      // Refresh listing table in background
      fetchApplications();
    } catch (err: any) {
      console.error('Status update failed:', err);
      setReviewFeedback({
        type: 'error',
        message: err.message || 'Failed to update candidate status.',
      });
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleAddNoteOnly = async () => {
    if (!selectedApp || !reviewNote.trim()) return;

    try {
      setReviewActionLoading(true);
      setReviewFeedback(null);

      const newHistory = await applicationService.addNote(selectedApp.id, reviewNote.trim());
      setReviewFeedback({
        type: 'success',
        message: 'Review note added to timeline.',
      });

      setReviewNote('');
      setSelectedApp((prev) =>
        prev
          ? {
              ...prev,
              statusHistory: [...(prev.statusHistory || []), newHistory],
            }
          : null
      );
    } catch (err: any) {
      console.error('Add note failed:', err);
      setReviewFeedback({
        type: 'error',
        message: err.message || 'Failed to record review note.',
      });
    } finally {
      setReviewActionLoading(false);
    }
  };

  // Metrics
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW').length;
  const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  return (
    <RecruiterLayout
      pageTitle="Applicant Management"
      pageSubtitle="Evaluate candidate profiles, review resumes, update statuses, and log recruitment notes"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* METRICS HEADER CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Total Applicants
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#143026]">{pagination.total}</span>
              <span className="text-xs text-[#2E9D74] font-semibold">Active Drives</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Under Review
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{underReviewCount}</span>
              <span className="text-xs text-[#4d7565]">Pending Action</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Shortlisted
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{shortlistedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">Advancing</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Not Selected
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700">{rejectedCount}</span>
              <span className="text-xs text-[#4d7565]">Closed</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, student ID, roll number, or role..."
              className="w-full pl-9 pr-4 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs text-[#143026] placeholder-[#4d7565]/70 focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
            />
          </div>

          {/* Opportunity Dropdown */}
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-[#4d7565]" />
            <select
              value={opportunityIdFilter}
              onChange={(e) => {
                setOpportunityIdFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs font-medium text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74] max-w-xs"
            >
              <option value="">All Openings</option>
              <optgroup label="Jobs">
                {companyJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    Job: {j.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Internships">
                {companyInternships.map((i) => (
                  <option key={i.id} value={i.id}>
                    Internship: {i.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#4d7565]" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs font-medium text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
            >
              <option value="">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* APPLICANTS TABLE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[35vh] space-y-3">
            <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[#4d7565]">Loading candidates...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 bg-white rounded-3xl border border-rose-200 text-center space-y-2">
            <p className="text-sm font-bold text-rose-800">Error loading candidates</p>
            <p className="text-xs text-rose-600">{errorMessage}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center bg-white/90 backdrop-blur-md rounded-3xl border border-dashed border-[#A7D6C0] p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EAF6F0] flex items-center justify-center mx-auto text-[#2E9D74]">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#143026]">No applicants found</h4>
            <p className="text-xs text-[#4d7565] max-w-sm mx-auto">
              {debouncedSearch || statusFilter || opportunityIdFilter
                ? 'Try adjusting your search criteria or filters.'
                : 'No candidate applications have been submitted for your company positions yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAF6F0]/60 border-b border-[#A7D6C0]/50 text-[#143026]">
                    <th className="py-3.5 px-4 font-bold">Candidate</th>
                    <th className="py-3.5 px-4 font-bold">Academic Record</th>
                    <th className="py-3.5 px-4 font-bold">Role Applied</th>
                    <th className="py-3.5 px-4 font-bold">Applied Date</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/30">
                  {applications.map((app) => {
                    const student = app.student;
                    const opp = app.job || app.internship;
                    const statusCfg = STATUS_CONFIG[app.status] || {
                      label: app.status,
                      bg: 'bg-gray-100',
                      text: 'text-gray-800',
                      border: 'border-gray-200',
                    };

                    return (
                      <tr key={app.id} className="hover:bg-[#EAF6F0]/20 transition-colors">
                        {/* Candidate Name & Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#2E9D74]/10 text-[#2E9D74] flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {student?.fullName?.slice(0, 2).toUpperCase() || 'ST'}
                            </div>
                            <div>
                              <p className="font-bold text-[#143026] text-xs">{student?.fullName}</p>
                              <p className="text-[11px] text-[#4d7565]">
                                {student?.studentId} • {student?.user?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Academic Record */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-[#143026]">
                              {student?.course} ({student?.department?.code})
                            </p>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold">
                                CGPA: {student?.cgpa ? Number(student.cgpa).toFixed(2) : 'N/A'}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  student?.backlogs === 0
                                    ? 'bg-[#EAF6F0] text-[#2E9D74]'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {student?.backlogs} backlogs
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Applied */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-[#143026]">{opp?.title}</p>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded border ${
                                app.opportunityType === 'JOB'
                                  ? 'bg-[#2E9D74]/10 text-[#2E9D74] border-[#2E9D74]/20'
                                  : 'bg-[#61B795]/15 text-[#247c59] border-[#61B795]/30'
                              }`}
                            >
                              {app.opportunityType}
                            </span>
                          </div>
                        </td>

                        {/* Applied Date */}
                        <td className="py-3.5 px-4 text-[#4d7565]">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openReviewModal(app.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EAF6F0] hover:bg-[#2E9D74] text-[#2E9D74] hover:text-white rounded-xl text-xs font-bold transition shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#A7D6C0]/50 bg-[#EAF6F0]/20">
                <p className="text-xs text-[#4d7565]">
                  Page <span className="font-bold text-[#143026]">{pagination.page}</span> of{' '}
                  <span className="font-bold text-[#143026]">{pagination.totalPages}</span> ({pagination.total} applicants)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] disabled:opacity-40 hover:bg-[#EAF6F0] transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] disabled:opacity-40 hover:bg-[#EAF6F0] transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CANDIDATE REVIEW DRAWER / MODAL */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-[#A7D6C0] shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 my-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF6F0] border border-[#A7D6C0] text-[#2E9D74] flex items-center justify-center font-black text-sm">
                    {selectedApp.student?.fullName?.slice(0, 2).toUpperCase() || 'ST'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#143026]">{selectedApp.student?.fullName}</h3>
                    <p className="text-xs text-[#4d7565]">
                      Applying for <span className="font-semibold text-[#143026]">{selectedApp.job?.title || selectedApp.internship?.title}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  ✕
                </button>
              </div>

              {/* Feedback Alert */}
              {reviewFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
                    reviewFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {reviewFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  )}
                  <span>{reviewFeedback.message}</span>
                </div>
              )}

              {/* Candidate Academic Details Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#EAF6F0]/40 p-4 rounded-2xl border border-[#A7D6C0]/50 text-xs">
                <div>
                  <span className="text-[10px] text-[#4d7565] uppercase font-bold block">Course &amp; Dept</span>
                  <span className="font-bold text-[#143026]">
                    {selectedApp.student?.course} ({selectedApp.student?.department?.code})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#4d7565] uppercase font-bold block">CGPA</span>
                  <span className="font-bold text-[#2E9D74]">
                    {selectedApp.student?.cgpa ? Number(selectedApp.student.cgpa).toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#4d7565] uppercase font-bold block">Backlogs</span>
                  <span className="font-bold text-[#143026]">{selectedApp.student?.backlogs || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#4d7565] uppercase font-bold block">Graduation</span>
                  <span className="font-bold text-[#143026]">{selectedApp.student?.graduationYear}</span>
                </div>
              </div>

              {/* Verified Skills */}
              {selectedApp.student?.skills && selectedApp.student.skills.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-[#143026] mb-1.5">Candidate Skills Portfolio</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.student.skills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-0.5 bg-white text-[#2E9D74] border border-[#A7D6C0] rounded-lg text-[11px] font-semibold"
                      >
                        {s.skill.name} ({s.proficiency})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attached Resume */}
              <div>
                <h4 className="font-bold text-xs text-[#143026] mb-1.5">Attached Resume</h4>
                {selectedApp.resumeDocument ? (
                  <div className="flex items-center justify-between p-3 bg-white border border-[#A7D6C0] rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2E9D74]" />
                      <span className="font-medium text-[#143026]">
                        {selectedApp.resumeDocument.title} ({selectedApp.resumeDocument.fileName})
                      </span>
                    </div>
                    <a
                      href={selectedApp.resumeDocument.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#2E9D74] text-white rounded-lg text-xs font-bold hover:bg-[#258260] transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No resume attached to this application.</p>
                )}
              </div>

              {/* Cover Letter */}
              {selectedApp.coverLetter && (
                <div>
                  <h4 className="font-bold text-xs text-[#143026] mb-1">Candidate Statement</h4>
                  <p className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#143026] leading-relaxed whitespace-pre-line">
                    {selectedApp.coverLetter}
                  </p>
                </div>
              )}

              {/* STATUS CHANGE CONTROLS */}
              <div className="p-4 bg-[#EAF6F0]/60 rounded-2xl border border-[#A7D6C0] space-y-3">
                <h4 className="font-bold text-xs text-[#143026]">Recruitment Evaluation Actions</h4>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#4d7565] uppercase tracking-wider block">
                    Review Note / Candidate Feedback
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter review notes, assessment scores, or feedback..."
                    className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                  ></textarea>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddNoteOnly}
                    disabled={reviewActionLoading || !reviewNote.trim()}
                    className="px-3 py-2 bg-white border border-[#A7D6C0] text-[#143026] rounded-xl text-xs font-bold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    + Log Note Only
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedApp.status === 'APPLIED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('UNDER_REVIEW', 'Moved to Under Review')}
                        disabled={reviewActionLoading}
                        className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition disabled:opacity-50"
                      >
                        Mark Under Review
                      </button>
                    )}

                    {(selectedApp.status === 'APPLIED' || selectedApp.status === 'UNDER_REVIEW') && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('SHORTLISTED', 'Candidate shortlisted for interview round')}
                        disabled={reviewActionLoading}
                        className="px-4 py-2 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Shortlist Candidate
                      </button>
                    )}

                    {(selectedApp.status === 'SHORTLISTED' || selectedApp.status === 'INTERVIEW_SCHEDULED') && (
                      <Link
                        to="/recruiter/interviews"
                        className="px-4 py-2 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Schedule / View Interviews
                      </Link>
                    )}

                    {selectedApp.status === 'SELECTED' && (
                      <Link
                        to="/recruiter/offers"
                        className="px-4 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" /> Extend Job Offer
                      </Link>
                    )}

                    {selectedApp.status !== 'REJECTED' && selectedApp.status !== 'WITHDRAWN' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('REJECTED', 'Profile does not match current requirements')}
                        disabled={reviewActionLoading}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Audit History Timeline */}
              {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
                <div className="space-y-2 border-t border-[#A7D6C0]/40 pt-3">
                  <h4 className="font-bold text-xs text-[#143026]">Evaluation History</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedApp.statusHistory.map((h) => (
                      <div key={h.id} className="p-2.5 bg-gray-50 rounded-xl text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between text-[#4d7565]">
                          <span className="font-bold text-[#143026]">{h.newStatus}</span>
                          <span>{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                        {h.note && <p className="text-gray-700">{h.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};
