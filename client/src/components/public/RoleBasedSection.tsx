import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Users2,
} from 'lucide-react';

interface RoleCard {
  role: string;
  badge: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  highlights: string[];
  loginHint: string;
  accentBg: string;
}

const ROLES: RoleCard[] = [
  {
    role: 'Students',
    badge: 'STUDENT',
    tagline: 'Candidate Portal',
    description: 'Discover opportunities, track applications, manage interviews and follow your placement journey.',
    icon: GraduationCap,
    highlights: [
      'Comprehensive academic & skills profile',
      'Automated eligibility checking before applying',
      'Real-time interview slot & round tracking',
      'Digital offer letter acceptance & history',
    ],
    loginHint: 'student.demo@nexhire.local',
    accentBg: 'from-white to-[#EAF6F0]',
  },
  {
    role: 'Recruiters',
    badge: 'RECRUITER',
    tagline: 'Corporate Hiring',
    description: 'Find talent, manage opportunities, review applications and conduct recruitment efficiently.',
    icon: Building2,
    highlights: [
      'Direct job & internship opportunity posting',
      'Verified applicant filtering & shortlisting',
      'Multi-round interview scheduling & notes',
      'Formal offer letter release with CTC breakdown',
    ],
    loginHint: 'recruiter.demo@nexhire.local',
    accentBg: 'from-white via-[#F5FAF7] to-[#EAF6F0]',
  },
  {
    role: 'Placement Administrators',
    badge: 'PLACEMENT_ADMIN',
    tagline: 'Institutional Governance',
    description: 'Manage placements, monitor recruitment activity and gain meaningful insights.',
    icon: UserCheck,
    highlights: [
      'Company approval & drive oversight',
      'Real-time placement conversion verification',
      'Department-level placement statistics',
      'Comprehensive policy compliance auditing',
    ],
    loginHint: 'placement.officer.demo@nexhire.local',
    accentBg: 'from-white to-[#EAF6F0]',
  },
  {
    role: 'Super Admin',
    badge: 'SUPER_ADMIN',
    tagline: 'Complete System Control',
    description: 'Control and manage the complete NexHire ecosystem.',
    icon: ShieldAlert,
    highlights: [
      'Institutional user & department management',
      'System-wide settings & academic sessions',
      'Cryptographic RBAC security enforcement',
      'Immutable audit logging across all entities',
    ],
    loginHint: 'superadmin.demo@nexhire.local',
    accentBg: 'from-white via-[#EAF6F0] to-[#EAF6F0]',
  },
];

export const RoleBasedSection: React.FC = () => {
  return (
    <section id="roles" className="py-20 sm:py-28 bg-[#EAF6F0] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#A7D6C0]/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#61B795]/15 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#2E9D74] border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Users2 className="w-3.5 h-3.5" />
            <span>Dedicated Stakeholder Portals</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#143026] tracking-tight">
            Built for Everyone in the Placement Journey
          </h2>

          <p className="text-base sm:text-lg text-[#466a5b] leading-relaxed">
            NexHire unifies students, corporate recruiters, and college administrators into a synchronized, transparent ecosystem with tailored privileges.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                className={`rounded-3xl p-6 sm:p-7 bg-gradient-to-b ${item.accentBg} border border-[#A7D6C0]/70 hover:border-[#2E9D74] shadow-xs hover:shadow-nexhire-md transition-all duration-300 flex flex-col justify-between group`}
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#A7D6C0]/80 group-hover:bg-[#2E9D74] group-hover:text-white flex items-center justify-center text-[#2E9D74] shadow-2xs transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-white text-[#143026] border border-[#A7D6C0]/60">
                      {item.badge}
                    </span>
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-[#2E9D74] block mb-1">
                    {item.tagline}
                  </span>

                  <h3 className="text-xl font-extrabold text-[#143026] mb-3">
                    {item.role}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#466a5b] leading-relaxed mb-5">
                    "{item.description}"
                  </p>

                  {/* Highlights Checklist */}
                  <ul className="space-y-2 mb-6 pt-4 border-t border-[#A7D6C0]/40">
                    {item.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#1e4435]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9D74] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-4 border-t border-[#A7D6C0]/40">
                  <Link
                    to="/login"
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#2E9D74] text-[#143026] hover:text-white text-xs font-bold border border-[#A7D6C0]/70 hover:border-[#2E9D74] transition-all duration-200 flex items-center justify-center gap-1.5 shadow-2xs group-hover:shadow-xs"
                  >
                    <span>Sign In to {item.role}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
