import React from 'react';
import {
  UserCheck,
  Briefcase,
  CheckCheck,
  FileText,
  CalendarCheck2,
  Gift,
  Award,
  BellRing,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  category: string;
  description: string;
  badge: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: UserCheck,
    title: 'Student Profile Management',
    category: 'Student Hub',
    description: 'Comprehensive student profiles with verified academic credentials, certified skills, resumes, and departmental records.',
    badge: 'Core Profile',
  },
  {
    icon: Briefcase,
    title: 'Opportunity Discovery Engine',
    category: 'Corporate Listings',
    description: 'Curated repository of full-time campus jobs and internships with compensation structures, role criteria, and deadlines.',
    badge: 'Jobs & Internships',
  },
  {
    icon: CheckCheck,
    title: 'Smart Eligibility Verification',
    category: 'Automated Rules',
    description: 'Real-time rule engine that strictly validates minimum CGPA, active backlogs, department restrictions, and passing batches.',
    badge: 'Automated Compliance',
  },
  {
    icon: FileText,
    title: 'Live Application Pipeline',
    category: 'Recruitment Flow',
    description: 'One-click application submission with live status tracking across Applied, Under Review, Shortlisted, and Hired stages.',
    badge: 'Status Tracking',
  },
  {
    icon: CalendarCheck2,
    title: 'Multi-Round Interview Suite',
    category: 'Evaluation Pipeline',
    description: 'End-to-end scheduling for technical tests, coding assessments, and HR interviews with candidate feedback logging.',
    badge: 'Schedule Coordination',
  },
  {
    icon: Gift,
    title: 'Offer & Compensation Management',
    category: 'Offer Governance',
    description: 'Digital offer letter releases with CTC breakdown, base pay, formal acceptance deadlines, and institutional verification.',
    badge: 'Package Tracking',
  },
  {
    icon: Award,
    title: 'Verified Placement Records',
    category: 'Institutional Records',
    description: 'Automated conversion of accepted job offers into immutable campus placement records, eliminating duplicate offers.',
    badge: 'Final Conversion',
  },
  {
    icon: BellRing,
    title: 'Instant System Notifications',
    category: 'Real-Time Alerts',
    description: 'Instant alerts for interview invites, application status updates, newly posted opportunities, and critical deadlines.',
    badge: 'Live Broadcast',
  },
  {
    icon: BarChart3,
    title: 'Institutional Reports & Analytics',
    category: 'Analytics & Audits',
    description: 'Deep analytical dashboards detailing average & highest LPA, department placement ratios, recruiter metrics, and audit trails.',
    badge: 'Insights & Compliance',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[#EAF6F0] relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#A7D6C0]/25 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#61B795]/15 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#2E9D74] border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Comprehensive Platform Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#143026] tracking-tight">
            Designed for the Complete Placement Lifecycle
          </h2>

          <p className="text-base sm:text-lg text-[#466a5b] leading-relaxed">
            Every module in NexHire is purpose-built to eliminate administrative bottlenecks, maintain institutional integrity, and accelerate student success.
          </p>
        </div>

        {/* 9 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative bg-white/90 hover:bg-white rounded-3xl p-7 border border-[#A7D6C0]/60 hover:border-[#2E9D74]/70 shadow-xs hover:shadow-nexhire-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF6F0] group-hover:bg-[#2E9D74] border border-[#A7D6C0]/70 group-hover:border-[#2E9D74] flex items-center justify-center text-[#2E9D74] group-hover:text-white transition-all duration-300 shadow-2xs">
                      <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EAF6F0] text-[#1e4435] border border-[#A7D6C0]/50 group-hover:border-[#2E9D74]/40">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Category */}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E9D74] block mb-1">
                    {feature.category}
                  </span>

                  <h3 className="text-lg font-bold text-[#143026] group-hover:text-[#2E9D74] transition-colors mb-2.5">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#527566] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom subtle progress line */}
                <div className="mt-6 pt-4 border-t border-[#A7D6C0]/30 flex items-center justify-between text-xs text-[#2E9D74] font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                  <span>Module 0{idx + 1}</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
