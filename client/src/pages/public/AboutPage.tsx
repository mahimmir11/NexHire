import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import {
  ShieldCheck,
  Target,
  CheckCircle2,
  Lock,
  ArrowRight,
  GraduationCap,
  Building2,
  UserCheck,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <PublicLayout>
      <div className="py-12 sm:py-20 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A7D6C0]/30 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#61B795]/15 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Hero Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#2E9D74] border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Target className="w-3.5 h-3.5" />
              <span>Institutional Mission &amp; Vision</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#143026] tracking-tight leading-tight">
              About NexHire
            </h1>

            <p className="text-lg sm:text-xl text-[#466a5b] leading-relaxed">
              NexHire is a centralized internship and campus placement management platform built to bring speed, transparency, and integrity to higher education recruitment drives.
            </p>
          </div>

          {/* Core Philosophy / Why It Exists */}
          <div className="glass-card rounded-3xl sm:rounded-4xl p-8 sm:p-12 border border-[#A7D6C0]/80 shadow-nexhire-md bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#2E9D74] bg-[#EAF6F0] px-3 py-1 rounded-full">
                  The Problem Solved
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#143026]">
                  Why Was NexHire Built?
                </h2>
                <p className="text-sm text-[#466a5b] leading-relaxed">
                  For decades, university placement offices have navigated the complex recruitment season using ad-hoc spreadsheets, scattered email threads, and paper forms.
                </p>
                <p className="text-sm text-[#466a5b] leading-relaxed">
                  This created accidental eligibility mismatches, missed interview rounds, duplicate offer hoarding, and zero real-time visibility for students.
                </p>
                <p className="text-sm text-[#143026] font-semibold">
                  NexHire replaces that operational chaos with a singular, cryptographic, role-authorized campus operating system.
                </p>
              </div>

              <div className="bg-[#EAF6F0] rounded-3xl p-6 sm:p-8 border border-[#A7D6C0]/70 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#143026]">
                  Key Architectural Imperatives
                </h3>

                <ul className="space-y-3 text-xs text-[#1e4435]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E9D74] shrink-0 mt-0.5" />
                    <span><strong>Automated Rule Verification:</strong> Candidate eligibility (CGPA, backlogs, department) verified in milliseconds before application submission.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E9D74] shrink-0 mt-0.5" />
                    <span><strong>Conflict-Free Placement:</strong> Enforces campus one-offer policies to guarantee equitable career opportunities for every student.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E9D74] shrink-0 mt-0.5" />
                    <span><strong>Complete Auditability:</strong> Non-repudiation audit trails across every job application, interview score, and accepted compensation package.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Who It Is Designed For */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-[#143026]">
                Who NexHire Is Designed For
              </h2>
              <p className="text-sm text-[#466a5b] mt-2">
                Four distinct stakeholder groups unified into a synchronized digital workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-[#A7D6C0]/60 shadow-xs hover:shadow-nexhire-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#143026] mb-1">
                  Students
                </h3>
                <p className="text-xs text-[#527566] leading-relaxed">
                  Discover career opportunities, track live application stages, attend structured interviews, and celebrate verified offers.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#A7D6C0]/60 shadow-xs hover:shadow-nexhire-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#143026] mb-1">
                  Recruiters
                </h3>
                <p className="text-xs text-[#527566] leading-relaxed">
                  Post verified vacancies, review pre-screened talent pools, coordinate multi-round evaluations, and release audited digital offers.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#A7D6C0]/60 shadow-xs hover:shadow-nexhire-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#143026] mb-1">
                  Placement Officers
                </h3>
                <p className="text-xs text-[#527566] leading-relaxed">
                  Verify candidate eligibility, orchestrate multi-company campus drives, and generate accreditation-ready institutional analytics.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-[#A7D6C0]/60 shadow-xs hover:shadow-nexhire-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#2E9D74]/15 text-[#2E9D74] flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#143026] mb-1">
                  University Leadership
                </h3>
                <p className="text-xs text-[#527566] leading-relaxed">
                  Monitor institutional placement trends, ensure regulatory compliance, and elevate campus corporate relations.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Cryptographic Integrity Standards */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#A7D6C0]/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E9D74] text-white flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#143026]">
                  Enterprise Institutional Security
                </h3>
                <span className="text-xs text-[#527566]">
                  Protected by industry standard cryptography and relational isolation
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs text-[#385e4f]">
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/40">
                <span className="font-bold text-[#143026] block">Bcrypt Credentials</span>
                <p>Salting and adaptive key stretching prevent credential exposure across all user levels.</p>
              </div>
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/40">
                <span className="font-bold text-[#143026] block">JWT Role Tokens</span>
                <p>Cryptographically signed session tokens guarantee that unauthorized role elevation is impossible.</p>
              </div>
              <div className="space-y-1.5 p-4 rounded-2xl bg-[#EAF6F0]/60 border border-[#A7D6C0]/40">
                <span className="font-bold text-[#143026] block">Relational Consistency</span>
                <p>ACID-compliant transactions eliminate race conditions during concurrent interview and application operations.</p>
              </div>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="text-center pt-6 space-y-4">
            <h3 className="text-2xl font-bold text-[#143026]">
              Experience the Future of Campus Placement
            </h3>
            <p className="text-sm text-[#466a5b] max-w-md mx-auto">
              Ready to explore your institutional portal? Log in with your university credentials today.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition-all cursor-pointer"
              >
                <span>Login to NexHire</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
