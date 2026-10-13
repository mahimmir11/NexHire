import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  FileCheck2,
  CalendarCheck,
  Gift,
  Award,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface JourneyStep {
  id: string;
  label: string;
  icon: React.ElementType;
  title: string;
  description: string;
  highlight: string;
  badge: string;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    title: 'Verified Student Profiles',
    description: 'Academic records, CGPA, verified skills, and resume documents certified by the department.',
    highlight: '9.4 CGPA • Verified Skills',
    badge: 'Step 1',
  },
  {
    id: 'opportunity',
    label: 'Opportunity',
    icon: Briefcase,
    title: 'Curated Opportunities',
    description: 'Direct corporate job & internship listings with transparent compensation and criteria.',
    highlight: 'Software Engineer • ₹18.5 LPA',
    badge: 'Step 2',
  },
  {
    id: 'application',
    label: 'Application',
    icon: FileCheck2,
    title: 'Automated Eligibility',
    description: 'Instant verification of department, minimum CGPA, and backlogs before 1-click submission.',
    highlight: 'Zero Eligibility Mismatches',
    badge: 'Step 3',
  },
  {
    id: 'interview',
    label: 'Interview',
    icon: CalendarCheck,
    title: 'Multi-Round Coordination',
    description: 'Technical, coding, and HR rounds tracked in real time with automated calendar invites.',
    highlight: 'Round 2 Scheduled • Tech Interview',
    badge: 'Step 4',
  },
  {
    id: 'offer',
    label: 'Offer',
    icon: Gift,
    title: 'Transparent Offers',
    description: 'Formal digital offer letters with package breakdown, joining terms, and deadline tracking.',
    highlight: 'Offer Letter Released & Audited',
    badge: 'Step 5',
  },
  {
    id: 'placement',
    label: 'Placement',
    icon: Award,
    title: 'Verified Placements',
    description: 'Seamless institutional record creation preventing duplicate or conflicting offers.',
    highlight: 'Campus Placement Confirmed',
    badge: 'Step 6',
  },
];

export const HeroVisual: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(2); // Default to Application step

  const activeStep = JOURNEY_STEPS[activeStepIndex];

  return (
    <div className="relative w-full max-w-5xl mx-auto py-6 sm:py-10 select-none">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] bg-gradient-to-tr from-[#A7D6C0]/40 to-[#61B795]/20 rounded-full blur-3xl pointer-events-none -z-10 animate-nexhire-pulse-glow"></div>

      {/* Main Glassmorphic Showcase Container */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 md:p-10 shadow-nexhire-lg border border-[#A7D6C0]/70 relative overflow-hidden backdrop-blur-xl">
        {/* Top Header of the Flow Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#A7D6C0]/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#2E9D74]/15 border border-[#2E9D74]/30 flex items-center justify-center text-[#2E9D74]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E9D74]">
                The NexHire Placement Architecture
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#143026]">
                End-to-End Recruitment Journey
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#527566] bg-[#EAF6F0] px-3 py-1.5 rounded-full border border-[#A7D6C0]/50 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#2E9D74] animate-pulse"></span>
            <span>Live Institutional Pipeline</span>
          </div>
        </div>

        {/* The 6-Node Journey Flow */}
        <div className="py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative">
            {JOURNEY_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeStepIndex === idx;
              const isPast = idx < activeStepIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`group relative flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-b from-white to-[#EAF6F0] shadow-md border-2 border-[#2E9D74] scale-105 z-10'
                      : 'bg-white/60 hover:bg-white/90 border border-[#A7D6C0]/50 hover:border-[#2E9D74]/60'
                  }`}
                >
                  {/* Step Badge */}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                      isActive
                        ? 'bg-[#2E9D74] text-white'
                        : isPast
                        ? 'bg-[#A7D6C0]/50 text-[#143026]'
                        : 'bg-[#EAF6F0] text-[#527566]'
                    }`}
                  >
                    {step.badge}
                  </span>

                  {/* Node Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-[#2E9D74] text-white shadow-md shadow-[#2E9D74]/30'
                        : isPast
                        ? 'bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]'
                        : 'bg-gray-100 text-[#527566] group-hover:bg-[#EAF6F0] group-hover:text-[#2E9D74]'
                    }`}
                  >
                    <StepIcon className="w-6 h-6" />
                  </div>

                  {/* Label */}
                  <span
                    className={`mt-2.5 text-xs font-bold transition-colors ${
                      isActive ? 'text-[#143026]' : 'text-[#466a5b] group-hover:text-[#143026]'
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Active Indicator Pulse */}
                  {isActive && (
                    <span className="absolute -bottom-1 w-6 h-1 rounded-full bg-[#2E9D74]"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Deep-Dive Showcase */}
        <div className="mt-2 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white/95 to-[#EAF6F0]/90 border border-[#A7D6C0]/70 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#2E9D74] bg-[#2E9D74]/10 px-2.5 py-0.5 rounded-md">
                  Phase {activeStepIndex + 1} of 6
                </span>
                <h4 className="text-base sm:text-lg font-black text-[#143026]">
                  {activeStep.title}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#466a5b] max-w-xl leading-relaxed">
                {activeStep.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
              <div className="px-3.5 py-2 rounded-xl bg-white border border-[#A7D6C0]/70 text-right shadow-2xs">
                <span className="block text-[10px] uppercase font-bold text-[#527566]">
                  Live Parameter
                </span>
                <span className="text-xs font-bold text-[#2E9D74]">
                  {activeStep.highlight}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveStepIndex((prev) => (prev + 1) % JOURNEY_STEPS.length)}
                className="p-2.5 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white shadow-sm transition cursor-pointer"
                aria-label="Next step"
                title="View next lifecycle stage"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Floating Simulated Real-Time Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
          {/* Floating Card 1 */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-[#A7D6C0]/60 shadow-xs flex items-center gap-3 animate-nexhire-float">
            <div className="w-9 h-9 rounded-xl bg-[#2E9D74]/15 flex items-center justify-center text-[#2E9D74] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#143026] truncate">Aarav Sharma</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EAF6F0] text-[#2E9D74]">MCA</span>
              </div>
              <p className="text-[11px] text-[#527566] truncate">
                Eligibility: 9.4 CGPA • Cleared
              </p>
            </div>
          </div>

          {/* Floating Card 2 */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-[#A7D6C0]/60 shadow-xs flex items-center gap-3 animate-nexhire-float-delayed">
            <div className="w-9 h-9 rounded-xl bg-[#61B795]/20 flex items-center justify-center text-[#2E9D74] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#143026] truncate">Apex Innovations</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700">Interview</span>
              </div>
              <p className="text-[11px] text-[#527566] truncate">
                Round 2 Technical: Tomorrow 10 AM
              </p>
            </div>
          </div>

          {/* Floating Card 3 */}
          <div className="p-3.5 rounded-2xl bg-white/90 border border-[#A7D6C0]/60 shadow-xs flex items-center gap-3 animate-nexhire-float">
            <div className="w-9 h-9 rounded-xl bg-[#2E9D74]/15 flex items-center justify-center text-[#2E9D74] shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#143026] truncate">Offer Accepted</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-[#2E9D74]">₹18.5 LPA</span>
              </div>
              <p className="text-[11px] text-[#527566] truncate">
                Verified Placement ID #PL-2026-09
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
