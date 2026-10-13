import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const WhatIsNexHireSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white/70 border-y border-[#A7D6C0]/40 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#EAF6F0] rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#A7D6C0]/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EAF6F0] text-[#2E9D74] border border-[#A7D6C0]/60 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Platform Overview</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#143026] tracking-tight">
            What is NexHire?
          </h2>

          <p className="text-base sm:text-lg text-[#466a5b] leading-relaxed">
            NexHire is a centralized internship and placement management platform designed to simplify the journey from opportunity discovery to successful placement.
          </p>
        </div>

        {/* 3 Pillar Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Card 1: Traditional Placements vs Problem */}
          <div className="glass-card rounded-3xl p-7 flex flex-col justify-between border border-red-200/60 bg-red-50/20 shadow-xs hover:shadow-md transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-5">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                The Traditional Challenge
              </span>
              <h3 className="text-xl font-bold text-[#143026] mt-1 mb-3">
                Fragmented &amp; Manual Chaos
              </h3>
              <p className="text-sm text-[#527566] leading-relaxed mb-4">
                Colleges struggle with scattered Google Sheets, lost email threads, manual CGPA calculations, and accidental duplicate offers between competing recruiters.
              </p>
            </div>

            <ul className="space-y-2 pt-4 border-t border-red-100/80 text-xs text-red-900/80 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>Unverified resumes &amp; self-reported grades</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>Manual backlog &amp; eligibility audits</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>Zero real-time visibility for students</span>
              </li>
            </ul>
          </div>

          {/* Card 2: The NexHire Platform (Hero Pillar) */}
          <div className="rounded-3xl p-7 flex flex-col justify-between bg-gradient-to-b from-white to-[#EAF6F0] border-2 border-[#2E9D74] shadow-nexhire-md hover:shadow-nexhire-lg transition-all duration-300 relative scale-[1.02]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2E9D74] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
              The NexHire Solution
            </div>

            <div className="mt-2">
              <div className="w-12 h-12 rounded-2xl bg-[#2E9D74] flex items-center justify-center text-white mb-5 shadow-md shadow-[#2E9D74]/25">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E9D74]">
                Intelligent Campus Engine
              </span>
              <h3 className="text-xl font-bold text-[#143026] mt-1 mb-3">
                Unified Recruitment Hub
              </h3>
              <p className="text-sm text-[#466a5b] leading-relaxed mb-4">
                A single authenticated system connecting students, company recruiters, department heads, and placement administrators with automated role-based workflows.
              </p>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-[#A7D6C0]/60 text-xs text-[#143026] font-semibold">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9D74] shrink-0" />
                <span>Instant automated CGPA &amp; backlog verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9D74] shrink-0" />
                <span>Multi-round live interview schedule tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9D74] shrink-0" />
                <span>Digital verified offer generation &amp; acceptance</span>
              </li>
            </ul>
          </div>

          {/* Card 3: The Result / Institutional Impact */}
          <div className="glass-card rounded-3xl p-7 flex flex-col justify-between border border-[#A7D6C0]/70 bg-white/90 shadow-xs hover:shadow-md transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EAF6F0] border border-[#A7D6C0]/80 flex items-center justify-center text-[#2E9D74] mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E9D74]">
                The Outcome
              </span>
              <h3 className="text-xl font-bold text-[#143026] mt-1 mb-3">
                Total Integrity &amp; Transparency
              </h3>
              <p className="text-sm text-[#527566] leading-relaxed mb-4">
                Students receive fair, transparent access to top employers. Recruiters hire verified candidates faster. Placement offices obtain audit-ready analytics.
              </p>
            </div>

            <ul className="space-y-2 pt-4 border-t border-[#A7D6C0]/40 text-xs text-[#1e4435] font-medium">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E9D74] shrink-0" />
                <span>100% audit log trail for every action</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E9D74] shrink-0" />
                <span>Zero placement policy violations</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E9D74] shrink-0" />
                <span>Comprehensive institutional placement reports</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
