import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StudentLayout } from '../../components/student/StudentLayout';
import { applicationService } from '../../services/application.service';
import type { Application, ApplicationStatus } from '../../types/application.types';
import {
  ArrowLeft,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
  ExternalLink,
  Download,
  AlertTriangle,
  History,
  XCircle,
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
  REJECTED: { label: 'Not Selected', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  WITHDRAWN: { label: 'Withdrawn', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
  HIRED_PLACED: { label: 'Placed', bg: 'bg-[#2E9D74]/15', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]' },
};

export const StudentApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawNote, setWithdrawNote] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchApplication = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await applicationService.getMyApplicationById(Number(id));
      setApplication(data);
    } catch (err: any) {
      console.error('Failed to load application:', err);
      setErrorMessage(err.message || 'Unable to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    try {
      setWithdrawing(true);
      setActionError(null);
      await applicationService.withdrawApplication(application.id, withdrawNote.trim() || undefined);
      setIsWithdrawModalOpen(false);
      fetchApplication();
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      setActionError(err.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  if (loading) {
    return (
      <StudentLayout pageTitle="Application Details" pageSubtitle="Loading application specifications...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#315746]">Retrieving application tracking record...</p>
        </div>
      </StudentLayout>
    );
  }

  if (errorMessage || !application) {
    return (
      <StudentLayout pageTitle="Application Details" pageSubtitle="Error">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-rose-200 text-center max-w-lg mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">Application Unavailable</h3>
          <p className="text-xs text-gray-600 mt-1 mb-5">{errorMessage || 'Could not find the requested application.'}</p>
          <Link
            to="/student/applications"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Applications
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const opp = application.job || application.internship;
  const statusCfg = STATUS_CONFIG[application.status] || {
    label: application.status,
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
  };

  const isWithdrawAllowed =
    application.status === 'APPLIED' || application.status === 'UNDER_REVIEW';

  return (
    <StudentLayout
      pageTitle={opp?.title || 'Application Details'}
      pageSubtitle={`${opp?.company?.name || 'Company'} • Application #${application.id}`}
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/student/applications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E9D74] hover:text-[#1e6a4e] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Applications
          </Link>

          <span className="text-xs text-[#4d7565]">
            Application ID: <span className="font-bold text-[#143026]">APP-{application.id}</span>
          </span>
        </div>

        {/* HERO HEADER */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#EAF6F0] border border-[#A7D6C0] flex items-center justify-center text-xl font-black text-[#2E9D74] shadow-sm flex-shrink-0 overflow-hidden">
                {opp?.company?.logoUrl ? (
                  <img
                    src={opp.company.logoUrl}
                    alt={opp.company.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  opp?.company?.name?.slice(0, 2).toUpperCase() || 'NH'
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black text-[#143026]">{opp?.title}</h1>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      application.opportunityType === 'JOB'
                        ? 'bg-[#2E9D74]/10 text-[#2E9D74] border-[#2E9D74]/20'
                        : 'bg-[#61B795]/15 text-[#247c59] border-[#61B795]/30'
                    }`}
                  >
                    {application.opportunityType}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#4d7565] flex items-center gap-1.5">
                  <span>{opp?.company?.name}</span>
                  <span>•</span>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {opp?.location} ({opp?.workMode})
                  </span>
                </p>
                <p className="text-xs text-[#4d7565] flex items-center gap-1 pt-1">
                  <Clock className="w-3.5 h-3.5" /> Submitted on{' '}
                  {new Date(application.appliedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Current Status Badge */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider">
                Current Status
              </span>
              <span
                className={`text-sm font-black px-4 py-1.5 rounded-full border shadow-2xs ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                {statusCfg.label}
              </span>
              {application.statusRemarks && (
                <p className="text-xs text-gray-500 italic max-w-xs text-left md:text-right">
                  "{application.statusRemarks}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TWO-COLUMN DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2-COLS: Interactive Status Timeline & Candidate Submission */}
          <div className="lg:col-span-2 space-y-6">
            {/* STATUS TIMELINE */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-7 border border-[#A7D6C0]/70 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#2E9D74]" />
                  <h3 className="font-bold text-sm text-[#143026]">Application Progress Timeline</h3>
                </div>
                <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider">
                  Real Audit Trail
                </span>
              </div>

              {application.statusHistory && application.statusHistory.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#A7D6C0]">
                  {application.statusHistory.map((item, idx) => {
                    const isLatest = idx === application.statusHistory!.length - 1;
                    const itemCfg = STATUS_CONFIG[item.newStatus] || {
                      label: item.newStatus,
                      bg: 'bg-gray-100',
                      text: 'text-gray-800',
                      border: 'border-gray-200',
                    };

                    return (
                      <div key={item.id} className="relative group">
                        {/* Node circle */}
                        <div
                          className={`absolute -left-[27px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isLatest
                              ? 'bg-[#2E9D74] border-white ring-4 ring-[#2E9D74]/20'
                              : 'bg-white border-[#2E9D74]'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${isLatest ? 'bg-white' : 'bg-[#2E9D74]'}`} />
                        </div>

                        {/* Content */}
                        <div className="bg-[#EAF6F0]/40 group-hover:bg-[#EAF6F0]/70 rounded-2xl p-4 border border-[#A7D6C0]/50 transition-colors space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${itemCfg.bg} ${itemCfg.text} ${itemCfg.border}`}
                            >
                              {itemCfg.label}
                            </span>
                            <span className="text-[11px] text-[#4d7565]">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {item.note && (
                            <p className="text-xs text-[#143026] leading-relaxed pt-0.5">
                              {item.note}
                            </p>
                          )}

                          {item.changedBy && (
                            <p className="text-[10px] text-[#4d7565]">
                              Updated by:{' '}
                              <span className="font-semibold uppercase tracking-wider">
                                {item.changedBy.role.replace('_', ' ')}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#4d7565]">No history entries recorded yet.</p>
              )}
            </div>

            {/* CANDIDATE SUBMISSION DETAILS */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-7 border border-[#A7D6C0]/70 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#143026] border-b border-[#A7D6C0]/40 pb-3">
                Your Submission Details
              </h3>

              {/* Cover Letter */}
              <div>
                <label className="text-xs font-bold text-[#4d7565] uppercase tracking-wider block mb-1">
                  Cover Letter / Statement
                </label>
                {application.coverLetter ? (
                  <p className="p-4 bg-[#EAF6F0]/30 rounded-2xl border border-[#A7D6C0]/40 text-xs text-[#143026] leading-relaxed whitespace-pre-line">
                    {application.coverLetter}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No cover letter submitted.</p>
                )}
              </div>

              {/* Attached Resume */}
              <div className="pt-2">
                <label className="text-xs font-bold text-[#4d7565] uppercase tracking-wider block mb-1.5">
                  Attached Resume Document
                </label>
                {application.resumeDocument ? (
                  <div className="flex items-center justify-between p-3.5 bg-[#EAF6F0]/50 rounded-2xl border border-[#A7D6C0]/60 max-w-md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white text-[#2E9D74] border border-[#A7D6C0] flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#143026]">
                          {application.resumeDocument.title}
                        </p>
                        <p className="text-[10px] text-[#4d7565]">
                          {application.resumeDocument.fileName} •{' '}
                          {(application.resumeDocument.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <a
                      href={application.resumeDocument.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[#2E9D74] hover:text-[#1e6a4e] hover:bg-white rounded-lg transition"
                      title="Download / View Resume"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No resume attached to this application.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 1-COL: Opportunity Quick Summary & Withdrawal */}
          <div className="space-y-6">
            {/* Quick Opportunity Details */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0]/70 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#143026] border-b border-[#A7D6C0]/40 pb-2">
                Position Snapshot
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider block">
                    Company
                  </span>
                  <span className="font-semibold text-[#143026]">{opp?.company?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider block">
                    Headquarters
                  </span>
                  <span className="font-semibold text-[#143026]">
                    {opp?.company?.headquarters || 'India'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider block">
                    Work Mode &amp; Location
                  </span>
                  <span className="font-semibold text-[#143026]">
                    {opp?.location} ({opp?.workMode})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider block">
                    Compensation
                  </span>
                  <span className="font-bold text-[#2E9D74]">
                    {application.opportunityType === 'JOB'
                      ? opp?.salaryMin && opp?.salaryMax
                        ? `₹${(Number(opp.salaryMin) / 100000).toFixed(1)}L - ₹${(Number(opp.salaryMax) / 100000).toFixed(1)}L PA`
                        : 'Competitive'
                      : opp?.stipendAmount
                      ? `₹${Number(opp.stipendAmount).toLocaleString()} / mo`
                      : 'Unpaid'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={
                    application.opportunityType === 'JOB'
                      ? `/student/opportunities/job/${application.jobId}`
                      : `/student/opportunities/internship/${application.internshipId}`
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E9D74] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Original Job Post
                </Link>
              </div>
            </div>

            {/* WITHDRAWAL SECTION */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0]/70 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#143026]">Application Options</h3>

              {isWithdrawAllowed ? (
                <div className="space-y-2">
                  <p className="text-xs text-[#4d7565] leading-relaxed">
                    You may withdraw this application while it remains in <strong>Applied</strong> or{' '}
                    <strong>Under Review</strong> status.
                  </p>
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Withdraw Application
                  </button>
                </div>
              ) : application.status === 'WITHDRAWN' ? (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center text-xs text-gray-500 font-medium">
                  This application was withdrawn and is inactive.
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Withdrawal Locked</p>
                  <p className="text-[11px] leading-relaxed">
                    This application has progressed to{' '}
                    <span className="font-bold">{statusCfg.label}</span> and can no longer be self-withdrawn online.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WITHDRAW CONFIRMATION MODAL */}
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 md:p-7 max-w-md w-full border border-rose-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-bold text-base text-[#143026]">Withdraw Application?</h3>
              </div>

              <p className="text-xs text-[#4d7565] leading-relaxed">
                Are you sure you want to withdraw your application for{' '}
                <span className="font-bold text-[#143026]">{opp?.title}</span>? This action is
                irreversible.
              </p>

              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#143026] block mb-1">
                    Reason for withdrawal (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    placeholder="e.g. Accepted another offer, personal reasons..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    disabled={withdrawing}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawing}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {withdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};
