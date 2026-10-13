import React, { useEffect, useState } from 'react';
import { RecruiterLayout } from '../../components/recruiter/RecruiterLayout';
import { placementService } from '../../services/placement.service';
import type { Placement, PlacementStatus, PlacementType, PlacementPagination } from '../../types/placement.types';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const STATUS_CONFIG: Record<PlacementStatus, { label: string; bg: string; text: string; border: string }> = {
  CONFIRMED: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  JOINED: { label: 'Joined', bg: 'bg-[#2E9D74]/15', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]' },
  DEFERRED: { label: 'Deferred', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  RESCINDED: { label: 'Rescinded', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  DECLINED: { label: 'Declined', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

export const RecruiterPlacementsPage: React.FC = () => {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [pagination, setPagination] = useState<PlacementPagination>({
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
  const [typeFilter, setTypeFilter] = useState('');

  // Selected for Inspect / Update
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<PlacementStatus>('JOINED');
  const [statusNotes, setStatusNotes] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await placementService.getRecruiterPlacements({
        page: pagination.page,
        limit: pagination.limit,
        status: (statusFilter as PlacementStatus) || undefined,
        placementType: (typeFilter as PlacementType) || undefined,
        search: debouncedSearch || undefined,
      });
      setPlacements(res.placements || []);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load recruiter placements:', err);
      setErrorMessage(err.message || 'Unable to retrieve company placement records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, [pagination.page, debouncedSearch, statusFilter, typeFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlacement) return;

    try {
      setSubmittingStatus(true);
      setModalFeedback(null);
      const updated = await placementService.updatePlacementStatus(selectedPlacement.id, {
        status: newStatus,
        notes: statusNotes.trim() || undefined,
      });

      setModalFeedback({
        type: 'success',
        message: `Status updated to ${newStatus}.`,
      });

      setSelectedPlacement(updated);
      fetchPlacements();
      setTimeout(() => {
        setStatusModalOpen(false);
        setModalFeedback(null);
      }, 1200);
    } catch (err: any) {
      console.error('Status update failed:', err);
      setModalFeedback({
        type: 'error',
        message: err.message || 'Failed to update status.',
      });
    } finally {
      setSubmittingStatus(false);
    }
  };

  const formatCurrency = (amt: number | string, currency = 'INR') => {
    const num = Number(amt);
    if (isNaN(num)) return `${currency} 0`;
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} LPA`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const confirmedCount = placements.filter((p) => p.status === 'CONFIRMED').length;
  const joinedCount = placements.filter((p) => p.status === 'JOINED').length;

  return (
    <RecruiterLayout
      pageTitle="Placed Candidates"
      pageSubtitle="Monitor placed candidates, tracking confirmation, onboarding milestones, and joining updates"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* METRICS HEADER CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Total Placed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#143026]">{pagination.total}</span>
              <span className="text-xs text-[#2E9D74] font-semibold">Hired</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Confirmed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{confirmedCount}</span>
              <span className="text-xs text-[#4d7565]">Pre-joining</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Joined / Onboarded
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2E9D74]">{joinedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">Active</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Avg Package
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#143026]">
                {placements.length > 0
                  ? formatCurrency(
                      placements.reduce((acc, p) => acc + Number(p.packageAmount || 0), 0) / placements.length
                    )
                  : '₹0'}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#4d7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, student ID, roll number, or role..."
              className="w-full pl-9 pr-4 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs text-[#143026] placeholder-[#4d7565]/60 focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/40 px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs">
              <Filter className="w-3.5 h-3.5 text-[#4d7565]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="bg-transparent text-xs font-semibold text-[#143026] focus:outline-hidden cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="JOINED">Joined</option>
                <option value="DEFERRED">Deferred</option>
                <option value="DECLINED">Declined</option>
                <option value="RESCINDED">Rescinded</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#EAF6F0]/40 px-3 py-1.5 rounded-xl border border-[#A7D6C0] text-xs">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="bg-transparent text-xs font-semibold text-[#143026] focus:outline-hidden cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="ON_CAMPUS">On Campus</option>
                <option value="PPO">PPO</option>
                <option value="OFF_CAMPUS">Off Campus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PLACEMENTS TABLE */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#A7D6C0]/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EAF6F0]/60 border-b border-[#A7D6C0]/50 text-[11px] font-bold text-[#4d7565] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Joining Target</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A7D6C0]/30 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#4d7565]">
                      <div className="w-8 h-8 border-3 border-[#2E9D74] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading placed candidates...
                    </td>
                  </tr>
                ) : placements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#4d7565]">
                      <Award className="w-10 h-10 text-[#A7D6C0] mx-auto mb-2" />
                      <p className="font-bold text-[#143026]">No Placed Candidates Found</p>
                      <p className="text-xs text-[#4d7565] mt-1">
                        Candidates who accept job offers will be displayed in this placement registry.
                      </p>
                    </td>
                  </tr>
                ) : (
                  placements.map((placement) => {
                    const statusStyle = STATUS_CONFIG[placement.status] || {
                      label: placement.status,
                      bg: 'bg-gray-100',
                      text: 'text-gray-700',
                      border: 'border-gray-200',
                    };

                    return (
                      <tr key={placement.id} className="hover:bg-[#EAF6F0]/30 transition group">
                        {/* Candidate */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2E9D74] to-[#61B795] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                              {placement.student?.fullName ? placement.student.fullName.charAt(0) : 'S'}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#143026] group-hover:text-[#2E9D74] transition block">
                                {placement.student?.fullName}
                              </span>
                              <span className="text-[10px] text-[#4d7565] block">
                                {placement.student?.studentId} • {placement.student?.course}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Designation */}
                        <td className="py-3.5 px-4 font-semibold text-[#143026]">
                          {placement.designation}
                        </td>

                        {/* Package */}
                        <td className="py-3.5 px-4 font-black text-[#2E9D74]">
                          {formatCurrency(placement.packageAmount, placement.currency)}
                        </td>

                        {/* Joining Target */}
                        <td className="py-3.5 px-4 text-[#143026] font-medium">
                          {formatDate(placement.joiningDate)}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20">
                            {placement.placementType.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-block ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                          >
                            {statusStyle.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedPlacement(placement);
                                setNewStatus(placement.status);
                                setStatusNotes('');
                                setStatusModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-[#2E9D74] hover:bg-[#EAF6F0] rounded-lg transition"
                            >
                              Update Status
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-[#EAF6F0]/40 border-t border-[#A7D6C0]/40 flex items-center justify-between text-xs text-[#4d7565]">
              <span>
                Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> (
                {pagination.total} records)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-[#A7D6C0] bg-white text-[#143026] hover:bg-[#EAF6F0] disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-[#A7D6C0] bg-white text-[#143026] hover:bg-[#EAF6F0] disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATUS UPDATE MODAL */}
        {statusModalOpen && selectedPlacement && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#A7D6C0] shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/40">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-[#143026] text-base">Update Placement Status</h3>
                  <p className="text-xs text-[#4d7565]">
                    Candidate: <strong>{selectedPlacement.student?.fullName}</strong> ({selectedPlacement.designation})
                  </p>
                </div>
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#143026]">Placement Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as PlacementStatus)}
                    className="w-full px-3 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs text-[#143026] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                  >
                    <option value="CONFIRMED">CONFIRMED (Placement agreed, awaiting joining)</option>
                    <option value="JOINED">JOINED (Candidate successfully reported / onboarded)</option>
                    <option value="DEFERRED">DEFERRED (Joining date postponed)</option>
                    <option value="DECLINED">DECLINED (Candidate declined placement)</option>
                    <option value="RESCINDED">RESCINDED (Offer rescinded by company)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#143026]">Status Notes / Audit Comments</label>
                  <textarea
                    rows={3}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Enter joining confirmation details, batch number, or deferral reasons..."
                    className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(false)}
                    className="px-4 py-2 border border-[#A7D6C0] text-[#143026] rounded-xl text-xs font-bold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStatus}
                    className="px-5 py-2 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {submittingStatus ? 'Saving...' : 'Save Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};
