import React, { useEffect, useState } from 'react';
import { companyService } from '../../services/company.service';
import type {
  CompanyListItem,
  CompanyDetailsAdmin,
} from '../../types/company.types';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Building2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Globe,
  MapPin,
  X,
  ExternalLink,
} from 'lucide-react';

export const CompanyManagementPage: React.FC = () => {


  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Review Drawer / Modal State
  const [reviewCompanyId, setReviewCompanyId] = useState<number | null>(null);
  const [reviewDetails, setReviewDetails] = useState<CompanyDetailsAdmin | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus;
      const data = await companyService.getAllCompanies(statusParam, searchQuery);
      setCompanies(data);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
      setErrorMessage(err.message || 'Unable to retrieve companies list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  const openReviewModal = async (companyId: number) => {
    setReviewCompanyId(companyId);
    setActionNotes('');
    try {
      setLoadingDetails(true);
      const details = await companyService.getCompanyDetailsAdmin(companyId);
      setReviewDetails(details);
    } catch (err: any) {
      console.error('Failed to load company details:', err);
      setErrorMessage(err.message || 'Failed to load detailed company profile.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeReviewModal = () => {
    setReviewCompanyId(null);
    setReviewDetails(null);
    setActionNotes('');
  };

  const handleVerificationAction = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!reviewCompanyId) return;

    try {
      setProcessingAction(true);
      setErrorMessage(null);
      await companyService.verifyCompany(reviewCompanyId, {
        status,
        notes: actionNotes.trim() || undefined,
      });

      setSuccessMessage(
        `Company ${reviewDetails?.name || 'organization'} successfully updated to ${status}.`
      );
      closeReviewModal();
      fetchCompanies();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Verification update failed:', err);
      setErrorMessage(err.message || `Failed to update status to ${status}.`);
    } finally {
      setProcessingAction(false);
    }
  };

  const pendingCount = companies.filter((c) => c.verificationStatus === 'PENDING').length;
  const verifiedCount = companies.filter((c) => c.verificationStatus === 'VERIFIED').length;

  return (
    <AdminLayout
      pageTitle="Corporate Relations & Partners"
      pageSubtitle="Review company registrations, verify recruitment credentials, and manage organizational access"
    >
      <div className="space-y-6">
        {/* Banner / Feedback */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Header Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#4d7565] uppercase">Total Registered</span>
              <p className="text-2xl font-black text-[#143026] mt-1">{companies.length}</p>
              <span className="text-[11px] text-[#4d7565]">Partner Companies</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#EAF6F0] flex items-center justify-center text-[#2E9D74]">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase">Pending Review</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
              <span className="text-[11px] text-amber-600">Awaiting Institutional Approval</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase">Verified Partners</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{verifiedCount}</p>
              <span className="text-[11px] text-emerald-600">Authorized for Campus Drives</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#A7D6C0]/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EAF6F0]/80 rounded-2xl border border-[#A7D6C0]/50 w-full md:w-auto">
            {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedStatus === status
                    ? 'bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white shadow-sm'
                    : 'text-[#315746] hover:bg-white/60'
                }`}
              >
                {status === 'ALL' ? 'All Companies' : status}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company name, location..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#A7D6C0] text-sm focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20 transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2E9D74] text-white text-xs font-bold rounded-xl hover:bg-[#258260] transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Companies List Table */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-[#A7D6C0]/40 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#143026]">
              {selectedStatus === 'ALL' ? 'All Corporate Accounts' : `${selectedStatus} Verification Queue`}
            </h3>
            <span className="text-xs font-bold text-[#4d7565]">
              Showing {companies.length} organization(s)
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-[#4d7565]">Retrieving company accounts from database...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="py-20 text-center p-6">
              <Building2 className="w-12 h-12 text-[#A7D6C0] mx-auto mb-3" />
              <h4 className="font-bold text-sm text-[#143026]">No companies match the criteria</h4>
              <p className="text-xs text-[#4d7565] mt-1 max-w-sm mx-auto">
                No corporate partner profiles currently found with status "{selectedStatus}".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EAF6F0]/60 text-[11px] font-bold uppercase tracking-wider text-[#315746] border-b border-[#A7D6C0]/40">
                    <th className="py-3 px-6">Company</th>
                    <th className="py-3 px-6">Industry</th>
                    <th className="py-3 px-6">Headquarters</th>
                    <th className="py-3 px-6">Team Size</th>
                    <th className="py-3 px-6">Verification</th>
                    <th className="py-3 px-6 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#A7D6C0]/30 text-xs">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-[#EAF6F0]/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={company.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#A7D6C0] bg-white shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-sm text-[#143026] block">{company.name}</span>
                            <span className="text-[11px] text-[#4d7565]">{company.contactEmail}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-[#143026] font-semibold">{company.industry}</td>

                      <td className="py-4 px-6 text-[#4d7565]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#2E9D74]" />
                          <span>{company.headquarters}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-[#143026]">
                          {company.recruitersCount} recruiter(s)
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            company.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : company.verificationStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              company.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-500'
                                : company.verificationStatus === 'PENDING'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          {company.verificationStatus}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openReviewModal(company.id)}
                          className="px-3.5 py-1.5 bg-[#EAF6F0] hover:bg-[#A7D6C0]/40 text-[#2E9D74] text-xs font-bold rounded-xl transition border border-[#2E9D74]/20 inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: COMPANY REVIEW & VERIFICATION */}
        {reviewCompanyId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-[#A7D6C0]/80 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#A7D6C0]/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {reviewDetails?.name ? reviewDetails.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#143026]">
                      {reviewDetails?.name || 'Review Organization Profile'}
                    </h3>
                    <p className="text-xs text-[#4d7565]">Placement Verification Evaluation</p>
                  </div>
                </div>
                <button
                  onClick={closeReviewModal}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetails || !reviewDetails ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#2E9D74]/20 border-t-[#2E9D74] rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs font-semibold text-[#4d7565]">Loading profile dossiers...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Status Banner */}
                  <div className="p-3 bg-[#EAF6F0]/70 rounded-2xl border border-[#A7D6C0]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#4d7565] block">
                        Current Lifecycle Status
                      </span>
                      <span className="text-xs font-bold text-[#143026]">
                        {reviewDetails.verificationStatus}
                      </span>
                    </div>
                    {reviewDetails.website && (
                      <a
                        href={reviewDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#2E9D74] hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" /> Visit Website <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {/* Profile Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Industry / Sector</span>
                      <p className="font-semibold text-gray-800">{reviewDetails.industry}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Company Size</span>
                      <p className="font-semibold text-gray-800">
                        {reviewDetails.companySize || 'Not specified'}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Headquarters</span>
                      <p className="font-semibold text-gray-800">{reviewDetails.headquarters}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Other Locations</span>
                      <p className="font-semibold text-gray-800">
                        {reviewDetails.locations || 'Not specified'}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Contact Email</span>
                      <p className="font-semibold text-gray-800">{reviewDetails.contactEmail}</p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Contact Phone</span>
                      <p className="font-semibold text-gray-800">
                        {reviewDetails.contactPhone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-bold uppercase text-gray-400">
                      Corporate Description &amp; Overview
                    </span>
                    <p className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                      {reviewDetails.description}
                    </p>
                  </div>

                  {/* Recruiter Roster in Review */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-gray-400">
                      Associated Corporate Recruiters ({reviewDetails.recruiters?.length || 0})
                    </span>
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl bg-gray-50/50 max-h-32 overflow-y-auto text-xs">
                      {reviewDetails.recruiters?.map((recruiter) => (
                        <div key={recruiter.id} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-800 block">{recruiter.fullName}</span>
                            <span className="text-[11px] text-gray-500">
                              {recruiter.designation} &bull; {recruiter.email}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                            {recruiter.accountStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification Review Notes */}
                  <div>
                    <label className="block text-xs font-bold text-[#143026] mb-1">
                      Placement Office Verification Notes (Audit Log)
                    </label>
                    <textarea
                      rows={2}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="e.g. Verified corporate registration, MoU established with University placement cell..."
                      className="w-full px-4 py-2 rounded-xl border border-[#A7D6C0] text-xs focus:outline-none focus:border-[#2E9D74] focus:ring-2 focus:ring-[#2E9D74]/20"
                    ></textarea>
                  </div>

                  {/* Verification Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#A7D6C0]/40">
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={processingAction}
                        onClick={() => handleVerificationAction('REJECTED')}
                        className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Reject Company
                      </button>

                      <button
                        type="button"
                        disabled={processingAction}
                        onClick={() => handleVerificationAction('VERIFIED')}
                        className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#2E9D74] to-[#61B795] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve &amp; Verify Partner
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
