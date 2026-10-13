import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../../components/student/StudentLayout';
import { placementService } from '../../services/placement.service';
import type { Placement } from '../../types/placement.types';
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  TrendingUp,
  Briefcase,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CONFIRMED: { label: 'Placement Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  JOINED: { label: 'Candidate Joined', bg: 'bg-[#2E9D74]/15', text: 'text-[#2E9D74]', border: 'border-[#2E9D74]' },
  DEFERRED: { label: 'Joining Deferred', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  RESCINDED: { label: 'Rescinded', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  DECLINED: { label: 'Declined by Student', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

export const StudentPlacementPage: React.FC = () => {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPlacement = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await placementService.getStudentPlacement();
      setPlacements(res.placements || []);
    } catch (err: any) {
      console.error('Failed to load student placement:', err);
      setErrorMessage(err.message || 'Unable to retrieve placement record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacement();
  }, []);

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
    <StudentLayout
      pageTitle="My Placement"
      pageSubtitle="Official institutional record of your campus placement outcome and employment details"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center bg-white/80 rounded-3xl border border-[#A7D6C0] shadow-sm">
            <div className="w-10 h-10 border-4 border-[#2E9D74] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-[#143026]">Verifying placement records...</p>
          </div>
        ) : placements.length > 0 ? (
          /* Placed View */
          placements.map((placement) => {
            const statusStyle = STATUS_CONFIG[placement.status] || {
              label: placement.status,
              bg: 'bg-gray-100',
              text: 'text-gray-700',
              border: 'border-gray-200',
            };

            return (
              <div key={placement.id} className="space-y-6">
                {/* HERO BANNER CARD */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#2E9D74] via-[#258260] to-[#143026] text-white rounded-3xl p-6 sm:p-8 shadow-md">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 p-2 flex items-center justify-center shadow-md flex-shrink-0">
                        {placement.company.logoUrl ? (
                          <img
                            src={placement.company.logoUrl}
                            alt={placement.company.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Building2 className="w-10 h-10 text-[#2E9D74]" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                            {placement.placementType.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Institutional Verified
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">{placement.designation}</h2>
                        <p className="text-white/80 font-medium text-sm flex items-center gap-1.5">
                          <span>{placement.company.name}</span>
                          <span>•</span>
                          <span>{placement.company.industry || 'Technology'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 text-right flex flex-col items-start md:items-end w-full md:w-auto">
                      <span className="text-xs text-white/70 font-semibold uppercase tracking-wider block mb-1">
                        Annual Compensation Package
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {formatCurrency(placement.packageAmount, placement.currency)}
                      </span>
                      <div className="mt-2">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KEY PLACEMENT SPECIFICATIONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#4d7565] mb-2">
                      <Calendar className="w-4 h-4 text-[#2E9D74]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Placement Date</span>
                    </div>
                    <span className="text-base font-extrabold text-[#143026]">{formatDate(placement.placementDate)}</span>
                  </div>

                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#4d7565] mb-2">
                      <Clock className="w-4 h-4 text-[#2E9D74]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Target Joining Date</span>
                    </div>
                    <span className="text-base font-extrabold text-[#143026]">{formatDate(placement.joiningDate)}</span>
                  </div>

                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#4d7565] mb-2">
                      <MapPin className="w-4 h-4 text-[#2E9D74]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Work Location</span>
                    </div>
                    <span className="text-base font-extrabold text-[#143026]">
                      {placement.location || placement.job?.location || 'Office HQ'}
                    </span>
                  </div>

                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-[#A7D6C0]/70 shadow-2xs">
                    <div className="flex items-center gap-2 text-[#4d7565] mb-2">
                      <Briefcase className="w-4 h-4 text-[#2E9D74]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Engagement Type</span>
                    </div>
                    <span className="text-base font-extrabold text-[#143026]">
                      {placement.job?.employmentType?.replace('_', ' ') || 'Full Time Career'}
                    </span>
                  </div>
                </div>

                {/* OFFER & DOCUMENTS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Official Offer Record */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0]/70 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/30">
                      <div className="flex items-center gap-2.5">
                        <Award className="w-5 h-5 text-[#2E9D74]" />
                        <h3 className="font-extrabold text-[#143026] text-sm">Official Offer Terms</h3>
                      </div>
                      <Link
                        to="/student/offers"
                        className="text-xs font-bold text-[#2E9D74] hover:underline flex items-center gap-1"
                      >
                        Offers Portal <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-[#4d7565]">Offer Release Date</span>
                        <span className="font-bold text-[#143026]">{formatDate(placement.offer?.offerDate)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-[#4d7565]">Offered Designation</span>
                        <span className="font-bold text-[#143026]">{placement.designation}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-[#4d7565]">Offered Package (CTC)</span>
                        <span className="font-bold text-[#2E9D74]">
                          {formatCurrency(placement.packageAmount, placement.currency)}
                        </span>
                      </div>
                      {placement.offer?.stipend && Number(placement.offer.stipend) > 0 && (
                        <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                          <span className="text-[#4d7565]">Training Period Stipend</span>
                          <span className="font-bold text-[#143026]">
                            ₹{Number(placement.offer.stipend).toLocaleString('en-IN')} / month
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-[#4d7565]">Institutional Audit ID</span>
                        <span className="font-mono text-[11px] font-bold text-gray-500">PLC-{placement.id}</span>
                      </div>
                    </div>

                    {/* Official Offer Letter Attachment */}
                    {placement.offer?.offerDocument ? (
                      <div className="mt-4 p-3.5 bg-[#EAF6F0]/60 rounded-2xl border border-[#A7D6C0] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-5 h-5 text-[#2E9D74] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-[#143026] text-xs truncate block">
                              {placement.offer.offerDocument.fileName || 'Official Offer Letter.pdf'}
                            </span>
                            <span className="text-[10px] text-[#4d7565]">
                              {(placement.offer.offerDocument.fileSize / 1024).toFixed(0)} KB • Verified PDF
                            </span>
                          </div>
                        </div>

                        <a
                          href={placement.offer.offerDocument.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 flex-shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                        Physical copy processed through institutional Placement Cell.
                      </div>
                    )}
                  </div>

                  {/* Recruitment Journey Timeline */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#A7D6C0]/70 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#A7D6C0]/30">
                      <TrendingUp className="w-5 h-5 text-[#2E9D74]" />
                      <h3 className="font-extrabold text-[#143026] text-sm">Recruitment Journey Milestones</h3>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {placement.application?.statusHistory && placement.application.statusHistory.length > 0 ? (
                        placement.application.statusHistory.map((history, idx) => (
                          <div key={history.id || idx} className="flex items-start gap-3 relative">
                            <div className="w-6 h-6 rounded-full bg-[#EAF6F0] border-2 border-[#2E9D74] flex items-center justify-center text-[#2E9D74] font-bold text-[10px] flex-shrink-0 mt-0.5">
                              ✓
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-bold text-[#143026] block">
                                {history.newStatus.replace(/_/g, ' ')}
                              </span>
                              {history.note && (
                                <p className="text-[#4d7565] text-[11px] leading-relaxed">{history.note}</p>
                              )}
                              <span className="text-[10px] text-gray-400 font-medium">
                                {formatDate(history.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#2E9D74] flex-shrink-0" />
                          <div>
                            <span className="font-bold text-[#143026] block">Placement Successfully Confirmed</span>
                            <span className="text-[11px] text-[#4d7565]">
                              Recorded officially on {formatDate(placement.placementDate)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Placement Notes */}
                {placement.notes && (
                  <div className="p-4 bg-white/80 rounded-2xl border border-[#A7D6C0]/50 text-xs text-[#143026]">
                    <span className="font-bold text-[#4d7565] uppercase tracking-wider block mb-1">
                      Placement Cell Notes
                    </span>
                    <p className="whitespace-pre-line leading-relaxed text-[#143026]">{placement.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* Empty State - Not Placed */
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 border border-[#A7D6C0]/70 text-center shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF6F0] text-[#2E9D74] flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-[#143026]">No Placement Recorded Yet</h3>
              <p className="text-xs text-[#4d7565] max-w-sm mx-auto leading-relaxed">
                Your official placement outcome will appear here once you clear your interviews and accept an official campus drive offer.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/opportunities"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#2E9D74] hover:bg-[#258260] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Browse Campus Opportunities
              </Link>
              <Link
                to="/student/applications"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#EAF6F0] hover:bg-[#A7D6C0]/30 text-[#2E9D74] rounded-xl text-xs font-bold transition border border-[#2E9D74]/20"
              >
                View Active Applications
              </Link>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};
