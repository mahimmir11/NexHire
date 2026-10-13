import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../../components/student/StudentLayout';
import { ProfileCompletionCard } from '../../components/student/ProfileCompletionCard';
import { studentService } from '../../services/student.service';
import type { DashboardSummary } from '../../types/student.types';
import {
  Briefcase,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  ChevronRight,
  Bell,
  AlertCircle,
  GraduationCap,
  Inbox,
  Video,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentService.getDashboard();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <StudentLayout pageTitle="Student Dashboard" pageSubtitle="Real-time placement status & activity">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <div className="h-10 w-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#2a4d3e]">Loading student dashboard...</p>
        </div>
      </StudentLayout>
    );
  }

  if (error || !data) {
    return (
      <StudentLayout pageTitle="Student Dashboard" pageSubtitle="Real-time placement status & activity">
        <div className="bg-white/90 rounded-2xl border border-red-200 p-8 text-center max-w-xl mx-auto space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-[#143026]">Unable to Load Dashboard</h2>
          <p className="text-xs text-[#5b8071]">{error || 'Unknown error occurred while fetching your data.'}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </StudentLayout>
    );
  }

  const { profile, stats, completion, applications, upcomingInterviews, offers, placement, notifications, deadlines } = data;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SELECTED':
      case 'HIRED_PLACED':
      case 'OFFER_ACCEPTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'SHORTLISTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <StudentLayout
      pageTitle={`Welcome back, ${profile.fullName}`}
      pageSubtitle={`${profile.department} &bull; Roll No: ${profile.studentId} &bull; Batch of ${profile.graduationYear}`}
    >
      <div className="space-y-6">
        {/* Top Profile Readiness Widget */}
        <ProfileCompletionCard completion={completion} />

        {/* Quick Placement Journey Status Banner */}
        <div className="bg-gradient-to-r from-white/95 to-[#EAF6F0]/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#2E9D74]/15 border border-[#2E9D74]/30 flex items-center justify-center text-[#2E9D74]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#143026]">Placement Eligibility Status:</h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    profile.isPlacementEligible
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {profile.isPlacementEligible ? 'Eligible for Campus Drives' : 'Verification Required'}
                </span>
              </div>
              <p className="text-xs text-[#4b7161] mt-0.5">
                Current CGPA: <strong className="text-[#143026]">{profile.cgpa ? profile.cgpa.toFixed(2) : 'N/A'}</strong> &bull; Semester: {profile.semester} &bull; Academic Status: {profile.academicStatus}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/student/profile"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0] text-xs font-semibold shadow-xs transition"
            >
              View Full Profile
            </Link>
          </div>
        </div>

        {/* 4 Metric Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-4 shadow-xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#5b8071] font-medium">Eligible Drives</p>
              <p className="text-lg font-black text-[#143026]">{stats.eligibleOpportunitiesCount}</p>
            </div>
          </div>

          <Link
            to="/student/applications"
            className="bg-white/90 hover:bg-white rounded-2xl border border-[#A7D6C0] hover:border-[#2E9D74] p-4 shadow-xs flex items-center gap-3 transition"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#5b8071] font-medium">Applications</p>
              <p className="text-lg font-black text-[#143026]">{stats.appliedCount}</p>
            </div>
          </Link>

          <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-4 shadow-xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#5b8071] font-medium">Interviews</p>
              <p className="text-lg font-black text-[#143026]">{stats.interviewsCount}</p>
            </div>
          </div>

          <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-4 shadow-xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#5b8071] font-medium">Job Offers</p>
              <p className="text-lg font-black text-[#143026]">{stats.offersCount}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Main Placement Activities & Sidebar widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applied Opportunities Card */}
            <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50 mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#2E9D74]" />
                  <h3 className="text-sm font-bold text-[#143026]">Your Applications</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#5b8071] font-mono">{applications.length} active</span>
                  <Link
                    to="/student/applications"
                    className="text-xs font-bold text-[#2E9D74] hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>
              </div>

              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl bg-[#EAF6F0]/50 border border-[#A7D6C0]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#EAF6F0] transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white border border-[#A7D6C0] flex items-center justify-center overflow-hidden shrink-0 text-[#2E9D74] font-bold">
                          {app.companyLogo ? (
                            <img src={app.companyLogo} alt={app.companyName} className="h-full w-full object-cover" />
                          ) : (
                            app.companyName.charAt(0)
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#143026]">{app.title}</h4>
                          <p className="text-[11px] text-[#4d7565] flex items-center gap-1.5 mt-0.5">
                            <span>{app.companyName}</span>
                            <span>&bull;</span>
                            <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                          </p>
                          {app.statusRemarks && (
                            <p className="text-[10px] text-[#2E9D74] bg-[#2E9D74]/10 rounded px-2 py-0.5 mt-1.5 inline-block">
                              {app.statusRemarks}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(
                            app.status
                          )}`}
                        >
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#EAF6F0]/40 rounded-xl border border-dashed border-[#A7D6C0] space-y-2">
                  <Inbox className="w-8 h-8 text-[#5b8071] mx-auto opacity-70" />
                  <p className="text-xs font-bold text-[#143026]">No applications yet</p>
                  <p className="text-[11px] text-[#5b8071] max-w-sm mx-auto">
                    When campus placement drives open and you apply for roles, your real-time application tracking and stage progression will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Interviews Card */}
            <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2E9D74]" />
                  <h3 className="text-sm font-bold text-[#143026]">Upcoming Interviews</h3>
                </div>
                <span className="text-xs text-[#5b8071] font-mono">{upcomingInterviews.length} scheduled</span>
              </div>

              {upcomingInterviews.length > 0 ? (
                <div className="space-y-3">
                  {upcomingInterviews.map((iv) => (
                    <div
                      key={iv.id}
                      className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-900">{iv.roundName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                            {iv.mode}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#143026] mt-1">
                          {iv.companyName} &bull; <span className="text-[#4d7565]">{iv.opportunityTitle}</span>
                        </p>
                        <p className="text-[11px] text-[#5b8071] mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>
                            {new Date(iv.interviewDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at {new Date(iv.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {iv.interviewerName && (
                            <>
                              <span>&bull;</span>
                              <span>Panel: {iv.interviewerName}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {iv.meetingLink && (
                        <a
                          href={iv.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition shrink-0 self-start sm:self-center"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#EAF6F0]/40 rounded-xl border border-dashed border-[#A7D6C0] space-y-2">
                  <Calendar className="w-8 h-8 text-[#5b8071] mx-auto opacity-70" />
                  <p className="text-xs font-bold text-[#143026]">No upcoming interviews</p>
                  <p className="text-[11px] text-[#5b8071] max-w-sm mx-auto">
                    When interview rounds are scheduled by recruiters or the placement cell, your call schedule and online meeting links will display here.
                  </p>
                </div>
              )}
            </div>

            {/* Placement Offers & Outcomes */}
            <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50 mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2E9D74]" />
                  <h3 className="text-sm font-bold text-[#143026]">Offers &amp; Placement Status</h3>
                </div>
              </div>

              {placement ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Placed Candidate &bull; {placement.placementType}
                    </span>
                    <h4 className="text-sm font-bold text-emerald-950 mt-1">{placement.designation}</h4>
                    <p className="text-xs text-emerald-800">{placement.companyName}</p>
                    <p className="text-xs font-mono font-bold text-emerald-900 mt-1">
                      Package: {placement.currency} {placement.packageAmount.toLocaleString()}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              ) : offers.length > 0 ? (
                <div className="space-y-3">
                  {offers.map((off) => (
                    <div key={off.id} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-[#143026]">{off.designation}</h4>
                        <p className="text-[11px] text-[#4d7565]">{off.companyName}</p>
                        <p className="text-xs font-bold text-[#2E9D74] mt-0.5">
                          {off.salary ? `CTC: ${off.currency} ${off.salary.toLocaleString()}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {off.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#EAF6F0]/40 rounded-xl border border-dashed border-[#A7D6C0] space-y-2">
                  <Award className="w-8 h-8 text-[#5b8071] mx-auto opacity-70" />
                  <p className="text-xs font-bold text-[#143026]">No offers yet</p>
                  <p className="text-[11px] text-[#5b8071] max-w-sm mx-auto">
                    Formal job offers, letters of intent, and final campus placement confirmations will appear in this section once issued by hiring organizations.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Deadlines, Quick Navigation & Notifications */}
          <div className="space-y-6">
            {/* Important Deadlines Widget */}
            <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#A7D6C0]/50 mb-3">
                <Clock className="w-4 h-4 text-[#2E9D74]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#143026]">Upcoming Deadlines</h3>
              </div>

              {deadlines.length > 0 ? (
                <div className="space-y-2.5">
                  {deadlines.map((dl) => (
                    <div key={dl.id} className="p-2.5 rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/60 text-xs">
                      <div className="flex items-center justify-between font-bold text-[#143026]">
                        <span className="truncate">{dl.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2E9D74]/15 text-[#2E9D74]">
                          {dl.type === 'INTERVIEW' ? 'Interview' : 'Deadline'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5b8071] mt-0.5">
                        {new Date(dl.deadline).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5b8071] italic py-2">No pressing deadlines right now.</p>
              )}
            </div>

            {/* Notifications Feed */}
            <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#2E9D74]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#143026]">Recent Alerts</h3>
                </div>
                <span className="text-[10px] font-mono text-[#5b8071]">{notifications.length} alerts</span>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs border ${
                        n.isRead ? 'bg-[#EAF6F0]/40 border-[#A7D6C0]/50' : 'bg-emerald-50/80 border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#143026] text-[11px]">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2E9D74]"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#4d7565] mt-1 leading-snug">{n.message}</p>
                      <span className="text-[9px] text-[#5b8071] font-mono block mt-1">
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5b8071] italic py-2">No unread notifications.</p>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-white/90 rounded-2xl border border-[#A7D6C0] p-5 shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#143026] mb-3">Quick Navigation</h3>

              <Link
                to="/student/documents"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAF6F0]/60 hover:bg-[#EAF6F0] border border-[#A7D6C0]/70 text-xs font-semibold text-[#143026] transition"
              >
                <span>Upload Updated Resume</span>
                <ChevronRight className="w-4 h-4 text-[#2E9D74]" />
              </Link>

              <Link
                to="/student/skills"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAF6F0]/60 hover:bg-[#EAF6F0] border border-[#A7D6C0]/70 text-xs font-semibold text-[#143026] transition"
              >
                <span>Manage Technical Skills</span>
                <ChevronRight className="w-4 h-4 text-[#2E9D74]" />
              </Link>

              <Link
                to="/student/certifications"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAF6F0]/60 hover:bg-[#EAF6F0] border border-[#A7D6C0]/70 text-xs font-semibold text-[#143026] transition"
              >
                <span>Add Certification Credentials</span>
                <ChevronRight className="w-4 h-4 text-[#2E9D74]" />
              </Link>

              <Link
                to="/student/career"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAF6F0]/60 hover:bg-[#EAF6F0] border border-[#A7D6C0]/70 text-xs font-semibold text-[#143026] transition"
              >
                <span>Update Job Preferences</span>
                <ChevronRight className="w-4 h-4 text-[#2E9D74]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};
