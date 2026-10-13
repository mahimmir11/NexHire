import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../../components/student/StudentLayout';
import { opportunityService } from '../../services/opportunity.service';
import type {
  OpportunityListItem,
  OpportunityFilterParams,
  WorkMode,
} from '../../types/opportunity.types';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const OpportunitiesDiscoveryPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<OpportunityFilterParams>({
    type: 'ALL',
    search: '',
    workMode: undefined,
    location: '',
    sortBy: 'newest',
    sortOrder: 'desc',
    page: 1,
    limit: 9,
  });

  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await opportunityService.discoverOpportunities(filters);
      setOpportunities(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to discover opportunities:', err);
      setErrorMessage(err.message || 'Unable to load opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [filters.type, filters.workMode, filters.sortBy, filters.page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchOpportunities();
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCompensation = (item: OpportunityListItem) => {
    if (item.type === 'JOB') {
      const min = Number(item.salaryMin || 0);
      const max = Number(item.salaryMax || 0);
      if (max > 0) {
        const minLPA = (min / 100000).toFixed(1);
        const maxLPA = (max / 100000).toFixed(1);
        return `₹${minLPA} - ₹${maxLPA} LPA`;
      }
      return 'Best in Industry';
    } else {
      const stipend = Number(item.stipendAmount || 0);
      if (stipend > 0) {
        return `₹${stipend.toLocaleString()}${
          item.stipendPeriod === 'PER_MONTH'
            ? '/mo'
            : item.stipendPeriod === 'PER_WEEK'
            ? '/wk'
            : ' stipend'
        }`;
      }
      return 'Performance / Unpaid';
    }
  };

  return (
    <StudentLayout
      pageTitle="Campus Opportunities"
      pageSubtitle="Explore full-time career positions and internships authorized by the University Placement Cell"
    >
      <div className="space-y-6 pb-12">
        {/* TOP SEARCH & FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-[#A7D6C0]/70 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-3" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search job title, corporate partner, tech skills (e.g. Node.js, Python)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20 transition"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" /> Find Drives
            </button>
          </form>

          {/* Quick Filter Tabs & Sort Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2 border-t border-[#A7D6C0]/40">
            {/* Type selector */}
            <div className="flex items-center gap-1.5 p-1 bg-[#EAF6F0]/80 rounded-2xl border border-[#A7D6C0]/50">
              {(['ALL', 'JOB', 'INTERNSHIP'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters({ ...filters, type: t, page: 1 })}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    filters.type === t
                      ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-xs'
                      : 'text-[#315746] hover:bg-white/60'
                  }`}
                >
                  {t === 'ALL' ? 'All Drives' : t === 'JOB' ? 'Full-Time Jobs' : 'Internships'}
                </button>
              ))}
            </div>

            {/* Dropdown Filters (Work Mode + Sort) */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end text-xs">
              <select
                value={filters.workMode || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    workMode: (e.target.value as WorkMode) || undefined,
                    page: 1,
                  })
                }
                className="px-3 py-1.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] font-medium focus:outline-none focus:border-[#2E9D74]"
              >
                <option value="">Work Mode: Any</option>
                <option value="ON_SITE">On-Site</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>

              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sortBy: e.target.value as any,
                    page: 1,
                  })
                }
                className="px-3 py-1.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] font-medium focus:outline-none focus:border-[#2E9D74]"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="deadline">Sort: Deadline Approaching</option>
                <option value="salary">Sort: Highest Package / Stipend</option>
              </select>
            </div>
          </div>
        </div>

        {/* FEEDBACK ERROR */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* OPPORTUNITIES GRID */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-[#315746]">
              Loading verified campus opportunities...
            </p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="py-20 text-center bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-[#A7D6C0]/70">
            <Briefcase className="w-12 h-12 text-[#A7D6C0] mx-auto mb-3" />
            <h3 className="font-bold text-base text-[#143026]">No Opportunities Available</h3>
            <p className="text-xs text-[#4d7565] mt-1 max-w-sm mx-auto">
              No published campus drives match your selected filters. Try broadening your search or check back soon as new partners publish positions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => {
              const detailUrl =
                opp.type === 'JOB'
                  ? `/student/opportunities/job/${opp.id}`
                  : `/student/opportunities/internship/${opp.id}`;

              const deadlineDate = new Date(opp.applicationDeadline);
              const daysLeft = Math.ceil(
                (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={`${opp.type}-${opp.id}`}
                  className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0]/70 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header Row: Company Logo + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {opp.company?.logoUrl ? (
                          <img
                            src={opp.company.logoUrl}
                            alt={opp.company.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-[#A7D6C0]/80 shadow-xs bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-bold text-lg shadow-xs">
                            {opp.company?.name ? opp.company.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-[#4d7565] line-clamp-1">
                            {opp.company?.name}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                              opp.type === 'JOB'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {opp.type === 'JOB' ? 'Full-Time Job' : 'Internship'}
                          </span>
                        </div>
                      </div>

                      {/* Work Mode Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20">
                        {opp.workMode.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Title & Location */}
                    <div>
                      <Link to={detailUrl}>
                        <h4 className="font-bold text-base text-[#143026] group-hover:text-[#2E9D74] transition line-clamp-1">
                          {opp.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-[#4d7565] mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#2E9D74]" /> {opp.location}
                        </span>
                        <span>&bull;</span>
                        <span className="font-bold text-[#143026]">
                          {formatCompensation(opp)}
                        </span>
                      </div>
                    </div>

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {opp.requiredSkills
                        .split(',')
                        .slice(0, 3)
                        .map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-[#EAF6F0]/80 text-[#315746] px-2 py-0.5 rounded-md border border-[#A7D6C0]/40"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      {opp.requiredSkills.split(',').length > 3 && (
                        <span className="text-[10px] text-[#4d7565] px-1 py-0.5">
                          +{opp.requiredSkills.split(',').length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Real Student Eligibility Indicator */}
                    {opp.eligibility && (
                      <div className="pt-2 border-t border-[#A7D6C0]/30">
                        {opp.eligibility.isEligible ? (
                          <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>You Meet All Eligibility Criteria</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span className="truncate">
                              {opp.eligibility.reasons[0] || 'Criteria not met'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Deadline & Action */}
                  <div className="pt-4 mt-4 border-t border-[#A7D6C0]/40 flex items-center justify-between">
                    <div className="text-[11px] text-[#4d7565]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#2E9D74]" />
                        {daysLeft > 0 ? (
                          <span className={daysLeft <= 3 ? 'text-rose-600 font-bold' : ''}>
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">Deadline expired</span>
                        )}
                      </span>
                    </div>

                    <Link
                      to={detailUrl}
                      className="px-4 py-2 bg-[#EAF6F0] hover:bg-[#A7D6C0]/40 text-[#2E9D74] text-xs font-bold rounded-xl transition border border-[#2E9D74]/20 inline-flex items-center gap-1"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/60">
            <span className="text-xs text-[#4d7565]">
              Showing Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total opportunities)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPrevPage}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#143026] hover:bg-[#EAF6F0] disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#143026] hover:bg-[#EAF6F0] disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};
