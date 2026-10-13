import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../../components/student/StudentLayout';
import { applicationService } from '../../services/application.service';
import type { Application, ApplicationPagination, ApplicationStatus } from '../../types/application.types';
import {
  FileText,
  Search,
  Filter,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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

export const StudentApplicationsPage: React.FC = () => {
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
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'JOB' | 'INTERNSHIP'>('ALL');

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
      const res = await applicationService.getMyApplications({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        opportunityType: typeFilter === 'ALL' ? undefined : typeFilter,
      });
      setApplications(res.applications);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load student applications:', err);
      setErrorMessage(err.message || 'Unable to retrieve applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [pagination.page, debouncedSearch, statusFilter, typeFilter]);

  // Derived metrics from current pagination / total
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW').length;
  const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED').length;

  return (
    <StudentLayout
      pageTitle="My Applications"
      pageSubtitle="Track real-time candidate review progress, status changes, and interview updates"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Total Applications
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#143026]">{pagination.total}</span>
              <span className="text-xs text-[#2E9D74] font-semibold">Active Profile</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Under Review
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{underReviewCount}</span>
              <span className="text-xs text-[#4d7565]">In Evaluation</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Shortlisted
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{shortlistedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">Proceeding</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Campus Drives
            </span>
            <Link
              to="/student/opportunities"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2E9D74] hover:underline mt-2"
            >
              Explore Open Drives <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by position title or company..."
              className="w-full pl-9 pr-4 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs text-[#143026] placeholder-[#4d7565]/70 focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
            />
          </div>

          {/* Type Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#EAF6F0]/60 p-1 rounded-xl border border-[#A7D6C0]/50 self-start md:self-auto">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'ALL'
                  ? 'bg-white text-[#2E9D74] shadow-2xs'
                  : 'text-[#4d7565] hover:text-[#143026]'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('JOB')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'JOB'
                  ? 'bg-white text-[#2E9D74] shadow-2xs'
                  : 'text-[#4d7565] hover:text-[#143026]'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setTypeFilter('INTERNSHIP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'INTERNSHIP'
                  ? 'bg-white text-[#2E9D74] shadow-2xs'
                  : 'text-[#4d7565] hover:text-[#143026]'
              }`}
            >
              Internships
            </button>
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
              <option value="REJECTED">Not Selected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* APPLICATIONS CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[35vh] space-y-3">
            <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-[#4d7565]">Loading your applications...</p>
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
              {debouncedSearch || statusFilter || typeFilter !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'You have not submitted any applications yet. Explore available campus drives and apply!'}
            </p>
            <div className="pt-2">
              <Link
                to="/student/opportunities"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition shadow-xs"
              >
                Browse Campus Drives
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const opp = app.job || app.internship;
              const statusCfg = STATUS_CONFIG[app.status] || {
                label: app.status,
                bg: 'bg-gray-100',
                text: 'text-gray-800',
                border: 'border-gray-200',
              };

              return (
                <div
                  key={app.id}
                  className="bg-white/90 backdrop-blur-md hover:bg-white rounded-2xl p-5 border border-[#A7D6C0]/70 hover:border-[#2E9D74] shadow-2xs hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Company & Opportunity */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#EAF6F0] border border-[#A7D6C0] flex items-center justify-center text-sm font-black text-[#2E9D74] flex-shrink-0 overflow-hidden shadow-2xs">
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
                          <h4 className="font-bold text-sm text-[#143026] group-hover:text-[#2E9D74] transition-colors">
                            {opp?.title || 'Opportunity'}
                          </h4>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              app.opportunityType === 'JOB'
                                ? 'bg-[#2E9D74]/10 text-[#2E9D74] border-[#2E9D74]/20'
                                : 'bg-[#61B795]/15 text-[#247c59] border-[#61B795]/30'
                            }`}
                          >
                            {app.opportunityType}
                          </span>
                        </div>
                        <p className="text-xs text-[#4d7565]">
                          {opp?.company?.name} • {opp?.location}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#4d7565] pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Applied on{' '}
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                          {app.statusRemarks && (
                            <span className="truncate max-w-xs text-gray-500">
                              • {app.statusRemarks}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Pill & View Link */}
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#A7D6C0]/40">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>

                      <Link
                        to={`/student/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#EAF6F0] hover:bg-[#2E9D74] text-[#2E9D74] hover:text-white rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 border border-[#A7D6C0]/70">
            <p className="text-xs text-[#4d7565]">
              Showing page <span className="font-bold text-[#143026]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#143026]">{pagination.totalPages}</span> ({pagination.total}{' '}
              applications)
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
    </StudentLayout>
  );
};
