import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/public/PublicLayout';
import { Home, BookOpen, SearchX } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <PublicLayout>
      <div className="py-16 sm:py-28 relative overflow-hidden flex items-center justify-center">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#A7D6C0]/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-md mx-auto px-4 text-center space-y-6">
          {/* 404 Visual Glyph */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center text-white shadow-nexhire-md">
              <SearchX className="w-12 h-12" />
            </div>
            <span className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-white text-[#2E9D74] text-xs font-black border border-[#A7D6C0] shadow-xs">
              404
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-[#143026] tracking-tight">
              Oops! This page doesn't exist.
            </h1>
            <p className="text-sm text-[#466a5b] leading-relaxed">
              The link you followed may be outdated, or the address may have been typed incorrectly. Let's get you back to the campus platform.
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/20 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to NexHire</span>
            </Link>

            <Link
              to="/blog"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-[#EAF6F0] text-[#143026] border border-[#A7D6C0] text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#2E9D74]" />
              <span>Browse Blog</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-[#A7D6C0]/40 text-xs text-[#527566]">
            Looking for your account?{' '}
            <Link to="/login" className="text-[#2E9D74] font-bold hover:underline">
              Sign In to Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
