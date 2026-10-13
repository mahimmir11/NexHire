import React, { useState } from 'react';
import {
  Compass,
  CheckCircle,
  Send,
  UserCheck2,
  CalendarCheck,
  Gift,
  Trophy,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface WorkflowStep {
  step: number;
  title: string;
  shortDesc: string;
  detail: string;
  icon: React.ElementType;
  tag: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    title: 'Discover Opportunity',
    shortDesc: 'Search verified campus jobs and internships.',
    detail: 'Browse corporate roles with transparent CTC packages, location criteria, and clear application timelines posted by verified employers.',
    icon: Compass,
    tag: 'Discovery',
  },
  {
    step: 2,
    title: 'Check Eligibility',
    shortDesc: 'Instant, automated institutional validation.',
    detail: 'NexHire instantly cross-checks your CGPA, active backlog count, degree specialization, and graduation year against recruiter prerequisites.',
    icon: CheckCircle,
    tag: 'Rules Engine',
  },
  {
    step: 3,
    title: 'Apply With 1-Click',
    shortDesc: 'Seamless one-click institutional submission.',
    detail: 'No duplicate forms or re-uploading PDFs. Apply immediately with your authenticated student profile, academic history, and verified documents.',
    icon: Send,
    tag: 'Submission',
  },
  {
    step: 4,
    title: 'Get Shortlisted',
    shortDesc: 'Recruiter review and candidate shortlisting.',
    detail: 'Employers review verified candidate batches and shortlist applicants with live notification alerts sent straight to your dashboard.',
    icon: UserCheck2,
    tag: 'Screening',
  },
  {
    step: 5,
    title: 'Attend Interviews',
    shortDesc: 'Multi-round scheduling and live tracking.',
    detail: 'Participate in technical evaluations, coding assessments, and HR interviews with automated slot management and performance tracking.',
    icon: CalendarCheck,
    tag: 'Evaluation',
  },
  {
    step: 6,
    title: 'Receive Official Offer',
    shortDesc: 'Cryptographically audited offer rollout.',
    detail: 'Receive digital offer letters detailing stipend, CTC breakdown, bond clauses, and joining dates with formal acceptance workflows.',
    icon: Gift,
    tag: 'Offer Rollout',
  },
  {
    step: 7,
    title: 'Get Placed & Verified',
    shortDesc: 'Campus placement confirmation.',
    detail: 'Accepted offers are automatically recorded into the institutional placement register, enforcing campus recruitment policies and celebrating your career success.',
    icon: Trophy,
    tag: 'Milestone',
  },
];

export const HowItWorksSection: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState(0);

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-[#A7D6C0]/40 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-96 bg-[#EAF6F0]/60 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Structured Campus Process</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#143026] tracking-tight">
            How NexHire Works
          </h2>

          <p className="text-base sm:text-lg text-[#466a5b] leading-relaxed">
            From the first opportunity discovery to the final placement letter, NexHire streamlines the entire seven-step campus placement journey.
          </p>
        </div>

        {/* 7-Step Horizontal / Tabbed Timeline */}
        <div className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = selectedStep === idx;
              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setSelectedStep(idx)}
                  className={`p-3.5 rounded-2xl flex flex-col items-center text-center transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#2E9D74] text-white shadow-md shadow-[#2E9D74]/30 scale-105'
                      : 'bg-[#EAF6F0]/70 hover:bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0]/50'
                  }`}
                >
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full mb-2 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#2E9D74]'
                    }`}
                  >
                    0{step.step}
                  </span>
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : 'text-[#2E9D74]'}`} />
                  <span className="text-xs font-bold leading-tight line-clamp-1">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Step Card Preview */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-[#A7D6C0]/80 shadow-nexhire-md bg-gradient-to-br from-white via-white to-[#EAF6F0]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#2E9D74] text-white text-xs font-bold uppercase tracking-wider">
                  Step 0{WORKFLOW_STEPS[selectedStep].step}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#EAF6F0] text-[#2E9D74] text-xs font-bold border border-[#A7D6C0]/60">
                  {WORKFLOW_STEPS[selectedStep].tag}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#143026]">
                {WORKFLOW_STEPS[selectedStep].title}
              </h3>

              <p className="text-base text-[#143026] font-semibold">
                {WORKFLOW_STEPS[selectedStep].shortDesc}
              </p>

              <p className="text-sm text-[#527566] leading-relaxed">
                {WORKFLOW_STEPS[selectedStep].detail}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStep((prev) => (prev > 0 ? prev - 1 : WORKFLOW_STEPS.length - 1))}
                  className="px-4 py-2 rounded-xl border border-[#A7D6C0] text-xs font-bold text-[#143026] hover:bg-[#EAF6F0] transition cursor-pointer"
                >
                  &larr; Previous Step
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStep((prev) => (prev + 1) % WORKFLOW_STEPS.length)}
                  className="px-4 py-2 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#EAF6F0] rounded-2xl p-6 border border-[#A7D6C0]/70 space-y-4 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-[#A7D6C0]/50">
                  <span className="text-xs font-bold text-[#1e4435] uppercase tracking-wider">
                    Institutional Flow Safeguard
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Automated
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#A7D6C0]/40 flex items-center justify-between">
                    <span className="text-[#527566]">Data Verification</span>
                    <span className="font-bold text-[#2E9D74]">College Certified</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#A7D6C0]/40 flex items-center justify-between">
                    <span className="text-[#527566]">Policy Validation</span>
                    <span className="font-bold text-[#2E9D74]">Real-Time Pass</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#A7D6C0]/40 flex items-center justify-between">
                    <span className="text-[#527566]">Status Audit Trail</span>
                    <span className="font-bold text-[#2E9D74]">Logged to DB</span>
                  </div>
                </div>

                <div className="p-3 bg-[#2E9D74]/10 rounded-xl border border-[#2E9D74]/20 text-[11px] text-[#1e4435] leading-relaxed">
                  Every step is audited with strict role authorization, preventing out-of-order changes or unauthorized offer acceptances.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
