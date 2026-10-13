import React from 'react';
import { Link } from 'react-router-dom';
import { NexHireLogo } from '../common/NexHireLogo';
import { ShieldCheck, CheckCircle2, GraduationCap, Building2, UserCheck, Lock } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#A7D6C0]/50 text-[#143026] relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A7D6C0]/15 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#A7D6C0]/40">
          {/* Column 1: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-6">
            <NexHireLogo size="md" withSubtitle={true} />
            <p className="text-sm text-[#466a5b] leading-relaxed max-w-sm">
              NexHire is an institutional campus internship and placement platform designed to streamline talent discovery, eligibility verification, interviews, and official offer governance.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-[#2E9D74]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF6F0] border border-[#A7D6C0]/60">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E9D74]" />
                Institutional Data Security
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF6F0] border border-[#A7D6C0]/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9D74]" />
                RBAC Protected
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#143026] mb-4">
              Platform Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-[#466a5b] hover:text-[#2E9D74] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#features" className="text-[#466a5b] hover:text-[#2E9D74] transition-colors">
                  Features &amp; Modules
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-[#466a5b] hover:text-[#2E9D74] transition-colors">
                  Placement Workflow
                </a>
              </li>
              <li>
                <a href="/#roles" className="text-[#466a5b] hover:text-[#2E9D74] transition-colors">
                  Stakeholder Roles
                </a>
              </li>
              <li>
                <Link to="/blog" className="text-[#466a5b] hover:text-[#2E9D74] transition-colors">
                  NexHire Blog &amp; Insights
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#466a5b] hover:text-[#2E9D74] transition-colors">
                  About Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#143026] mb-4">
              Institutional Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="text-[#466a5b] hover:text-[#2E9D74] flex items-center gap-1.5 transition-colors">
                  <GraduationCap className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>Student Portal</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#466a5b] hover:text-[#2E9D74] flex items-center gap-1.5 transition-colors">
                  <Building2 className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>Recruiter Portal</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#466a5b] hover:text-[#2E9D74] flex items-center gap-1.5 transition-colors">
                  <UserCheck className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>Placement Officer Portal</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-[#466a5b] hover:text-[#2E9D74] flex items-center gap-1.5 transition-colors">
                  <Lock className="w-3.5 h-3.5 text-[#2E9D74]" />
                  <span>Super Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Security & Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#143026] mb-4">
              Governance &amp; Trust
            </h4>
            <p className="text-xs text-[#527566] leading-relaxed mb-3">
              Audited campus placement lifecycle with strict role-based access, cryptographic credentials, and real-time eligibility automation.
            </p>
            <div className="p-3 rounded-xl bg-[#EAF6F0]/80 border border-[#A7D6C0]/50 text-[11px] text-[#2c5242]">
              <span className="font-bold block text-[#143026] mb-0.5">Campus Placement Cell</span>
              Unified coordination across Department Chairs, Corporate Relations &amp; Candidates.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#527566]">
          <div className="flex items-center gap-2">
            <span>&copy; {currentYear} NexHire. All rights reserved.</span>
            <span>&bull;</span>
            <span className="text-[#2E9D74] font-semibold">Campus Placement Infrastructure</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-[#2E9D74] transition-colors">
              Platform Architecture
            </Link>
            <span>&bull;</span>
            <Link to="/blog" className="hover:text-[#2E9D74] transition-colors">
              Student Preparation Guides
            </Link>
            <span>&bull;</span>
            <Link to="/login" className="text-[#2E9D74] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
