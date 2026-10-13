import React, { useEffect, useState } from 'react';
import { opportunityService } from '../../services/opportunity.service';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  X,
} from 'lucide-react';

export const OpportunityManagementPage: React.FC = () => {


  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING_APPROVAL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Review Modal State
  const [reviewItem, setReviewItem] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await opportunityService.getAdminOpportunities({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        type: selectedType === 'ALL' ? undefined : selectedType,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      setOpportunities(res.items);
    } catch (err: any) {
      console.error('Failed to load opportunities for admin:', err);
      setErrorMessage(err.message || 'Unable to retrieve opportunities queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedStatus, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities();
  };

  const handleReviewAction = async (action: 'APPROVE' | 'REJECT' | 'CLOSE') => {
    if (!reviewItem) return;

    try {
      setProcessing(true);
      setErrorMessage(null);
      await opportunityService.reviewOpportunity(
        reviewItem.type,
        reviewItem.id,
        action,
        reviewNotes
      );

      setSuccessMessage(
        `Opportunity "${reviewItem.title}" has been ${
          action === 'APPROVE' ? 'approved & published' : action === 'REJECT' ? 'sent back to draft' : 'closed'
        }.`
      );
      setReviewItem(null);
      setReviewNotes('');
      fetchOpportunities();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Review action failed:', err);
      setErrorMessage(err.message || 'Failed to update opportunity status.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout
      pageTitle="Campus Recruitment Opportunities"
      pageSubtitle="Manage, audit, and oversee all active job & internship recruitment drives"
    >
      <div className="space-y-6">
        {/* Feedback Banners */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Filter Bar & Controls */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0]/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EAF6F0]/80 rounded-2xl border border-[#A7D6C0]/50 w-full md:w-auto">
            {['PENDING_APPROVAL', 'PUBLISHED', 'DRAFT', 'CLOSED', 'ALL'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedStatus === st
                    ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-xs'
                    : 'text-[#315746] hover:bg-white/60'
                }`}
              >
                {st === 'PENDING_APPROVAL' ? 'Pending Approval' : st === 'ALL' ? 'All Drives' : st}
              </button>
            ))}
          </div>

          {/* Type Filter & Search Form */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs bg-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="JOB">Jobs Only</option>
              <option value="INTERNSHIP">Internships Only</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-56">
              <Search className="w-4 h-4 text-[#4d7565] absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, company..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
              />
            </form>
          </div>
        </div>

        {/* Opportunities List Table */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#A7D6C0]/40 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#143026]">
              {selectedStatus === 'PENDING_APPROVAL'
                ? 'Opportunities Awaiting Institutional Approval'
                : 'Campus Recruitment Drives'}
            </h3>
            <span className="text-xs font-bold text-[#4d7565]">
              {opportunities.length} position(s) listed
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-[#4d7565]">Retrieving opportunity queue...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="py-20 text-center p-6">
              <Briefcase className="w-12 h-12 text-[#A7D6C0] mx-auto mb-3" />
              <h4 className="font-bold text-sm text-[#143026]">No opportunities in this queue</h4>
              <p className="text-xs text-[#4d7565] mt-1 max-w-sm mx-auto">
                No drives currently match the "{selectedStatus}" status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAF6F0]/60 text-[11px] font-bold uppercase tracking-wider text-[#315746] border-b border-[#A7D6C0]/40">
                    <th className="py-3 px-6">Opportunity</th>
                    <th className="py-3 px-6">Company</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Compensation / Stipend</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/30">
                  {opportunities.map((opp) => (
                    <tr key={`${opp.type}-${opp.id}`} className="hover:bg-[#EAF6F0]/40 transition">
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-bold text-sm text-[#143026] block">{opp.title}</span>
                          <span className="text-[11px] text-[#4d7565]">
                            {opp.location} &bull; {opp.workMode}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-[#143026]">{opp.company?.name}</span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            opp.type === 'JOB'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {opp.type === 'JOB' ? 'Full-Time' : 'Internship'}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-semibold text-[#143026]">
                        {opp.type === 'JOB'
                          ? `₹${(Number(opp.salaryMin) / 100000).toFixed(1)}L - ₹${(
                              Number(opp.salaryMax) / 100000
                            ).toFixed(1)}L`
                          : `₹${Number(opp.stipendAmount).toLocaleString()} / ${
                              opp.stipendPeriod === 'PER_MONTH' ? 'mo' : 'stipend'
                            }`}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            opp.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : opp.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : opp.status === 'CLOSED'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {opp.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setReviewItem(opp)}
                          className="px-3.5 py-1.5 bg-[#EAF6F0] hover:bg-[#A7D6C0]/40 text-[#2E9D74] text-xs font-bold rounded-xl transition border border-[#2E9D74]/20 inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Drive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* REVIEW MODAL */}
        {reviewItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-[#A7D6C0]/80 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div>
                  <h3 className="font-bold text-base text-[#143026]">{reviewItem.title}</h3>
                  <p className="text-xs text-[#4d7565]">
                    {reviewItem.company?.name} &bull; {reviewItem.type} Opportunity Review
                  </p>
                </div>
                <button
                  onClick={() => setReviewItem(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Status + Compensation Summary */}
                <div className="p-3 bg-[#EAF6F0]/70 rounded-2xl border border-[#A7D6C0]/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#4d7565] block">
                      Current Status
                    </span>
                    <span className="font-bold text-[#143026]">{reviewItem.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-[#4d7565] block">
                      Deadline
                    </span>
                    <span className="font-bold text-[#143026]">
                      {new Date(reviewItem.applicationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Description</span>
                  <p className="p-3 bg-gray-50 rounded-xl text-gray-700 mt-1 whitespace-pre-line leading-relaxed">
                    {reviewItem.description}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Responsibilities</span>
                  <p className="p-3 bg-gray-50 rounded-xl text-gray-700 mt-1 whitespace-pre-line leading-relaxed">
                    {reviewItem.responsibilities}
                  </p>
                </div>

                {/* Eligibility Criteria Snapshot */}
                {reviewItem.eligibilityCriteria && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Candidate Eligibility Standards Set by Company
                    </span>
                    <p className="font-semibold text-gray-800">
                      Minimum CGPA: {reviewItem.eligibilityCriteria.minCgpa ? Number(reviewItem.eligibilityCriteria.minCgpa).toFixed(1) : 'None'} &bull; Max Backlogs Allowed: {reviewItem.eligibilityCriteria.maxBacklogs}
                    </p>
                  </div>
                )}

                {/* Review Notes */}
                <div>
                  <label className="block text-xs font-bold text-[#143026] mb-1">
                    Administrative Review Notes (Audit Log)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Verified eligibility matches university placement policy..."
                    className="w-full px-3 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none"
                  ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#A7D6C0]/40">
                  <button
                    type="button"
                    onClick={() => setReviewItem(null)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleReviewAction('REJECT')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Reject to Draft
                    </button>

                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => handleReviewAction('APPROVE')}
                      className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve &amp; Publish Drive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
