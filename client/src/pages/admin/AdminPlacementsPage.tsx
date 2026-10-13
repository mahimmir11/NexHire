import React, { useEffect, useState } from 'react';
import { placementService } from '../../services/placement.service';
import { applicationService } from '../../services/application.service';
import type {
  Placement,
  PlacementStatus,
  PlacementType,
  PlacementPagination,
  PlacementStats,
  CreatePlacementPayload,
} from '../../types/placement.types';
import type { Application } from '../../types/application.types';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Eye,
  Building2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Plus,
  Download,
} from 'lucide-react';

const STATUS_CONFIG: Record<PlacementStatus, { label: string; bg: string; text: string; border: string }> = {
  CONFIRMED: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  JOINED: { label: 'Joined', bg: 'bg-[#2E9D74]/15', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]' },
  DEFERRED: { label: 'Deferred', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  RESCINDED: { label: 'Rescinded', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  DECLINED: { label: 'Declined', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

export const AdminPlacementsPage: React.FC = () => {
  const [placements, setPlacements] = useState<Placement[]>([]);

  const [stats, setStats] = useState<PlacementStats | null>(null);
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

  // Inspection Drawer
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);
  const [statusUpdateVal, setStatusUpdateVal] = useState<PlacementStatus>('JOINED');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create Placement Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [eligibleApplications, setEligibleApplications] = useState<Application[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [newPlacementPayload, setNewPlacementPayload] = useState<Partial<CreatePlacementPayload>>({
    currency: 'INR',
    placementType: 'ON_CAMPUS',
    status: 'CONFIRMED',
    packageAmount: 0,
  });
  const [creatingPlacement, setCreatingPlacement] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPlacementsData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [listRes, statsRes] = await Promise.all([
        placementService.getAdminPlacements({
          page: pagination.page,
          limit: pagination.limit,
          status: (statusFilter as PlacementStatus) || undefined,
          placementType: (typeFilter as PlacementType) || undefined,
          search: debouncedSearch || undefined,
        }),
        placementService.getPlacementStats().catch(() => null),
      ]);
      setPlacements(listRes.placements || []);
      setPagination(listRes.pagination);
      if (statsRes) setStats(statsRes);
    } catch (err: any) {
      console.error('Failed to load admin placements:', err);
      setErrorMessage(err.message || 'Unable to retrieve institutional placements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementsData();
  }, [pagination.page, debouncedSearch, statusFilter, typeFilter]);

  const openCreateModal = async () => {
    try {
      setCreateFeedback(null);
      setLoadingEligible(true);
      setCreateModalOpen(true);

      // Fetch candidates who are OFFER_ACCEPTED or SELECTED
      const [resAccepted, resSelected] = await Promise.all([
        applicationService.getAdminApplications({ status: 'OFFER_ACCEPTED', limit: 50 }),
        applicationService.getAdminApplications({ status: 'SELECTED', limit: 50 }),
      ]);

      const combined = [...resAccepted.applications, ...resSelected.applications];
      setEligibleApplications(combined);

      if (combined.length > 0) {
        const first = combined[0];
        setNewPlacementPayload({
          applicationId: first.id,
          designation: first.job?.title || first.internship?.title || 'Associate Engineer',
          location: first.job?.location || first.internship?.location || 'Bengaluru',
          packageAmount: first.job?.salaryMax ? Number(first.job.salaryMax) : 800000,
          currency: 'INR',
          placementType: 'ON_CAMPUS',
          status: 'CONFIRMED',
          placementDate: new Date().toISOString().split('T')[0],
          joiningDate: '',
          notes: 'Campus drive placement recorded by Placement Cell.',
        });
      }
    } catch (err: any) {
      console.error('Failed to load eligible candidates:', err);
      setCreateFeedback({
        type: 'error',
        message: 'Could not load eligible candidate applications.',
      });
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleApplicationSelect = (appId: number) => {
    const selected = eligibleApplications.find((a) => a.id === appId);
    if (!selected) return;

    setNewPlacementPayload((prev) => ({
      ...prev,
      applicationId: selected.id,
      designation: selected.job?.title || selected.internship?.title || prev.designation || 'Software Engineer',
      location: selected.job?.location || selected.internship?.location || prev.location || 'Bengaluru',
      packageAmount: selected.job?.salaryMax ? Number(selected.job.salaryMax) : prev.packageAmount || 800000,
    }));
  };

  const handleCreatePlacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlacementPayload.applicationId || !newPlacementPayload.designation || !newPlacementPayload.packageAmount) {
      setCreateFeedback({
        type: 'error',
        message: 'Application, Designation, and Package Amount are required.',
      });
      return;
    }

    try {
      setCreatingPlacement(true);
      setCreateFeedback(null);
      await placementService.createPlacement({
        applicationId: newPlacementPayload.applicationId,
        packageAmount: Number(newPlacementPayload.packageAmount),
        currency: newPlacementPayload.currency || 'INR',
        designation: newPlacementPayload.designation,
        location: newPlacementPayload.location || undefined,
        placementDate: newPlacementPayload.placementDate || undefined,
        joiningDate: newPlacementPayload.joiningDate || undefined,
        placementType: newPlacementPayload.placementType || 'ON_CAMPUS',
        status: newPlacementPayload.status || 'CONFIRMED',
        notes: newPlacementPayload.notes || undefined,
      });

      setCreateFeedback({
        type: 'success',
        message: 'Placement outcome successfully recorded and candidate status transitioned to HIRED_PLACED.',
      });

      fetchPlacementsData();
      setTimeout(() => {
        setCreateModalOpen(false);
        setCreateFeedback(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create placement:', err);
      setCreateFeedback({
        type: 'error',
        message: err.message || 'Failed to create placement record.',
      });
    } finally {
      setCreatingPlacement(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlacement) return;

    try {
      setUpdatingStatus(true);
      setActionFeedback(null);
      const updated = await placementService.updatePlacementStatus(selectedPlacement.id, {
        status: statusUpdateVal,
        notes: statusNotes.trim() || undefined,
      });

      setActionFeedback({
        type: 'success',
        message: `Status updated to ${statusUpdateVal}.`,
      });

      setSelectedPlacement((prev) => (prev ? { ...prev, status: updated.status, notes: updated.notes } : null));
      fetchPlacementsData();
    } catch (err: any) {
      console.error('Status update failed:', err);
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to update status.',
      });
    } finally {
      setUpdatingStatus(false);
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

  return (
    <AdminLayout
      pageTitle="Institutional Placement Registry"
      pageSubtitle="Official verification, recording, and monitoring of campus placements and joining records"
    >
      <div className="space-y-6">
        {/* Title & Action */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[#A7D6C0]/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#143026]">
              Institutional Placement Registry
            </h1>
            <p className="text-xs md:text-sm text-[#4d7565] mt-1 font-medium">
              Official verification, recording, and monitoring of campus placements and joining records
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record Placement
          </button>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Total Placements
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#143026]">{stats?.totalPlacements ?? pagination.total}</span>
              <span className="text-xs text-[#2E9D74] font-semibold">Verified</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Confirmed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {stats?.statusBreakdown.confirmed ?? 0}
              </span>
              <span className="text-xs text-[#4d7565]">Pre-joining</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Candidates Joined
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#2E9D74]">
                {stats?.statusBreakdown.joined ?? 0}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Onboarded</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Average Package
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#143026]">
                {stats?.salaryStats.average ? formatCurrency(stats.salaryStats.average) : '₹0'}
              </span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#A7D6C0]/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block mb-1">
              Highest Package
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#2E9D74]">
                {stats?.salaryStats.highest ? formatCurrency(stats.salaryStats.highest) : '₹0'}
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
              placeholder="Search candidate name, student ID, roll number, or company..."
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
                <option value="">All Placement Types</option>
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
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Package</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Joining Target</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A7D6C0]/30 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#4d7565]">
                      <div className="w-8 h-8 border-3 border-[#2E9D74] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading placement records...
                    </td>
                  </tr>
                ) : placements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#4d7565]">
                      <Award className="w-10 h-10 text-[#A7D6C0] mx-auto mb-2" />
                      <p className="font-bold text-[#143026]">No Placement Records Found</p>
                      <p className="text-xs text-[#4d7565] mt-1">
                        Use the "Record Placement" action above to record placements for eligible candidates.
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
                        {/* Student */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2E9D74] to-[#61B795] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
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

                        {/* Company */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#2E9D74] flex-shrink-0" />
                            <span className="font-bold text-[#143026]">{placement.company?.name}</span>
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

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF6F0] text-[#2E9D74] border border-[#2E9D74]/20">
                            {placement.placementType.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Joining Target */}
                        <td className="py-3.5 px-4 text-[#143026] font-medium">
                          {formatDate(placement.joiningDate)}
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
                          <button
                            onClick={() => {
                              setSelectedPlacement(placement);
                              setStatusUpdateVal(placement.status);
                              setStatusNotes('');
                              setActionFeedback(null);
                            }}
                            className="px-3 py-1.5 text-xs font-bold bg-[#EAF6F0] hover:bg-[#A7D6C0]/30 text-[#2E9D74] rounded-xl transition inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </button>
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

        {/* INSPECTION DRAWER / MODAL */}
        {selectedPlacement && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-end">
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col border-l border-[#A7D6C0]">
              <div className="flex items-center justify-between pb-4 border-b border-[#A7D6C0]/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EAF6F0] text-[#2E9D74] flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#143026] text-base">Placement Inspection</h3>
                    <span className="text-xs text-[#4d7565]">Record ID: PLC-{selectedPlacement.id}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlacement(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
                    actionFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {actionFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              {/* CANDIDATE SNAPSHOT */}
              <div className="p-4 bg-[#EAF6F0]/40 rounded-2xl border border-[#A7D6C0]/50 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7565] block">
                  Placed Candidate
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-[#143026] text-sm">{selectedPlacement.student?.fullName}</h4>
                    <span className="text-xs text-[#4d7565]">
                      Roll: {selectedPlacement.student?.studentId} • {selectedPlacement.student?.course} (
                      {selectedPlacement.student?.department?.code})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#2E9D74]">
                    CGPA: {selectedPlacement.student?.cgpa ? Number(selectedPlacement.student.cgpa).toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* PLACEMENT & COMPENSATION SPECS */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[#4d7565] block">Hiring Company</span>
                  <span className="font-bold text-[#143026]">{selectedPlacement.company?.name}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[#4d7565] block">Annual Package (CTC)</span>
                  <span className="font-black text-[#2E9D74]">
                    {formatCurrency(selectedPlacement.packageAmount, selectedPlacement.currency)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[#4d7565] block">Placement Date</span>
                  <span className="font-bold text-[#143026]">{formatDate(selectedPlacement.placementDate)}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[#4d7565] block">Target Joining Date</span>
                  <span className="font-bold text-[#143026]">{formatDate(selectedPlacement.joiningDate)}</span>
                </div>
              </div>

              {/* ATTACHED OFFER LETTER */}
              {selectedPlacement.offer?.offerDocument && (
                <div className="p-3.5 bg-[#EAF6F0]/60 rounded-2xl border border-[#A7D6C0] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2E9D74]" />
                    <span className="font-bold text-[#143026]">
                      {selectedPlacement.offer.offerDocument.fileName || 'Offer Letter.pdf'}
                    </span>
                  </div>
                  <a
                    href={selectedPlacement.offer.offerDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-[#2E9D74] text-white rounded-lg text-xs font-bold hover:bg-[#258260] transition flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              )}

              {/* JOURNEY TIMELINE */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-[#143026]">Application &amp; Placement Milestones</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedPlacement.application?.statusHistory && selectedPlacement.application.statusHistory.length > 0 ? (
                    selectedPlacement.application.statusHistory.map((h, i) => (
                      <div key={h.id || i} className="p-2.5 bg-gray-50 rounded-xl text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between text-[#4d7565]">
                          <span className="font-bold text-[#143026]">{h.newStatus.replace(/_/g, ' ')}</span>
                          <span>{formatDate(h.createdAt)}</span>
                        </div>
                        {h.note && <p className="text-gray-600">{h.note}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No historical status transitions recorded.</p>
                  )}
                </div>
              </div>

              {/* STATUS CHANGE FORM */}
              <form onSubmit={handleUpdateStatus} className="p-4 bg-[#EAF6F0]/60 rounded-2xl border border-[#A7D6C0] space-y-3 mt-auto">
                <h4 className="font-bold text-xs text-[#143026]">Update Placement Status</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#4d7565] block mb-1">Status</label>
                    <select
                      value={statusUpdateVal}
                      onChange={(e) => setStatusUpdateVal(e.target.value as PlacementStatus)}
                      className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                    >
                      <option value="CONFIRMED">CONFIRMED (Awaiting Joining)</option>
                      <option value="JOINED">JOINED (Candidate Reported)</option>
                      <option value="DEFERRED">DEFERRED (Date Postponed)</option>
                      <option value="DECLINED">DECLINED (Student Declined)</option>
                      <option value="RESCINDED">RESCINDED (Offer Cancelled)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4d7565] block mb-1">Audit Note</label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Note for audit history..."
                      className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECORD PLACEMENT MODAL */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#A7D6C0] shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/40">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-[#143026] text-base">Record Placement Outcome</h3>
                  <p className="text-xs text-[#4d7565]">
                    Confirm official placement for an eligible candidate
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
                    createFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {createFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{createFeedback.message}</span>
                </div>
              )}

              {loadingEligible ? (
                <div className="p-8 text-center text-xs text-[#4d7565]">
                  <div className="w-6 h-6 border-2 border-[#2E9D74] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading eligible candidates...
                </div>
              ) : eligibleApplications.length === 0 ? (
                <div className="p-6 text-center text-xs bg-amber-50 text-amber-900 rounded-2xl border border-amber-200">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="font-bold">No Eligible Candidates Found</p>
                  <p className="mt-1 text-amber-800">
                    Only candidates in "SELECTED" or "OFFER_ACCEPTED" status can be recorded for placement.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreatePlacementSubmit} className="space-y-3.5 text-xs">
                  {/* Select Application */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#143026]">Candidate Application</label>
                    <select
                      value={newPlacementPayload.applicationId}
                      onChange={(e) => handleApplicationSelect(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#EAF6F0]/40 border border-[#A7D6C0] rounded-xl text-xs text-[#143026] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                    >
                      {eligibleApplications.map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.student?.fullName} ({app.student?.studentId}) —{' '}
                          {app.job?.title || app.internship?.title} ({app.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#143026]">Placement Designation / Role</label>
                    <input
                      type="text"
                      required
                      value={newPlacementPayload.designation || ''}
                      onChange={(e) => setNewPlacementPayload({ ...newPlacementPayload, designation: e.target.value })}
                      placeholder="e.g. Software Development Engineer"
                      className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                    />
                  </div>

                  {/* Package & Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#143026]">Annual Package (INR)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newPlacementPayload.packageAmount || ''}
                        onChange={(e) =>
                          setNewPlacementPayload({ ...newPlacementPayload, packageAmount: Number(e.target.value) })
                        }
                        placeholder="e.g. 1200000"
                        className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#143026]">Location</label>
                      <input
                        type="text"
                        value={newPlacementPayload.location || ''}
                        onChange={(e) => setNewPlacementPayload({ ...newPlacementPayload, location: e.target.value })}
                        placeholder="e.g. Bengaluru, Karnataka"
                        className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                      />
                    </div>
                  </div>

                  {/* Type & Joining Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#143026]">Placement Type</label>
                      <select
                        value={newPlacementPayload.placementType}
                        onChange={(e) =>
                          setNewPlacementPayload({
                            ...newPlacementPayload,
                            placementType: e.target.value as PlacementType,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                      >
                        <option value="ON_CAMPUS">On Campus</option>
                        <option value="PPO">PPO</option>
                        <option value="OFF_CAMPUS">Off Campus</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#143026]">Target Joining Date</label>
                      <input
                        type="date"
                        value={newPlacementPayload.joiningDate || ''}
                        onChange={(e) => setNewPlacementPayload({ ...newPlacementPayload, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#143026]">Administrative Notes</label>
                    <textarea
                      rows={2}
                      value={newPlacementPayload.notes || ''}
                      onChange={(e) => setNewPlacementPayload({ ...newPlacementPayload, notes: e.target.value })}
                      placeholder="Special conditions, stipend during training, etc..."
                      className="w-full px-3 py-2 bg-white border border-[#A7D6C0] rounded-xl text-xs text-[#143026] focus:outline-hidden focus:ring-2 focus:ring-[#2E9D74]"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="px-4 py-2 border border-[#A7D6C0] text-[#143026] rounded-xl text-xs font-bold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingPlacement}
                      className="px-5 py-2 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                    >
                      {creatingPlacement ? 'Recording...' : 'Confirm Placement'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
