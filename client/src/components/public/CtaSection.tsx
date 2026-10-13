import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpen, LogIn } from 'lucide-react';

export const CtaSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#EAF6F0] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Striking Gradient Container */}
        <div className="relative rounded-3xl sm:rounded-4xl p-8 sm:p-14 md:p-16 overflow-hidden bg-gradient-to-r from-[#2E9D74] via-[#35a87d] to-[#61B795] text-white shadow-nexhire-lg">
          {/* Subtle geometric circles */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-wider text-white shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Career Gateway</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Your Next Opportunity Starts Here.
            </h2>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed font-normal max-w-2xl mx-auto">
              Discover, connect, apply, interview, and move closer to your career goals with NexHire.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-[#EAF6F0] text-[#143026] text-sm font-bold shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#2E9D74]" />
                <span>Login to NexHire</span>
                <ArrowRight className="w-4 h-4 text-[#2E9D74] transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                to="/blog"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-sm font-bold backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Preparation Guides</span>
              </Link>
            </div>

            <p className="pt-2 text-xs text-white/80 font-medium">
              Institutional Access for Verified Students, Faculty Placement Officers &amp; Partner Companies
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
