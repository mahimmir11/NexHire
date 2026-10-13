import React from 'react';
import { Link } from 'react-router-dom';
import type { ProfileCompletionDetails } from '../../types/student.types';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface ProfileCompletionCardProps {
  completion: ProfileCompletionDetails | null;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ completion }) => {
  if (!completion) return null;

  const score = completion.score;
  const isComplete = score >= 100;

  const sections = [
    { key: 'personal', label: 'Personal Details', data: completion.sections.personal, link: '/student/profile' },
    { key: 'academic', label: 'Academic Info', data: completion.sections.academic, link: '/student/academic' },
    { key: 'skills', label: 'Skills & Tools', data: completion.sections.skills, link: '/student/skills' },
    { key: 'career', label: 'Career Info', data: completion.sections.career, link: '/student/career' },
    { key: 'documents', label: 'Resume & Docs', data: completion.sections.documents, link: '/student/documents' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#A7D6C0] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A7D6C0]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#2E9D74]/15 text-[#2E9D74]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#143026]">Placement Profile Readiness</h3>
          </div>
          <p className="text-xs text-[#4b7161] mt-0.5">
            Complete your profile to increase visibility to recruiters and verify placement drive eligibility
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xl font-black text-[#2E9D74]">{score}%</span>
            <span className="text-[11px] text-[#5b8071] block font-medium">Profile Score</span>
          </div>
          <div className="h-10 w-10 rounded-full border-4 border-[#2E9D74] flex items-center justify-center font-bold text-xs bg-[#EAF6F0]">
            {score}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="py-4">
        <div className="w-full bg-[#EAF6F0] rounded-full h-3 border border-[#A7D6C0]/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2E9D74] via-[#61B795] to-[#2E9D74] transition-all duration-500 rounded-full"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Section Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
        {sections.map((sec) => (
          <Link
            key={sec.key}
            to={sec.link}
            className={`p-2.5 rounded-xl border text-xs transition flex flex-col justify-between group ${
              sec.data.isComplete
                ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
                : 'bg-[#EAF6F0]/60 border-[#A7D6C0] hover:bg-[#A7D6C0]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#143026] text-[11px] truncate">{sec.label}</span>
              {sec.data.isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#5b8071] font-mono">{sec.data.percentage}%</span>
              <span className="text-[#2E9D74] group-hover:translate-x-0.5 transition font-bold flex items-center">
                Edit &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recommendations if incomplete */}
      {!isComplete && completion.recommendations && completion.recommendations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#A7D6C0]/40">
          <p className="text-[11px] font-bold text-[#2a4d3e] uppercase tracking-wider mb-1.5">Action Items to Reach 100%:</p>
          <ul className="space-y-1 text-xs text-[#3b6051]">
            {completion.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E9D74] shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
