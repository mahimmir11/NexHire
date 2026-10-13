import React from 'react';
import { Link } from 'react-router-dom';
import { Info, ArrowRight, ShieldCheck } from 'lucide-react';

export const AboutSectionPreview: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-white border-y border-[#A7D6C0]/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>About NexHire</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#143026] tracking-tight leading-tight">
              Reimagining the Campus Recruitment Experience
            </h2>

            <p className="text-base sm:text-lg text-[#466a5b] leading-relaxed">
              NexHire was founded to eliminate the chaos, discrepancies, and spreadsheet fatigue that have historically hindered institutional campus recruitment drives.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#EAF6F0]/70 border border-[#A7D6C0]/50">
                <h4 className="text-sm font-bold text-[#143026] mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2E9D74]"></span>
                  Why It Exists
                </h4>
                <p className="text-xs text-[#527566] leading-relaxed">
                  To provide equal opportunity, eliminate accidental rule violations, and guarantee that top employers connect with verified candidate talent.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#EAF6F0]/70 border border-[#A7D6C0]/50">
                <h4 className="text-sm font-bold text-[#143026] mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2E9D74]"></span>
                  Who It Serves
                </h4>
                <p className="text-xs text-[#527566] leading-relaxed">
                  Students building careers, recruiters hunting talent, and placement directors safeguarding institutional standards.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 hover:shadow-lg transition-all cursor-pointer group"
              >
                <span>Read Platform Philosophy &amp; Architecture</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Visual Stats/Proof Card */}
          <div className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-7 sm:p-9 border border-[#A7D6C0]/80 shadow-nexhire-md bg-gradient-to-br from-white via-white to-[#EAF6F0] space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 flex items-center justify-center text-[#2E9D74]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#143026]">
                    Institutional Integrity Guarantee
                  </h4>
                  <span className="text-[11px] text-[#527566]">
                    Built for Higher Education Standards
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 pt-2 border-t border-[#A7D6C0]/40 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2E9D74]/20 flex items-center justify-center text-[#2E9D74] shrink-0 mt-0.5 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <strong className="block text-[#143026]">Zero Fake Information</strong>
                    <span className="text-[#527566]">Academic grades and skills are verified by departments before drive approvals.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2E9D74]/20 flex items-center justify-center text-[#2E9D74] shrink-0 mt-0.5 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <strong className="block text-[#143026]">Conflict-Free Offers</strong>
                    <span className="text-[#527566]">One-student-one-offer policies are automated directly into the state machine.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2E9D74]/20 flex items-center justify-center text-[#2E9D74] shrink-0 mt-0.5 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <strong className="block text-[#143026]">Institutional Auditability</strong>
                    <span className="text-[#527566]">Every recruitment event is recorded with non-repudiation audit trails.</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#EAF6F0] border border-[#A7D6C0]/60 text-center text-xs font-bold text-[#2E9D74]">
                Accreditation &amp; Compliance Ready (NAAC / NBA)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
