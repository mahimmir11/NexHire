import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StudentLayout } from '../../components/student/StudentLayout';
import { opportunityService } from '../../services/opportunity.service';
import { applicationService } from '../../services/application.service';
import { studentService } from '../../services/student.service';
import type { OpportunityDetail } from '../../types/opportunity.types';
import type { ApplicationStatusCheck } from '../../types/application.types';
import type { StudentDocument } from '../../types/student.types';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  FileText,
  Clock,
  Send,
  ExternalLink,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

interface OpportunityDetailPageProps {
  type: 'JOB' | 'INTERNSHIP';
}

export const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({ type }) => {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Application state (Step 7)
  const [appStatusCheck, setAppStatusCheck] = useState<ApplicationStatusCheck | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumes, setResumes] = useState<StudentDocument[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [applyErrorMessage, setApplyErrorMessage] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const oppId = Number(id);

      const [oppData, statusData] = await Promise.all([
        type === 'JOB'
          ? opportunityService.getJobDetails(oppId)
          : opportunityService.getInternshipDetails(oppId),
        applicationService.checkStatus(type, oppId).catch(() => null),
      ]);

      setOpportunity(oppData);
      setAppStatusCheck(statusData);
    } catch (err: any) {
      console.error('Failed to load opportunity details:', err);
      setErrorMessage(err.message || 'Unable to load opportunity details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApplyModal = async () => {
    setApplyErrorMessage(null);
    setApplySuccessMessage(null);
    setIsApplyModalOpen(true);
    try {
      const docs = await studentService.getDocuments();
      const resumeDocs = docs.filter((d) => d.type === 'RESUME');
      setResumes(resumeDocs);
      if (resumeDocs.length > 0) {
        setSelectedResumeId(resumeDocs[0].id);
      }
    } catch (err) {
      console.warn('Could not fetch student resumes:', err);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmittingApply(true);
      setApplyErrorMessage(null);

      const createdApp = await applicationService.apply({
        opportunityType: type,
        opportunityId: Number(id),
        coverLetter: coverLetter.trim() || undefined,
        resumeDocumentId: selectedResumeId || undefined,
      });

      setApplySuccessMessage('Application submitted successfully!');
      setAppStatusCheck({
        hasApplied: true,
        application: {
          id: createdApp.id,
          status: createdApp.status,
          appliedAt: createdApp.appliedAt,
          opportunityType: type,
        },
      });

      setTimeout(() => {
        setIsApplyModalOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setApplyErrorMessage(err.message || 'Failed to submit application. Please check eligibility requirements.');
    } finally {
      setSubmittingApply(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, type]);

  if (loading) {
    return (
      <StudentLayout pageTitle="Opportunity Details" pageSubtitle="Loading position specifications...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#315746]">Retrieving campus opportunity profile...</p>
        </div>
      </StudentLayout>
    );
  }

  if (errorMessage || !opportunity) {
    return (
      <StudentLayout pageTitle="Opportunity Details" pageSubtitle="Error">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-rose-200 text-center max-w-lg mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">Opportunity Unavailable</h3>
          <p className="text-xs text-gray-600 mt-1 mb-5">{errorMessage || 'Could not find the requested opportunity.'}</p>
          <Link
            to="/student/opportunities"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Opportunities
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const eligibility = opportunity.eligibility;
  const isEligible = eligibility ? eligibility.isEligible : true;
  const isExpired = opportunity.applicationDeadline
    ? new Date(opportunity.applicationDeadline) < new Date()
    : false;

  return (
    <StudentLayout
      pageTitle={opportunity.title}
      pageSubtitle={`${opportunity.company.name} • ${type === 'JOB' ? 'Full-Time Position' : 'Internship Drive'}`}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/student/opportunities"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E9D74] hover:text-[#1e6a4e] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Campus Drives
          </Link>

          {appStatusCheck?.hasApplied && (
            <Link
              to={`/student/applications/${appStatusCheck.application?.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#EAF6F0] text-[#2E9D74] rounded-xl border border-[#A7D6C0] hover:bg-[#A7D6C0]/30 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View My Application
            </Link>
          )}
        </div>

        {/* Opportunity Header Banner */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#EAF6F0] border border-[#A7D6C0] flex items-center justify-center text-xl font-black text-[#2E9D74] shadow-sm flex-shrink-0 overflow-hidden">
                {opportunity.company.logoUrl ? (
                  <img
                    src={opportunity.company.logoUrl}
                    alt={opportunity.company.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  opportunity.company.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black text-[#143026]">{opportunity.title}</h1>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      type === 'JOB'
                        ? 'bg-[#2E9D74]/10 text-[#2E9D74] border-[#2E9D74]/20'
                        : 'bg-[#61B795]/15 text-[#247c59] border-[#61B795]/30'
                    }`}
                  >
                    {type}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#4d7565] flex items-center gap-1.5">
                  <span>{opportunity.company.name}</span>
                  <span>•</span>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {opportunity.location} ({opportunity.workMode})
                  </span>
                </p>
              </div>
            </div>

            {/* Compensation & Deadline */}
            <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-[#A7D6C0]/40">
              <div className="text-left md:text-right">
                <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider block">
                  {type === 'JOB' ? 'Offered Package (CTC)' : 'Monthly Stipend'}
                </span>
                <span className="text-lg md:text-xl font-black text-[#2E9D74]">
                  {type === 'JOB'
                    ? opportunity.salaryMin && opportunity.salaryMax
                      ? `₹${(Number(opportunity.salaryMin) / 100000).toFixed(1)}L - ₹${(Number(opportunity.salaryMax) / 100000).toFixed(1)}L PA`
                      : 'Best in Industry'
                    : opportunity.stipendAmount
                    ? `₹${opportunity.stipendAmount.toLocaleString()} / mo`
                    : 'Unpaid'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#4d7565] flex items-center gap-1 justify-end">
                  <Clock className="w-3.5 h-3.5" /> Deadline:{' '}
                  {opportunity.applicationDeadline
                    ? new Date(opportunity.applicationDeadline).toLocaleDateString()
                    : 'Open'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Left Content, Right Eligibility & Apply */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Details, Specs, Responsibilities, Requirements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-7 border border-[#A7D6C0]/70 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#143026]">About The Opportunity</h3>
              <p className="text-xs leading-relaxed text-[#315746] whitespace-pre-line">
                {opportunity.description}
              </p>

              {opportunity.responsibilities && (
                <div className="pt-4 border-t border-[#A7D6C0]/40 space-y-2">
                  <h4 className="font-bold text-sm text-[#143026]">Roles &amp; Responsibilities</h4>
                  <p className="text-xs leading-relaxed text-[#315746] whitespace-pre-line">
                    {opportunity.responsibilities}
                  </p>
                </div>
              )}

              {opportunity.requirements && (
                <div className="pt-4 border-t border-[#A7D6C0]/40 space-y-2">
                  <h4 className="font-bold text-sm text-[#143026]">Candidate Requirements</h4>
                  <p className="text-xs leading-relaxed text-[#315746] whitespace-pre-line">
                    {opportunity.requirements}
                  </p>
                </div>
              )}
            </div>

            {/* Skills & Process */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-7 border border-[#A7D6C0]/70 shadow-sm space-y-5">
              <div>
                <h4 className="font-bold text-sm text-[#143026] mb-3">Required Technical Competencies</h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.requiredSkills ? (
                    opportunity.requiredSkills.split(',').map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#EAF6F0] text-[#2E9D74] font-semibold text-xs rounded-xl border border-[#A7D6C0]/60 shadow-2xs"
                      >
                        {skill.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#4d7565]">No specific skills required.</span>
                  )}
                </div>
              </div>

              {opportunity.selectionProcess && (
                <div className="pt-4 border-t border-[#A7D6C0]/40">
                  <h4 className="font-bold text-sm text-[#143026] mb-2">Selection &amp; Interview Process</h4>
                  <p className="text-xs text-[#315746] leading-relaxed whitespace-pre-line">
                    {opportunity.selectionProcess}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Real-Time Eligibility Card & Live Apply CTA */}
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-7 border border-[#A7D6C0]/70 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2E9D74]" />
                  <h3 className="font-bold text-sm text-[#143026]">Your Eligibility Status</h3>
                </div>
                <span className="text-[10px] font-bold text-[#4d7565] uppercase tracking-wider">
                  Automated Check
                </span>
              </div>

              {/* Eligibility Outcome Banner */}
              {isEligible ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>You Are Eligible!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Your academic profile, CGPA, department, and active backlog status satisfy all requirements set by {opportunity.company.name}.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <span>Not Eligible</span>
                  </div>
                  <ul className="text-xs text-rose-700 space-y-1 list-disc pl-4">
                    {eligibility?.reasons?.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Breakdown Table */}
              {(eligibility as any)?.criteriaSummary && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block">
                    Criteria Comparison
                  </span>
                  <div className="divide-y divide-[#A7D6C0]/30 text-xs">
                    {Object.entries((eligibility as any).criteriaSummary).map(([key, item]: [string, any]) => (
                      <div key={key} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#143026]">{item.criterion}</p>
                          <p className="text-[10px] text-[#4d7565]">
                            Req: {Array.isArray(item.required) ? item.required.join(', ') : item.required}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              item.satisfied
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.satisfied ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Met
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" /> Not Met
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 7 Application CTA */}
              <div className="pt-4 border-t border-[#A7D6C0]/40 space-y-3">
                {appStatusCheck?.hasApplied ? (
                  <div className="p-4 bg-[#EAF6F0] rounded-2xl border border-[#A7D6C0] text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#2E9D74]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Application Submitted</span>
                    </div>
                    <p className="text-xs text-[#4d7565]">
                      Applied on {new Date(appStatusCheck.application!.appliedAt).toLocaleDateString()}
                    </p>
                    <div className="pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white text-[#143026] rounded-full border border-[#A7D6C0] shadow-2xs">
                        Current Status: {appStatusCheck.application!.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="pt-2">
                      <Link
                        to={`/student/applications/${appStatusCheck.application!.id}`}
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition shadow-xs"
                      >
                        <FileText className="w-4 h-4" /> View Full Application &amp; Timeline
                      </Link>
                    </div>
                  </div>
                ) : isExpired ? (
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-center space-y-1 text-gray-600">
                    <p className="text-xs font-bold">Applications Closed</p>
                    <p className="text-[11px]">The application deadline for this drive has passed.</p>
                  </div>
                ) : !isEligible ? (
                  <div className="space-y-2 text-center">
                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed border border-gray-200"
                    >
                      Ineligible to Apply
                    </button>
                    <p className="text-[11px] text-[#4d7565]">
                      Only candidates meeting all criteria can submit an application for this drive.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <button
                      onClick={handleOpenApplyModal}
                      className="w-full py-3.5 bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold rounded-xl transition shadow-md shadow-[#2E9D74]/20 flex items-center justify-center gap-2 group"
                    >
                      <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      Apply for this {type === 'JOB' ? 'Position' : 'Internship'}
                    </button>
                    <p className="text-[11px] text-[#4d7565]">
                      Applications close on{' '}
                      {opportunity.applicationDeadline
                        ? new Date(opportunity.applicationDeadline).toLocaleDateString()
                        : 'soon'}
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 7 APPLY MODAL */}
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-[#A7D6C0] shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF6F0] text-[#2E9D74] flex items-center justify-center font-bold">
                    {type === 'JOB' ? <Briefcase className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#143026]">Confirm Application</h3>
                    <p className="text-xs text-[#4d7565]">{opportunity.company.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  ✕
                </button>
              </div>

              {applyErrorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{applyErrorMessage}</span>
                </div>
              )}

              {applySuccessMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>{applySuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {/* Position Summary Pill */}
                <div className="p-3 bg-[#EAF6F0]/60 rounded-2xl border border-[#A7D6C0]/50 space-y-1">
                  <p className="text-xs font-bold text-[#143026]">{opportunity.title}</p>
                  <p className="text-[11px] text-[#4d7565]">
                    {opportunity.location} • {opportunity.workMode}
                  </p>
                </div>

                {/* Resume Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#143026] block">Select Resume</label>
                  {resumes.length > 0 ? (
                    <select
                      value={selectedResumeId || ''}
                      onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#EAF6F0]/30 border border-[#A7D6C0] rounded-xl text-xs font-medium text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.fileName})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                      No resume uploaded yet. You can still apply; or upload one in your{' '}
                      <Link to="/student/profile" className="underline font-bold text-[#2E9D74]">
                        Student Profile
                      </Link>
                      .
                    </div>
                  )}
                </div>

                {/* Cover Letter / Note */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#143026]">Cover Letter / Statement (Optional)</label>
                    <span className="text-[10px] text-[#4d7565]">{coverLetter.length} / 3000</span>
                  </div>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    maxLength={3000}
                    placeholder="Briefly state why you're interested in this role and your key strengths..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74] resize-none"
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#A7D6C0]/40">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    disabled={submittingApply}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="px-5 py-2.5 bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 disabled:opacity-60"
                  >
                    {submittingApply ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Application
                      </>
                    )}
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
