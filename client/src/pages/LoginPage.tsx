import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NexHireLogo } from '../components/common/NexHireLogo';
import type { UserRole } from '../types/auth.types';
import {
  GraduationCap,
  Building2,
  UserCheck,
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const getDestinationForRole = (role?: UserRole | string): string => {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'RECRUITER':
      return '/recruiter/dashboard';
    case 'PLACEMENT_ADMIN':
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { user, isAuthenticated, login, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const rawFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // If already authenticated, redirect straight to their role's dashboard
  if (isAuthenticated && user) {
    const dest = getDestinationForRole(user.role);
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError('Please enter your registered email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your account password.');
      return;
    }

    // Authenticate with backend
    const authenticatedUser = await login(trimmedEmail, password);

    if (authenticatedUser) {
      const validRoles: UserRole[] = ['STUDENT', 'RECRUITER', 'PLACEMENT_ADMIN', 'SUPER_ADMIN'];
      if (!validRoles.includes(authenticatedUser.role)) {
        setFormError(`Your account role (${authenticatedUser.role}) is unauthorized. Please contact institutional IT.`);
        return;
      }

      // Automatically determine destination strictly from authenticated backend role
      const rolePrefix =
        authenticatedUser.role === 'STUDENT'
          ? '/student'
          : authenticatedUser.role === 'RECRUITER'
          ? '/recruiter'
          : '/admin';

      let destination = getDestinationForRole(authenticatedUser.role);

      // If user was previously trying to access a permitted sub-route of their role
      if (rawFrom && rawFrom.startsWith(rolePrefix) && !rawFrom.includes('/login')) {
        destination = rawFrom;
      }

      navigate(destination, { replace: true });
    }
  };

  const errorMessage = formError || authError;

  return (
    <div className="min-h-screen bg-[#EAF6F0] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#A7D6C0]/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[#61B795]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-[#2E9D74]/15 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between">
        <NexHireLogo size="md" withSubtitle={false} />

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#143026] hover:text-[#2E9D74] bg-white/80 hover:bg-white border border-[#A7D6C0]/70 transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Split-Screen Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Brand Showcase & Institutional Assurance (Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 border border-[#A7D6C0]/70 text-xs font-bold uppercase tracking-wider text-[#2E9D74] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Single Institutional Sign-On</span>
              </div>

              <h1 className="text-4xl font-black text-[#143026] tracking-tight leading-tight">
                Secure Institutional Access for Higher Education Placements
              </h1>

              <p className="text-sm text-[#466a5b] leading-relaxed">
                NexHire coordinates campus placement drives, automated eligibility validation, interview scheduling, and official offer letter releases across thousands of candidates.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-white/80 border border-[#A7D6C0]/60 flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#2E9D74]/15 flex items-center justify-center text-[#2E9D74] shrink-0 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#143026]">
                    Automated Role Recognition
                  </h4>
                  <p className="text-[11px] text-[#527566] leading-relaxed">
                    The backend verifies your institutional role and automatically directs you to your dedicated portal.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/80 border border-[#A7D6C0]/60 flex items-start gap-3 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-[#2E9D74]/15 flex items-center justify-center text-[#2E9D74] shrink-0 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#143026]">
                    Cryptographic Session Security
                  </h4>
                  <p className="text-[11px] text-[#527566] leading-relaxed">
                    Protected by bcrypt salted hashing, HTTP-only JWT credentials, and tamper-resistant audit logs.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-[#527566] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2E9D74]"></span>
              <span>Accreditation Ready &bull; NAAC / NBA Placement Registry Standard</span>
            </div>
          </div>

          {/* Right Column: Modern Authentication Card */}
          <div className="lg:col-span-6 max-w-md mx-auto w-full">
            <div className="glass-card rounded-3xl p-7 sm:p-9 border border-[#A7D6C0]/90 shadow-nexhire-lg bg-white/90 backdrop-blur-xl">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-[#143026] tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs text-[#466a5b] mt-1.5">
                  Sign in to continue to NexHire
                </p>
              </div>

              {/* Quick-Fill Demo Accounts */}
              <div className="mb-6 p-3 rounded-2xl bg-[#EAF6F0]/80 border border-[#A7D6C0]/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#466a5b] block mb-2 text-center">
                  Quick-Fill Demo Credentials (Click to Autofill)
                </span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('student.demo@nexhire.local');
                      setPassword('NexHire@2026!');
                      clearError();
                      setFormError(null);
                    }}
                    className="bg-white hover:bg-[#2E9D74] hover:text-white text-[#143026] py-2 px-2.5 rounded-xl border border-[#A7D6C0]/70 transition shadow-2xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('recruiter.demo@nexhire.local');
                      setPassword('NexHire@2026!');
                      clearError();
                      setFormError(null);
                    }}
                    className="bg-white hover:bg-[#2E9D74] hover:text-white text-[#143026] py-2 px-2.5 rounded-xl border border-[#A7D6C0]/70 transition shadow-2xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Recruiter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('placement.officer.demo@nexhire.local');
                      setPassword('NexHire@2026!');
                      clearError();
                      setFormError(null);
                    }}
                    className="bg-white hover:bg-[#2E9D74] hover:text-white text-[#143026] py-2 px-2.5 rounded-xl border border-[#A7D6C0]/70 transition shadow-2xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Placement Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail('superadmin.demo@nexhire.local');
                      setPassword('NexHire@2026!');
                      clearError();
                      setFormError(null);
                    }}
                    className="bg-white hover:bg-[#2E9D74] hover:text-white text-[#143026] py-2 px-2.5 rounded-xl border border-[#A7D6C0]/70 transition shadow-2xs text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Super Admin</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50/95 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-[#143026] mb-1.5">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#527566]" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="name@nexhire.local"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] placeholder-[#8baaa0] focus:outline-none focus:ring-2 focus:ring-[#2E9D74] focus:border-transparent transition shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-bold text-[#143026]">
                      Account Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-[#2E9D74] hover:text-[#258260] font-bold cursor-pointer flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#527566]" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#A7D6C0] bg-white text-xs text-[#143026] placeholder-[#8baaa0] focus:outline-none focus:ring-2 focus:ring-[#2E9D74] focus:border-transparent transition shadow-2xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2E9D74] to-[#61B795] hover:from-[#258260] hover:to-[#50a181] active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[#2E9D74]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Footnote */}
              <div className="mt-6 pt-4 border-t border-[#A7D6C0]/50 text-center">
                <p className="text-[11px] text-[#527566]">
                  Automatic redirection to your dashboard based on authenticated institutional role.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-[#527566]">
        <p>&copy; {new Date().getFullYear()} NexHire &bull; Campus Internship &amp; Placement Management System</p>
      </footer>
    </div>
  );
};
