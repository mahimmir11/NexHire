import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#EAF6F0] flex flex-col justify-between p-4 sm:p-8">
      {/* Background ambient decorative glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#A7D6C0]/40 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-[#2E9D74]/15 rounded-full blur-3xl"></div>
      </div>

      <header className="max-w-6xl mx-auto w-full pt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#2E9D74] to-[#61B795] flex items-center justify-center shadow-md shadow-[#2E9D74]/25 ring-2 ring-white">
            <span className="font-extrabold text-xl text-white">N</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#143026]">NexHire Security</span>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8 text-center">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-8 border border-[#A7D6C0] shadow-xl shadow-[#2E9D74]/5">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-[#143026] mb-2">403 Forbidden</h2>
          <p className="text-xs text-[#4b7161] leading-relaxed mb-6">
            You do not have the required permissions to access this page. Your account is assigned the role of{' '}
            <strong className="text-[#2E9D74]">{user?.role || 'Guest'}</strong>.
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2E9D74] hover:bg-[#258260] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/25 transition cursor-pointer"
          >
            Return to Authorized Portal
          </button>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto w-full pt-4 pb-2 text-center text-xs text-[#4b7161]">
        <p>NexHire &bull; Role-Based Authorization Shield</p>
      </footer>
    </div>
  );
};
