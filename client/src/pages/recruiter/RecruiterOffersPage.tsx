import React, { useEffect, useState } from 'react';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { offerService } from '../../services/offer.service';
import { applicationService } from '../../services/application.service';
import type { Offer, OfferStatus, OfferPagination, CreateOfferPayload, UpdateOfferPayload } from '../../types/offer.types';
import type { Application } from '../../types/application.types';
import {
  Award,
  Search,
  Filter,
  Plus,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from 'lucide-react';

const STATUS_CONFIG: Record<OfferStatus, { label: string; bg: string; text: string; border: string }> = {
  OFFERED: { label: 'Pending Response', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  ACCEPTED: { label: 'Offer Accepted', bg: 'bg-emerald-50', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]/30' },
  REJECTED: { label: 'Offer Declined', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  EXPIRED: { label: 'Expired', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
  REVOKED: { label: 'Revoked', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
};

export const RecruiterOffersPage: React.FC = () => {
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

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOffer, setEditModalOffer] = useState<Offer | null>(null);

  // Selected Candidates (only SELECTED applications can receive offers)
  const [selectedCandidates, setSelectedCandidates] = useState<Application[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Form State
  const [createPayload, setCreatePayload] = useState<CreateOfferPayload>({
    applicationId: 0,
    designation: '',
    salary: 1200000,
    stipend: null,
    currency: 'INR',
    location: 'Bengaluru / Hybrid',
    offerDate: new Date().toISOString().split('T')[0],
    joiningDate: '',
    acceptanceDeadline: '',
  });
  const [compensationType, setCompensationType] = useState<'CTC' | 'STIPEND'>('CTC');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Edit Payload
  const [editPayload, setEditPayload] = useState<UpdateOfferPayload>({
    designation: '',
    salary: null,
    stipend: null,
    location: '',
    joiningDate: '',
    acceptanceDeadline: '',
  });

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
      const res = await offerService.getRecruiterOffers({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        status: statusFilter ? (statusFilter as OfferStatus) : undefined,
      });
      setOffers(res.offers);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load recruiter offers:', err);
      setErrorMessage(err.message || 'Unable to retrieve company offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [pagination.page, debouncedSearch, statusFilter]);

  const loadSelectedCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const res = await applicationService.getCompanyApplications({
        page: 1,
        limit: 100,
      });
      // Candidate must be in SELECTED state to receive an offer
      const selected = res.applications.filter((app: Application) => app.status === 'SELECTED');
      setSelectedCandidates(selected);
      if (selected.length > 0 && createPayload.applicationId === 0) {
        setCreatePayload((prev) => ({
          ...prev,
          applicationId: selected[0].id,
          designation: selected[0].job?.title || selected[0].internship?.title || 'Software Engineer',
        }));
      }
    } catch (err) {
      console.error('Failed to load selected candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const openCreateModal = () => {
    loadSelectedCandidates();
    const today = new Date().toISOString().split('T')[0];
    const defaultJoin = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0];
    const defaultDeadline = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    setCreatePayload({
      applicationId: 0,
      designation: '',
      salary: 1200000,
      stipend: null,
      currency: 'INR',
      location: 'Bengaluru / Hybrid',
      offerDate: today,
      joiningDate: defaultJoin,
      acceptanceDeadline: defaultDeadline,
    });
    setCompensationType('CTC');
    setFormErrors([]);
    setCreateModalOpen(true);
  };

  const handleCandidateChange = (appId: number) => {
    const candidateApp = selectedCandidates.find((c) => c.id === appId);
    setCreatePayload((prev) => ({
      ...prev,
      applicationId: appId,
      designation: candidateApp?.job?.title || candidateApp?.internship?.title || prev.designation,
    }));
  };

  const handleCreateOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const errors: string[] = [];
    if (!createPayload.applicationId) errors.push('Please select a candidate who cleared interviews.');
    if (!createPayload.designation.trim()) errors.push('Designation/Role is required.');
    if (!createPayload.location.trim()) errors.push('Location is required.');
    if (compensationType === 'CTC' && (createPayload.salary === null || Number(createPayload.salary) <= 0)) {
      errors.push('Please specify a positive annual salary (CTC).');
    }
    if (compensationType === 'STIPEND' && (createPayload.stipend === null || Number(createPayload.stipend) <= 0)) {
      errors.push('Please specify a positive monthly stipend.');
    }
    if (createPayload.joiningDate && createPayload.offerDate && createPayload.joiningDate < createPayload.offerDate) {
      errors.push('Joining date cannot be earlier than offer date.');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      await offerService.createOffer({
        ...createPayload,
        salary: compensationType === 'CTC' ? Number(createPayload.salary) : null,
        stipend: compensationType === 'STIPEND' ? Number(createPayload.stipend) : null,
      });
      setCreateModalOpen(false);
      fetchOffers();
    } catch (err: any) {
      console.error('Failed to create offer:', err);
      setFormErrors([err.message || 'Failed to create offer.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOffer) return;

    try {
      setSubmitting(true);
      await offerService.updateOffer(editModalOffer.id, editPayload);
      setEditModalOffer(null);
      fetchOffers();
    } catch (err: any) {
      console.error('Failed to update offer:', err);
      alert(err.message || 'Failed to update offer.');
    } finally {
      setSubmitting(false);
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
      return `₹${num.toLocaleString()} ${offer.currency} / mo`;
    }
    return 'N/A';
  };

  return (
    <RecruiterLayout
      pageTitle="Offers &amp; Selections Management"
      pageSubtitle="Issue employment and internship offers to qualified candidates, monitor acceptance, and manage compensation terms"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white shadow-md shadow-[#2E9D74]/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#143026]">Candidate Offers &amp; Compensation</h1>
              <p className="text-xs text-[#4d7565] mt-0.5">
                Extend formal employment offers to candidates selected in campus drives
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="text-xs font-bold px-4 py-2.5 bg-gradient-to-r from-[#2E9D74] to-[#34a87e] text-white rounded-xl shadow-sm hover:shadow hover:from-[#25825f] hover:to-[#2b8c68] flex items-center gap-2 transition"
            >
              <Plus className="h-4 w-4" />
              Create Official Offer
            </button>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#A7D6C0]/70 p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b8071]" />
            <input
              type="text"
              placeholder="Search candidate, role, or student ID..."
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
                <option value="">All Offer Statuses</option>
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
              <p className="text-sm font-semibold text-[#2E9D74]">Loading offers...</p>
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
              <h3 className="text-base font-bold text-[#143026]">No Offers Created</h3>
              <p className="text-xs text-[#4d7565] max-w-md mx-auto mt-1 leading-relaxed">
                Once a candidate passes interview evaluations and is marked SELECTED, click "Create Official Offer" to extend formal contract terms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAF6F0]/80 text-[#143026] font-bold border-b border-[#A7D6C0]/70 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Compensation</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Issued On</th>
                    <th className="py-3 px-4">Target Joining</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/40">
                  {offers.map((offer) => {
                    const statusCfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.OFFERED;

                    return (
                      <tr key={offer.id} className="hover:bg-[#EAF6F0]/30 transition">
                        {/* Candidate */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#143026]">{offer.student?.fullName}</div>
                          <div className="text-[11px] text-[#4d7565]">
                            {offer.student?.studentId} • {offer.student?.course}
                          </div>
                        </td>

                        {/* Designation */}
                        <td className="py-3 px-4 font-semibold text-[#143026]">{offer.designation}</td>

                        {/* Compensation */}
                        <td className="py-3 px-4 font-bold text-[#2E9D74]">{formatCompensation(offer)}</td>

                        {/* Location */}
                        <td className="py-3 px-4 text-[#4d7565]">{offer.location}</td>

                        {/* Issued On */}
                        <td className="py-3 px-4 whitespace-nowrap text-[#4d7565]">{formatDate(offer.offerDate)}</td>

                        {/* Joining Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-[#143026] font-semibold">
                          {formatDate(offer.joiningDate)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            {statusCfg.label}
                          </span>
                          {offer.responseNotes && (
                            <div className="text-[10px] text-gray-500 italic mt-0.5 max-w-xs truncate" title={offer.responseNotes}>
                              "{offer.responseNotes}"
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {offer.status === 'OFFERED' && (
                              <button
                                onClick={() => {
                                  setEditModalOffer(offer);
                                  setEditPayload({
                                    designation: offer.designation,
                                    salary: offer.salary ? Number(offer.salary) : null,
                                    stipend: offer.stipend ? Number(offer.stipend) : null,
                                    location: offer.location,
                                    joiningDate: offer.joiningDate ? new Date(offer.joiningDate).toISOString().split('T')[0] : '',
                                    acceptanceDeadline: offer.acceptanceDeadline
                                      ? new Date(offer.acceptanceDeadline).toISOString().split('T')[0]
                                      : '',
                                  });
                                }}
                                title="Edit Offer Terms"
                                className="p-1.5 rounded-lg border border-[#A7D6C0] text-[#143026] hover:bg-[#EAF6F0] transition"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {offer.offerDocument && (
                              <a
                                href={offer.offerDocument.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Download Offer Document"
                                className="p-1.5 rounded-lg border border-[#2E9D74]/40 text-[#2E9D74] hover:bg-[#EAF6F0] transition"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
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
                Showing page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
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
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CREATE OFFER                                         */}
      {/* ------------------------------------------------------------- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Issue Formal Employment Offer</h3>
                <p className="text-xs text-[#4d7565]">
                  Select a candidate who cleared interview evaluations and configure contract parameters
                </p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs space-y-1">
                {formErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCreateOfferSubmit} className="space-y-4 text-xs">
              {/* Candidate Picker */}
              <div>
                <label className="font-bold text-[#143026] block mb-1">
                  Selected Candidate (Cleared Recruitment Rounds) *
                </label>
                {loadingCandidates ? (
                  <p className="text-[#4d7565]">Loading candidates in SELECTED state...</p>
                ) : selectedCandidates.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                    No candidates are currently marked as SELECTED for your company. Please complete interview evaluations and
                    advance candidates to "Selected" status first.
                  </div>
                ) : (
                  <select
                    value={createPayload.applicationId}
                    onChange={(e) => handleCandidateChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  >
                    <option value={0}>-- Select Candidate --</option>
                    {selectedCandidates.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.student?.fullName} ({app.student?.studentId}) — {app.job?.title || app.internship?.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Designation & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Designation / Official Job Title *</label>
                  <input
                    type="text"
                    value={createPayload.designation}
                    onChange={(e) => setCreatePayload({ ...createPayload, designation: e.target.value })}
                    placeholder="e.g. Associate Software Engineer"
                    className="w-full p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Work Location *</label>
                  <input
                    type="text"
                    value={createPayload.location}
                    onChange={(e) => setCreatePayload({ ...createPayload, location: e.target.value })}
                    placeholder="e.g. Bengaluru, Karnataka (Hybrid)"
                    className="w-full p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Compensation Type Selector */}
              <div className="p-3.5 bg-[#EAF6F0] rounded-xl border border-[#A7D6C0]/70 space-y-2">
                <span className="font-bold text-[#143026] block">Compensation Structure:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="compType"
                      checked={compensationType === 'CTC'}
                      onChange={() => setCompensationType('CTC')}
                      className="text-[#2E9D74] focus:ring-[#2E9D74]"
                    />
                    <span className="font-semibold">Full-Time Annual CTC (INR / year)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="compType"
                      checked={compensationType === 'STIPEND'}
                      onChange={() => setCompensationType('STIPEND')}
                      className="text-[#2E9D74] focus:ring-[#2E9D74]"
                    />
                    <span className="font-semibold">Internship Monthly Stipend (INR / month)</span>
                  </label>
                </div>

                {compensationType === 'CTC' ? (
                  <div>
                    <label className="font-semibold text-[#4d7565] block mt-1">Annual CTC (INR):</label>
                    <input
                      type="number"
                      value={createPayload.salary ?? ''}
                      onChange={(e) => setCreatePayload({ ...createPayload, salary: Number(e.target.value) })}
                      placeholder="e.g. 1400000 (14 LPA)"
                      className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none font-bold"
                      min={0}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-semibold text-[#4d7565] block mt-1">Monthly Stipend (INR):</label>
                    <input
                      type="number"
                      value={createPayload.stipend ?? ''}
                      onChange={(e) => setCreatePayload({ ...createPayload, stipend: Number(e.target.value) })}
                      placeholder="e.g. 45000"
                      className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none font-bold"
                      min={0}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Offer Date *</label>
                  <input
                    type="date"
                    value={createPayload.offerDate}
                    onChange={(e) => setCreatePayload({ ...createPayload, offerDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Target Joining Date</label>
                  <input
                    type="date"
                    value={createPayload.joiningDate || ''}
                    onChange={(e) => setCreatePayload({ ...createPayload, joiningDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#143026] block mb-1">Response Deadline</label>
                  <input
                    type="date"
                    value={createPayload.acceptanceDeadline || ''}
                    onChange={(e) => setCreatePayload({ ...createPayload, acceptanceDeadline: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedCandidates.length === 0}
                  className="px-5 py-2 font-bold bg-[#2E9D74] text-white rounded-xl shadow-sm hover:bg-[#25825f] transition disabled:opacity-50"
                >
                  {submitting ? 'Generating Offer...' : 'Issue Offer to Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: EDIT OFFER TERMS                                     */}
      {/* ------------------------------------------------------------- */}
      {editModalOffer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#A7D6C0] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#143026]">Update Offer Terms</h3>
                <p className="text-xs text-[#4d7565]">{editModalOffer.student?.fullName}</p>
              </div>
              <button onClick={() => setEditModalOffer(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleEditOfferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#143026] block mb-1">Designation</label>
                <input
                  type="text"
                  value={editPayload.designation}
                  onChange={(e) => setEditPayload({ ...editPayload, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#143026] block mb-1">Salary / Annual CTC (INR)</label>
                <input
                  type="number"
                  value={editPayload.salary ?? ''}
                  onChange={(e) => setEditPayload({ ...editPayload, salary: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                  min={0}
                />
              </div>

              <div>
                <label className="font-bold text-[#143026] block mb-1">Location</label>
                <input
                  type="text"
                  value={editPayload.location}
                  onChange={(e) => setEditPayload({ ...editPayload, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#143026] block mb-1">Joining Date</label>
                <input
                  type="date"
                  value={editPayload.joiningDate || ''}
                  onChange={(e) => setEditPayload({ ...editPayload, joiningDate: e.target.value })}
                  className="w-full p-2 rounded-xl border border-[#A7D6C0] bg-white text-[#143026] focus:ring-2 focus:ring-[#2E9D74] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalOffer(null)}
                  className="px-3 py-1.5 font-bold text-[#4d7565] hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 font-bold bg-[#2E9D74] text-white rounded-xl shadow-sm hover:bg-[#25825f] transition"
                >
                  {submitting ? 'Updating...' : 'Save Revisions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RecruiterLayout>
  );
};
