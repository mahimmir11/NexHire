import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { companyService } from '../../services/company.service';
import type { RecruiterDashboardSummary } from '../../types/company.types';
import {
  Users,
  Briefcase,
  GraduationCap,
  Calendar,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  MapPin,
  Globe,
} from 'lucide-react';

export const RecruiterDashboardPage: React.FC = () => {
  const [data, setData] = useState<RecruiterDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await companyService.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      console.error('Failed to load recruiter dashboard:', err);
      setError(err.message || 'Unable to load company dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <RecruiterLayout pageTitle="Corporate Dashboard" pageSubtitle="Loading enterprise overview...">
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#315746]">Fetching organization overview...</p>
        </div>
      </RecruiterLayout>
    );
  }

  if (error || !data) {
    return (
      <RecruiterLayout pageTitle="Corporate Dashboard" pageSubtitle="Error encountered">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-rose-200 text-center max-w-lg mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Dashboard Unavailable</h2>
          <p className="text-sm text-gray-600 mt-1 mb-5">{error || 'Could not load company details.'}</p>
          <button
            onClick={fetchDashboard}
            className="px-5 py-2.5 bg-[#2E9D74] text-white text-sm font-semibold rounded-xl hover:bg-[#258260] transition"
          >
            Retry Loading
          </button>
        </div>
      </RecruiterLayout>
    );
  }

  const { company, completion, stats, recentRecruiters } = data;
  const isVerified = company.verificationStatus === 'VERIFIED';

  return (
    <RecruiterLayout
      pageTitle="Corporate Dashboard"
      pageSubtitle={`Welcome back, ${data.currentRecruiter.fullName}. Here is your recruitment status.`}
      verificationStatus={company.verificationStatus}
      companyName={company.name}
    >
      <div className="space-y-8 pb-12">
        {/* TOP HERO: Company Identity Card & Profile Completion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Organization Overview Card */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#A7D6C0]/80 shadow-sm bg-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white text-2xl font-black shadow-md">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-black text-[#143026]">{company.name}</h2>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Partner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#2E9D74] mt-0.5">{company.industry}</p>
                  </div>
                </div>

                <Link
                  to="/recruiter/profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EAF6F0] hover:bg-[#A7D6C0]/40 text-[#2E9D74] text-xs font-bold rounded-xl transition border border-[#2E9D74]/20 self-start sm:self-auto"
                >
                  Edit Profile <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-xs md:text-sm text-[#315746] leading-relaxed line-clamp-3">
                {company.description || 'No corporate description provided yet. Complete your profile to attract top campus candidates.'}
              </p>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#4d7565]">
                <div className="flex items-center gap-1.5 bg-[#EAF6F0]/70 px-3 py-1.5 rounded-lg border border-[#A7D6C0]/40">
                  <MapPin className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>{company.headquarters || 'Headquarters not set'}</span>
                </div>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#EAF6F0]/70 px-3 py-1.5 rounded-lg border border-[#A7D6C0]/40 hover:text-[#2E9D74] transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#2E9D74]" />
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                )}
                <div className="flex items-center gap-1.5 bg-[#EAF6F0]/70 px-3 py-1.5 rounded-lg border border-[#A7D6C0]/40">
                  <Users className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>{company.companySize ? `${company.companySize} employees` : 'Size not specified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Profile Completion Gauge */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-7 border border-[#A7D6C0]/70 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E9D74]">
                  Profile Health
                </span>
                <span className="text-xl font-black text-[#143026]">{completion.score}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#EAF6F0] rounded-full h-3 overflow-hidden border border-[#A7D6C0]/40">
                <div
                  className="bg-gradient-to-r from-[#2E9D74] to-[#61B795] h-3 rounded-full transition-all duration-700"
                  style={{ width: `${completion.score}%` }}
                ></div>
              </div>

              {/* Sections Breakdown */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-[#EAF6F0]/60 p-2 rounded-xl border border-[#A7D6C0]/40">
                  <span className="text-[10px] text-[#4d7565] block font-medium">Identity</span>
                  <span className="text-xs font-bold text-[#143026]">
                    {completion.sections.identity.percentage}%
                  </span>
                </div>
                <div className="bg-[#EAF6F0]/60 p-2 rounded-xl border border-[#A7D6C0]/40">
                  <span className="text-[10px] text-[#4d7565] block font-medium">Presence</span>
                  <span className="text-xs font-bold text-[#143026]">
                    {completion.sections.presence.percentage}%
                  </span>
                </div>
                <div className="bg-[#EAF6F0]/60 p-2 rounded-xl border border-[#A7D6C0]/40">
                  <span className="text-[10px] text-[#4d7565] block font-medium">Contact</span>
                  <span className="text-xs font-bold text-[#143026]">
                    {completion.sections.contact.percentage}%
                  </span>
                </div>
              </div>

              {/* Missing Fields / Recommendations */}
              <div className="mt-4">
                {completion.missingFields.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-[#315746]">Recommended items to complete:</p>
                    <ul className="text-[11px] text-[#4d7565] space-y-1">
                      {completion.missingFields.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          <span>Add {item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Your company profile is 100% complete!</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              to="/recruiter/profile"
              className="mt-4 text-center block w-full py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition"
            >
              Complete Company Details
            </Link>
          </div>
        </div>

        {/* METRICS ROW (REAL DATABASE DATA) */}
        <div>
          <h3 className="text-sm font-bold text-[#143026] uppercase tracking-wider mb-4">
            Recruitment Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1. Recruiter Team */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-sm">
              <div className="flex items-center justify-between text-[#2E9D74] mb-2">
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF6F0] px-1.5 py-0.5 rounded">
                  Team
                </span>
              </div>
              <p className="text-2xl font-black text-[#143026]">{stats.recruitersCount}</p>
              <p className="text-[11px] font-semibold text-[#4d7565] mt-0.5">Recruiters</p>
            </div>

            {/* 2. Active Jobs */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-sm">
              <div className="flex items-center justify-between text-[#2E9D74] mb-2">
                <Briefcase className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF6F0] px-1.5 py-0.5 rounded">
                  Jobs
                </span>
              </div>
              <p className="text-2xl font-black text-[#143026]">{stats.activeJobsCount}</p>
              <p className="text-[11px] font-semibold text-[#4d7565] mt-0.5">Active Jobs</p>
            </div>

            {/* 3. Active Internships */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-sm">
              <div className="flex items-center justify-between text-[#2E9D74] mb-2">
                <GraduationCap className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF6F0] px-1.5 py-0.5 rounded">
                  Intern
                </span>
              </div>
              <p className="text-2xl font-black text-[#143026]">{stats.activeInternshipsCount}</p>
              <p className="text-[11px] font-semibold text-[#4d7565] mt-0.5">Active Internships</p>
            </div>

            {/* 4. Applications */}
            <Link
              to="/recruiter/applications"
              className="bg-white/90 hover:bg-white backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 hover:border-[#2E9D74] shadow-sm transition group"
            >
              <div className="flex items-center justify-between text-[#2E9D74] mb-2">
                <FileCheck2 className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF6F0] px-1.5 py-0.5 rounded">
                  Pipeline
                </span>
              </div>
              <p className="text-2xl font-black text-[#143026] group-hover:text-[#2E9D74] transition-colors">
                {stats.applicationsCount}
              </p>
              <p className="text-[11px] font-semibold text-[#4d7565] mt-0.5">Manage Applicants &rarr;</p>
            </Link>

            {/* 5. Interviews */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-sm">
              <div className="flex items-center justify-between text-[#2E9D74] mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF6F0] px-1.5 py-0.5 rounded">
                  Schedules
                </span>
              </div>
              <p className="text-2xl font-black text-[#143026]">{stats.interviewsCount}</p>
              <p className="text-[11px] font-semibold text-[#4d7565] mt-0.5">Interviews</p>
            </div>

            {/* 6. Offers */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-sm">
              <div className="flex items-center justify-between text-[#2E9D74] mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EAF6F0] px-1.5 py-0.5 rounded">
                  Offers
                </span>
              </div>
              <p className="text-2xl font-black text-[#143026]">{stats.offersCount}</p>
              <p className="text-[11px] font-semibold text-[#4d7565] mt-0.5">Offers Rolled</p>
            </div>
          </div>
        </div>

        {/* FUTURE MODULES EMPTY STATES & RECRUITER TEAM ROSTER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Job Drives & Future Modules Foundation (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Postings / Drives Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0]/70 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-[#143026] text-base">Campus Opportunities &amp; Drives</h4>
                  <p className="text-xs text-[#4d7565]">Manage open positions for campus hiring</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/recruiter/jobs"
                    className="text-xs font-bold px-3 py-1.5 bg-[#2E9D74] text-white rounded-xl hover:bg-[#23805e] transition-colors shadow-sm"
                  >
                    + Post Job
                  </Link>
                  <Link
                    to="/recruiter/internships"
                    className="text-xs font-bold px-3 py-1.5 bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20 rounded-xl hover:bg-[#A7D6C0]/40 transition-colors"
                  >
                    + Post Internship
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/recruiter/jobs"
                  className="p-4 bg-[#EAF6F0]/50 hover:bg-[#EAF6F0] rounded-2xl border border-[#A7D6C0]/50 hover:border-[#2E9D74]/50 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/10 text-[#2E9D74] flex items-center justify-center font-bold">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[#143026] group-hover:text-[#2E9D74] transition-colors">
                        Full-Time Jobs
                      </h5>
                      <p className="text-xs text-[#4d7565]">
                        {stats.activeJobsCount} active / published position{stats.activeJobsCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#2E9D74] group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/recruiter/internships"
                  className="p-4 bg-[#EAF6F0]/50 hover:bg-[#EAF6F0] rounded-2xl border border-[#A7D6C0]/50 hover:border-[#2E9D74]/50 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#61B795]/15 text-[#2E9D74] flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[#143026] group-hover:text-[#2E9D74] transition-colors">
                        Internship Drives
                      </h5>
                      <p className="text-xs text-[#4d7565]">
                        {stats.activeInternshipsCount} active / published opening{stats.activeInternshipsCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#2E9D74] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Upcoming Interviews & Applications Foundation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Interviews Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#2E9D74]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#143026]">
                    Upcoming Interviews
                  </h4>
                </div>
                <div className="py-6 text-center rounded-xl bg-[#EAF6F0]/40 border border-dashed border-[#A7D6C0]/60">
                  <p className="text-xs font-bold text-[#143026]">No upcoming interviews</p>
                  <p className="text-[11px] text-[#4d7565] mt-0.5">Interview scheduling unlocks in Step 8</p>
                </div>
              </div>

              {/* Offers Released Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#2E9D74]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#143026]">
                    Student Placements &amp; Offers
                  </h4>
                </div>
                <div className="py-6 text-center rounded-xl bg-[#EAF6F0]/40 border border-dashed border-[#A7D6C0]/60">
                  <p className="text-xs font-bold text-[#143026]">No offers yet</p>
                  <p className="text-[11px] text-[#4d7565] mt-0.5">Offer management unlocks in Step 9</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recruiter Team Roster Card (1 col) */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0]/70 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-[#143026] text-sm">Recruiter Team</h4>
                  <p className="text-xs text-[#4d7565]">Authorized company hiring managers</p>
                </div>
                <Link
                  to="/recruiter/team"
                  className="text-xs font-bold text-[#2E9D74] hover:underline"
                >
                  Manage
                </Link>
              </div>

              <div className="space-y-3">
                {recentRecruiters.map((recruiter) => (
                  <div
                    key={recruiter.id}
                    className="p-3 bg-[#EAF6F0]/60 rounded-xl border border-[#A7D6C0]/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {recruiter.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#143026] truncate">{recruiter.fullName}</p>
                        <p className="text-[11px] text-[#4d7565] truncate">{recruiter.designation}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        recruiter.accountStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {recruiter.accountStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#A7D6C0]/40">
              <Link
                to="/recruiter/team"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#EAF6F0] hover:bg-[#A7D6C0]/40 text-[#2E9D74] text-xs font-bold rounded-xl transition border border-[#2E9D74]/20"
              >
                <Users className="w-3.5 h-3.5" /> Invite / Add Recruiter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};
