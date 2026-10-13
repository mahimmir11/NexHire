import React, { useEffect, useState } from 'react';
import { offerService } from '../../services/offer.service';
import type { Offer, OfferStatus, OfferPagination } from '../../types/offer.types';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Award,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<OfferStatus, { label: string; bg: string; text: string; border: string }> = {
  OFFERED: { label: 'Pending Response', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-emerald-50', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]/30' },
  REJECTED: { label: 'Declined', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  EXPIRED: { label: 'Expired', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
  REVOKED: { label: 'Revoked', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
};

export const AdminOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);

  const [pagination, setPagination] = useState<OfferPagination>({
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

  // Details Modal
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await offerService.getAdminOffers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter ? (statusFilter as OfferStatus) : undefined,
      });
      setOffers(res.offers);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load admin offers:', err);
      setErrorMessage(err.message || 'Unable to retrieve institutional offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [pagination.page, debouncedSearch, statusFilter]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCompensation = (offer: Offer) => {
    if (offer.salary) {
      const num = Number(offer.salary);
      return `${(num / 100000).toFixed(2)} LPA (${num.toLocaleString()} ${offer.currency})`;
    }
    if (offer.stipend) {
      const num = Number(offer.stipend);
      return `₹${num.toLocaleString()} ${offer.currency} / mo`;
    }
    return 'N/A';
  };

  return (
    <AdminLayout
      pageTitle="Campus Job Offers & Outcomes"
      pageSubtitle="Track job & internship offers, package terms, and student acceptances"
    >
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white shadow-md shadow-[#2E9D74]/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#143026]">Campus Offers &amp; Outcomes</h1>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Monitor formal offer packages issued by recruitment partners across academic departments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20">
              Total Offers Extended: {pagination.total}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b8071]" />
            <input
              type="text"
              placeholder="Search candidate, company, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/80 focus:outline-none focus:ring-2 focus:ring-[#2E9D74] text-[#143026] placeholder-[#5b8071]/70"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
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
                <option value="OFFERED">Pending Response</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Offers Table */}
        <div className="bg-white/90 rounded-2xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2E9D74] border-t-transparent mb-3"></div>
              <p className="text-sm font-semibold text-[#2E9D74]">Loading institutional offers...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-8 text-center text-rose-700 flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-sm font-semibold">{errorMessage}</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74] mx-auto mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-[#143026]">No Offers Found</h3>
              <p className="text-xs text-[#4d7565] max-w-md mx-auto mt-1 leading-relaxed">
                No recruitment offers matched the current query criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF6F0]/80 text-[#143026] font-bold border-b border-[#A7D6C0]/70 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Compensation</th>
                    <th className="py-3 px-4">Issued On</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/40">
                  {offers.map((offer) => {
                    const statusCfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.OFFERED;

                    return (
                      <tr key={offer.id} className="hover:bg-[#EAF6F0]/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#143026]">{offer.student?.fullName}</div>
                          <div className="text-[11px] text-[#4d7565]">
                            {offer.student?.studentId} • {offer.student?.course}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#143026]">{offer.company?.name}</td>
                        <td className="py-3 px-4 font-semibold text-[#143026]">{offer.designation}</td>
                        <td className="py-3 px-4 font-bold text-[#2E9D74]">{formatCompensation(offer)}</td>
                        <td className="py-3 px-4 text-[#4d7565] whitespace-nowrap">{formatDate(offer.offerDate)}</td>
                        <td className="py-3 px-4 font-semibold text-[#143026] whitespace-nowrap">
                          {formatDate(offer.joiningDate)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedOffer(offer)}
                            className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] hover:bg-[#EAF6F0] transition"
                            title="Inspect Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
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
                Showing page {pagination.page} of {pagination.totalPages}
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

      {/* Inspect Offer Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Offer Contract Terms</h3>
                <p className="text-xs text-[#4d7565]">
                  {selectedOffer.student?.fullName} ({selectedOffer.student?.studentId})
                </p>
              </div>
              <button onClick={() => setSelectedOffer(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="bg-[#EAF6F0] p-4 rounded-xl border border-[#A7D6C0]/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Company:</span>
                <span className="font-bold text-[#143026]">{selectedOffer.company?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Designation:</span>
                <span className="font-bold text-[#143026]">{selectedOffer.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Compensation:</span>
                <span className="font-black text-[#2E9D74]">{formatCompensation(selectedOffer)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Work Location:</span>
                <span className="font-bold text-[#143026]">{selectedOffer.location || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Target Joining:</span>
                <span className="font-bold text-[#143026]">{formatDate(selectedOffer.joiningDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4d7565]">Status:</span>
                <span className="font-bold text-[#2E9D74]">{selectedOffer.status}</span>
              </div>
              {selectedOffer.responseNotes && (
                <div className="pt-2 border-t border-[#A7D6C0]/60">
                  <span className="text-[#4d7565] block font-semibold mb-0.5">Candidate Response:</span>
                  <p className="italic text-[#143026]">"{selectedOffer.responseNotes}"</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedOffer(null)}
                className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#25825f] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};
