import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  Briefcase,
  FileCheck2,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface EntityCounts {
  users?: number;
  students?: number;
  companies?: number;
  recruiters?: number;
  jobs?: number;
  internships?: number;
  applications?: number;
  interviews?: number;
}

export const StatisticsSection: React.FC = () => {
  const [counts, setCounts] = useState<EntityCounts | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveStats() {
      try {
        const res = await fetch('http://localhost:5000/api/health');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.database?.summary?.entityCounts && isMounted) {
          setCounts(data.database.summary.entityCounts);
          setIsLive(true);
        }
      } catch {
        // Fallback gracefully to architectural platform highlights
      }
    }
    fetchLiveStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalOpportunities = (counts?.jobs || 0) + (counts?.internships || 0);

  return (
    <section className="py-16 sm:py-24 bg-white border-y border-[#A7D6C0]/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]/60 text-xs font-bold uppercase tracking-wider mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Platform Scale &amp; Capacity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#143026] tracking-tight">
              Institutional Scale
            </h2>
            <p className="text-sm sm:text-base text-[#466a5b] mt-1">
              Built on a high-concurrency enterprise relational architecture.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#EAF6F0] border border-[#A7D6C0]/70 text-xs font-semibold text-[#1e4435]">
            <Server className="w-3.5 h-3.5 text-[#2E9D74]" />
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Institutional Database Synced</span>
              </span>
            ) : (
              <span>Institutional Enterprise Architecture</span>
            )}
          </div>
        </div>

        {/* Dynamic / Architectural Highlights Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[#A7D6C0]/60 bg-gradient-to-b from-white to-[#EAF6F0]/40 shadow-xs hover:shadow-nexhire-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#143026] tracking-tight">
              {isLive && totalOpportunities > 0 ? `${totalOpportunities}+` : 'End-to-End'}
            </span>
            <span className="block text-xs sm:text-sm font-bold text-[#2E9D74] mt-1">
              {isLive && totalOpportunities > 0 ? 'Active Opportunities' : 'Complete Placement Lifecycle'}
            </span>
            <p className="text-xs text-[#527566] mt-2 leading-relaxed">
              {isLive && totalOpportunities > 0
                ? 'Full-time jobs and corporate internships currently posted across departments.'
                : 'Zero spreadsheets. Seamless journey from discovery to offer acceptance.'}
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[#A7D6C0]/60 bg-gradient-to-b from-white to-[#EAF6F0]/40 shadow-xs hover:shadow-nexhire-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#143026] tracking-tight">
              {isLive && counts?.companies !== undefined ? `${counts.companies}` : 'One Hub'}
            </span>
            <span className="block text-xs sm:text-sm font-bold text-[#2E9D74] mt-1">
              {isLive && counts?.companies !== undefined ? 'Verified Companies' : 'Unified Institutional Core'}
            </span>
            <p className="text-xs text-[#527566] mt-2 leading-relaxed">
              {isLive && counts?.companies !== undefined
                ? 'Corporate hiring partners authenticated and verified by placement authorities.'
                : 'Central repository connecting departments, corporate recruiters and applicants.'}
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[#A7D6C0]/60 bg-gradient-to-b from-white to-[#EAF6F0]/40 shadow-xs hover:shadow-nexhire-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#143026] tracking-tight">
              {isLive && counts?.applications !== undefined ? `${counts.applications}` : '4 Roles'}
            </span>
            <span className="block text-xs sm:text-sm font-bold text-[#2E9D74] mt-1">
              {isLive && counts?.applications !== undefined ? 'Processed Applications' : 'Role-Based Ecosystem'}
            </span>
            <p className="text-xs text-[#527566] mt-2 leading-relaxed">
              {isLive && counts?.applications !== undefined
                ? 'Candidate applications evaluated through strict automated eligibility criteria.'
                : 'Tailored workspaces for Students, Recruiters, Placement Admins, and Super Admins.'}
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-[#A7D6C0]/60 bg-gradient-to-b from-white to-[#EAF6F0]/40 shadow-xs hover:shadow-nexhire-md transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#143026] tracking-tight">
              100%
            </span>
            <span className="block text-xs sm:text-sm font-bold text-[#2E9D74] mt-1">
              Auditability &amp; Integrity
            </span>
            <p className="text-xs text-[#527566] mt-2 leading-relaxed">
              Every stage update, status change, and accepted offer is permanently audited in the system log.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
