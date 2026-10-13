import React from 'react';
import { Link } from 'react-router-dom';
import { HeroVisual } from './HeroVisual';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  Compass,
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-6 pb-16 sm:pb-24 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A7D6C0]/35 rounded-full blur-3xl"></div>
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#61B795]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Hero Headline Block */}
        <div className="text-center max-w-4xl mx-auto space-y-6 pt-4 sm:pt-8">
          {/* Institution Category Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#A7D6C0]/80 shadow-xs text-xs font-bold text-[#1e4435]">
            <span className="flex h-2 w-2 rounded-full bg-[#2E9D74] animate-pulse"></span>
            <span>Next-Gen Campus Placement &amp; Career Infrastructure</span>
            <span className="text-[#A7D6C0]">&bull;</span>
            <span className="text-[#2E9D74]">Enterprise Edition</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#143026] tracking-tight leading-[1.1]">
            Connecting Talent With{' '}
            <span className="relative inline-block text-[#2E9D74]">
              Opportunity.
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#A7D6C0]/60 -z-10"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
              >
                <path d="M0 15 Q 50 0 100 15" stroke="currentColor" strokeWidth="6" fill="none" />
              </svg>
            </span>
          </h1>

          {/* Supporting Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-[#466a5b] font-normal max-w-2xl mx-auto leading-relaxed">
            NexHire brings students, recruiters, opportunities, interviews, offers, and verified placements together in one intelligent campus platform.
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] hover:from-[#258260] hover:to-[#50a181] text-white text-sm font-bold shadow-nexhire-md hover:shadow-nexhire-lg transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Login to NexHire</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <button
              type="button"
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/90 hover:bg-[#EAF6F0] text-[#143026] hover:text-[#2E9D74] text-sm font-bold border border-[#A7D6C0] shadow-xs hover:shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#2E9D74]" />
              <span>Explore Features</span>
            </button>
          </div>

          {/* Quick Platform Proof Metrics */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-[#527566]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#2E9D74]" />
              <span>100% Automated Eligibility</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2E9D74]" />
              <span>Zero Placement Conflicts</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2E9D74]" />
              <span>Role-Based Governance</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Placement Lifecycle Architecture */}
        <div className="mt-8 sm:mt-12">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
};
