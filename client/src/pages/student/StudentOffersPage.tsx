import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../../components/student/StudentLayout';
import { offerService } from '../../services/offer.service';
import type { Offer, OfferStatus, OfferPagination } from '../../types/offer.types';
import {
  Award,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STATUS_BADGES: Record<OfferStatus, { label: string; bg: string; text: string; border: string }> = {
  OFFERED: { label: 'Pending Response', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  ACCEPTED: { label: 'Offer Accepted', bg: 'bg-emerald-50', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]/30' },
  REJECTED: { label: 'Offer Declined', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  EXPIRED: { label: 'Expired', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
  REVOKED: { label: 'Revoked', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
};

export const StudentOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [pagination, setPagination] = useState<OfferPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Response Modals
  const [activeModal, setActiveModal] = useState<{
    offer: Offer;
    type: 'ACCEPT' | 'REJECT';
  } | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await offerService.getStudentOffers({
        page: pagination.page,
        limit: pagination.limit,
      });
      setOffers(res.offers);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load student offers:', err);
      setErrorMessage(err.message || 'Unable to retrieve placement offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [pagination.page]);

  const handleConfirmResponse = async () => {
    if (!activeModal) return;

    try {
      setActionLoading(true);
      if (activeModal.type === 'ACCEPT') {
        await offerService.acceptOffer(activeModal.offer.id, responseNotes);
        setActionSuccessMessage(
          `Congratulations! You have accepted the offer from ${activeModal.offer.company?.name || 'the company'}.`
        );
      } else {
        await offerService.rejectOffer(activeModal.offer.id, responseNotes);
        setActionSuccessMessage(`You have officially declined the offer from ${activeModal.offer.company?.name || 'the company'}.`);
      }

      setActiveModal(null);
      setResponseNotes('');
      fetchOffers();
    } catch (err: any) {
      console.error('Failed to submit offer response:', err);
      alert(err.message || 'Failed to submit response.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not Specified';
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
      return `₹${num.toLocaleString()} ${offer.currency} / month`;
    }
    return 'Competitive Compensation';
  };

  return (
    <StudentLayout
      pageTitle="Employment &amp; Internship Offers"
      pageSubtitle="Review your campus placement offers, CTC packages, joining details, and formal agreements"
    >
      <div className="space-y-6">
        {/* Banner notification */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between text-emerald-800 text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#2E9D74]" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white shadow-md shadow-[#2E9D74]/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#143026]">Placement &amp; Internship Offers</h1>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Official career opportunities extended by visiting corporate recruitment partners
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20">
              Total Offers: {pagination.total}
            </span>
          </div>
        </div>

        {/* Offers List */}
        {loading ? (
          <div className="bg-white/80 rounded-2xl border border-[#A7D6C0]/70 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#2E9D74] border-t-transparent mb-3"></div>
            <p className="text-sm font-semibold text-[#2E9D74]">Loading your offers...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-white/80 rounded-2xl border border-rose-200 p-8 text-center text-rose-700 shadow-sm flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="text-sm font-semibold">{errorMessage}</p>
            <button
              onClick={fetchOffers}
              className="mt-2 text-xs px-4 py-2 bg-[#2E9D74] text-white rounded-xl font-bold hover:bg-[#25825f] transition"
            >
              Retry
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white/90 rounded-2xl border border-[#A7D6C0]/70 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74] mx-auto mb-4">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-[#143026]">No Offers Received Yet</h3>
            <p className="text-xs text-[#4d7565] max-w-md mx-auto mt-1 leading-relaxed">
              When an employer selects you following the technical interviews and campus drives, your formal offer package will appear here for review and response.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {offers.map((offer) => {
              const statusCfg = STATUS_BADGES[offer.status] || STATUS_BADGES.OFFERED;
              const isActionable = offer.status === 'OFFERED';

              return (
                <div
                  key={offer.id}
                  className={`bg-white/95 rounded-2xl border p-6 shadow-sm transition duration-200 hover:shadow-md ${
                    isActionable ? 'border-[#2E9D74] ring-1 ring-[#2E9D74]/20' : 'border-[#A7D6C0]/70'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left: Company & Details */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#EAF6F0] border border-[#A7D6C0] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                          {offer.company?.logoUrl ? (
                            <img
                              src={offer.company.logoUrl}
                              alt={offer.company.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-7 h-7 text-[#2E9D74]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-[#143026] leading-tight">{offer.designation}</h3>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#2E9D74] mt-0.5">{offer.company?.name}</p>
                          <p className="text-xs text-[#4d7565] flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {offer.location || offer.company?.headquarters || 'Location specified in contract'}
                          </p>
                        </div>
                      </div>

                      {/* Compensation Highlight Card */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#EAF6F0]/60 p-4 rounded-xl border border-[#A7D6C0]/50">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565]">
                            Package / CTC
                          </span>
                          <p className="text-sm font-black text-[#143026] mt-0.5">{formatCompensation(offer)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565]">
                            Target Joining Date
                          </span>
                          <p className="text-xs font-bold text-[#143026] mt-0.5">{formatDate(offer.joiningDate)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565]">
                            Offer Issued On
                          </span>
                          <p className="text-xs font-bold text-[#143026] mt-0.5">{formatDate(offer.offerDate)}</p>
                        </div>
                      </div>

                      {/* Acceptance Deadline & Document */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#4d7565]">
                        {offer.acceptanceDeadline && (
                          <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span>Respond by: {formatDate(offer.acceptanceDeadline)}</span>
                          </div>
                        )}

                        {offer.offerDocument && (
                          <a
                            href={offer.offerDocument.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[#2E9D74] font-bold bg-[#EAF6F0] px-3 py-1 rounded-lg border border-[#2E9D74]/30 hover:bg-[#A7D6C0]/40 transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            View Official Offer Letter
                          </a>
                        )}

                        {offer.respondedAt && (
                          <div className="text-[11px] text-gray-500 italic">
                            Responded on {formatDate(offer.respondedAt)}
                            {offer.responseNotes ? `: "${offer.responseNotes}"` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row lg:flex-col items-center justify-end gap-3 lg:border-l lg:border-[#A7D6C0]/50 lg:pl-6 min-w-[200px]">
                      {isActionable ? (
                        <>
                          <button
                            onClick={() => {
                              setResponseNotes('');
                              setActiveModal({ offer, type: 'ACCEPT' });
                            }}
                            className="w-full text-xs font-bold px-4 py-2.5 bg-gradient-to-r from-[#2E9D74] to-[#34a87e] text-white rounded-xl shadow-sm hover:shadow hover:from-[#25825f] hover:to-[#2b8c68] flex items-center justify-center gap-1.5 transition"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Accept Offer
                          </button>
                          <button
                            onClick={() => {
                              setResponseNotes('');
                              setActiveModal({ offer, type: 'REJECT' });
                            }}
                            className="w-full text-xs font-bold px-4 py-2.5 bg-white text-rose-700 border border-rose-300 rounded-xl hover:bg-rose-50 flex items-center justify-center gap-1.5 transition"
                          >
                            <XCircle className="h-4 w-4" />
                            Decline Offer
                          </button>
                        </>
                      ) : offer.status === 'ACCEPTED' ? (
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                          <CheckCircle2 className="h-6 w-6 text-[#2E9D74] mx-auto mb-1" />
                          <p className="text-xs font-bold text-emerald-900">Offer Accepted</p>
                          <p className="text-[10px] text-emerald-700 mt-0.5">Onboarding instructions will follow</p>
                        </div>
                      ) : (
                        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                          <XCircle className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs font-bold text-gray-700">Offer Declined</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Application concluded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white/80 rounded-2xl border border-[#A7D6C0]/70 p-3 shadow-sm flex items-center justify-between">
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

      {/* Confirmation Dialog Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeModal.type === 'ACCEPT' ? 'bg-emerald-100 text-[#2E9D74]' : 'bg-rose-100 text-rose-600'
                }`}
              >
                {activeModal.type === 'ACCEPT' ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#143026]">
                  {activeModal.type === 'ACCEPT' ? 'Accept Employment Offer?' : 'Decline Employment Offer?'}
                </h3>
                <p className="text-xs text-[#4d7565] mt-0.5">
                  {activeModal.offer.designation} at {activeModal.offer.company?.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#143026] leading-relaxed bg-[#EAF6F0]/60 p-3 rounded-xl border border-[#A7D6C0]/50">
              {activeModal.type === 'ACCEPT'
                ? 'By accepting this offer, your application status will transition to OFFER_ACCEPTED. The employer will be notified immediately.'
                : 'Declining this offer will mark your application status as OFFER_REJECTED. This action cannot be reversed.'}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#143026]">
                {activeModal.type === 'ACCEPT' ? 'Message to Employer (Optional)' : 'Reason for Declining (Optional)'}
              </label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder={
                  activeModal.type === 'ACCEPT'
                    ? 'Thank you for this wonderful opportunity! Looking forward to joining...'
                    : 'I have decided to pursue another path / higher studies...'
                }
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-[#A7D6C0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E9D74] text-[#143026]"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmResponse}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition flex items-center gap-1.5 ${
                  activeModal.type === 'ACCEPT'
                    ? 'bg-[#2E9D74] hover:bg-[#25825f]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Submitting...' : activeModal.type === 'ACCEPT' ? 'Confirm Acceptance' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};
