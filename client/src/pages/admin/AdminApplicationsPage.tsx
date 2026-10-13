import React, { useEffect, useState } from 'react';
import { applicationService } from '../../services/application.service';
import type { Application, ApplicationStatus, ApplicationPagination } from '../../types/application.types';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
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

export const AdminApplicationsPage: React.FC = () => {
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
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Inspection Drawer
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

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await applicationService.getAdminApplications({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        opportunityType: typeFilter === 'ALL' ? undefined : typeFilter,
      });
      setApplications(res.applications);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load admin applications:', err);
      setErrorMessage(err.message || 'Unable to retrieve institutional applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, debouncedSearch, statusFilter, typeFilter]);

  const openInspectModal = async (appId: number) => {
    try {
      setReviewFeedback(null);
      setReviewNote('');
      const fullApp = await applicationService.getApplicationDetails(appId);
      setSelectedApp(fullApp);
    } catch (err: any) {
      console.error('Failed to inspect application:', err);
      alert(err.message || 'Could not load application details.');
    }
  };

  const handleAdminUpdateStatus = async (newStatus: ApplicationStatus) => {
    if (!selectedApp) return;

    try {
      setReviewActionLoading(true);
      setReviewFeedback(null);

      const updated = await applicationService.updateStatus(
        selectedApp.id,
        newStatus,
        reviewNote.trim() || `Administrative transition to ${newStatus}`
      );

      setReviewFeedback({
        type: 'success',
        message: `Application status transitioned to ${newStatus}.`,
      });

      setSelectedApp((prev) => (prev ? { ...prev, status: updated.status, statusHistory: updated.statusHistory } : null));
      fetchApplications();
    } catch (err: any) {
      console.error('Admin status update failed:', err);
      setReviewFeedback({
        type: 'error',
        message: err.message || 'Failed to update status.',
      });
    } finally {
      setReviewActionLoading(false);
    }
  };

  return (
    <AdminLayout
      pageTitle="Application Monitoring & Tracking"
      pageSubtitle="Review and filter student applications across all active campus drives"
    >
      <div className="space-y-6">
        {/* Title & Summary */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#143026]">
              Institutional Application Tracker
            </h1>
            <p className="text-xs text-[#4d7565] mt-1">
              Cross-company applicant tracking, qualification oversight, and status management
            </p>
          </div>
          <div className="px-4 py-2 bg-[#EAF6F0] rounded-2xl border border-[#A7D6C0] text-center">
            <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider block">
              Total Recorded Applications
            </span>
            <span className="text-xl font-black text-[#2E9D74]">{pagination.total}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, student ID, company, role..."
              className="w-full pl-9 pr-4 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs text-[#143026] placeholder-[#4d7565]/70 focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#4d7565]" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs font-medium text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
            >
              <option value="ALL">All Types</option>
              <option value="JOB">Jobs</option>
              <option value="INTERNSHIP">Internships</option>
            </select>

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

        {/* Content Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[35vh] space-y-3">
            <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[#4d7565]">Loading institutional applications...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 bg-white rounded-3xl border border-rose-200 text-center space-y-2">
            <p className="text-sm font-bold text-rose-800">Error loading applications</p>
            <p className="text-xs text-rose-600">{errorMessage}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center bg-white/90 backdrop-blur-md rounded-3xl border border-dashed border-[#A7D6C0] p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EAF6F0] flex items-center justify-center mx-auto text-[#2E9D74]">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#143026]">No applications found</h4>
            <p className="text-xs text-[#4d7565] max-w-sm mx-auto">
              No applications match the current query criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAF6F0]/60 border-b border-[#A7D6C0]/50 text-[#143026]">
                    <th className="py-3.5 px-4 font-bold">Candidate</th>
                    <th className="py-3.5 px-4 font-bold">Opportunity &amp; Company</th>
                    <th className="py-3.5 px-4 font-bold">Academic Standing</th>
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
                        {/* Candidate */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#143026] text-xs">{student?.fullName}</p>
                          <p className="text-[11px] text-[#4d7565]">
                            {student?.studentId} • {student?.department?.code}
                          </p>
                        </td>

                        {/* Opportunity */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#143026]">{opp?.title}</p>
                          <p className="text-[11px] text-[#4d7565]">{opp?.company?.name}</p>
                        </td>

                        {/* Academics */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            CGPA: {student?.cgpa ? Number(student.cgpa).toFixed(2) : 'N/A'}
                          </span>
                        </td>

                        {/* Date */}
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
                            onClick={() => openInspectModal(app.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EAF6F0] hover:bg-[#2E9D74] text-[#2E9D74] hover:text-white rounded-xl text-xs font-bold transition shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
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
                  <span className="font-bold text-[#143026]">{pagination.totalPages}</span> ({pagination.total} applications)
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

        {/* INSPECTION MODAL */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-[#A7D6C0] shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 my-6">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-4">
                <div>
                  <h3 className="font-bold text-base text-[#143026]">Institutional Application Inspection</h3>
                  <p className="text-xs text-[#4d7565]">Application #{selectedApp.id}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  ✕
                </button>
              </div>

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

              {/* Student Overview */}
              <div className="p-4 bg-[#EAF6F0]/40 rounded-2xl border border-[#A7D6C0]/50 space-y-1.5 text-xs">
                <p className="font-bold text-[#143026]">{selectedApp.student?.fullName}</p>
                <p className="text-[#4d7565]">
                  {selectedApp.student?.studentId} • {selectedApp.student?.course} (
                  {selectedApp.student?.department?.name}) • CGPA: {selectedApp.student?.cgpa ? Number(selectedApp.student.cgpa).toFixed(2) : 'N/A'}
                </p>
                <p className="text-[#4d7565]">
                  Applying for{' '}
                  <span className="font-bold text-[#143026]">
                    {selectedApp.job?.title || selectedApp.internship?.title}
                  </span>{' '}
                  at{' '}
                  <span className="font-bold text-[#143026]">
                    {selectedApp.job?.company?.name || selectedApp.internship?.company?.name}
                  </span>
                </p>
              </div>

              {/* Resume Link */}
              {selectedApp.resumeDocument && (
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
              )}

              {/* Administrative Actions */}
              <div className="p-4 bg-[#EAF6F0]/60 rounded-2xl border border-[#A7D6C0] space-y-3">
                <h4 className="font-bold text-xs text-[#143026]">Administrative Override Controls</h4>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Administrative audit notes..."
                  className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                ></textarea>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAdminUpdateStatus('UNDER_REVIEW')}
                    disabled={reviewActionLoading}
                    className="px-3 py-1.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-200 transition disabled:opacity-50"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => handleAdminUpdateStatus('SHORTLISTED')}
                    disabled={reviewActionLoading}
                    className="px-3 py-1.5 bg-[#2E9D74] text-white text-xs font-bold rounded-lg hover:bg-[#258260] transition disabled:opacity-50"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => handleAdminUpdateStatus('REJECTED')}
                    disabled={reviewActionLoading}
                    className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-lg hover:bg-rose-100 transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Status History */}
              {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
                <div className="space-y-2 border-t border-[#A7D6C0]/40 pt-3">
                  <h4 className="font-bold text-xs text-[#143026]">Timeline History</h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
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
    </AdminLayout>
  );
};
